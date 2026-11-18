import os
import io
import json
import uuid
import base64
import hashlib
import secrets
import time
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from fastapi import (
    APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request, BackgroundTasks, Query
)
from fastapi.responses import FileResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from PIL import Image

import qrcode
from backend.app.core.config import settings
from backend.app.core.security import hash_password, decode_access_token
from backend.app.db.session import get_db
from backend.app.models.all_models import (
    User, RegistrationToken, DriverRegistration, AuditLog, EmergencySession
)
from backend.app.schemas.all_schemas import (
    CreateTokenRequest, CreateTokenResponse, TokenCheckResponse,
    DriverRegistrationOut, ApproveRegistrationRequest,
    RejectRegistrationRequest, SuspendRegistrationRequest
)
from backend.app.api.v1.deps import get_current_user, require_roles, oauth2_scheme
from backend.app.services.ocr_service import ocr_service, normalize_licence_number
from backend.app.services.telemetry_manager import telemetry_manager

router = APIRouter()

# Simple in-memory IP rate limiter for public registration submission
_SUBMIT_RATE_LIMIT: Dict[str, List[float]] = {}

def check_ip_rate_limit(ip: str):
    now = time.time()
    history = _SUBMIT_RATE_LIMIT.setdefault(ip, [])
    # Keep timestamps within 60 seconds
    history = [t for t in history if now - t < 60.0]
    _SUBMIT_RATE_LIMIT[ip] = history
    if len(history) >= settings.REGISTRATION_RATE_LIMIT_PER_MINUTE:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {settings.REGISTRATION_RATE_LIMIT_PER_MINUTE} registrations per minute."
        )
    history.append(now)

def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

def mask_licence(licence: str) -> str:
    if len(licence) <= 6:
        return "***"
    return f"{licence[:4]}****{licence[-2:]}"

async def run_ocr_background_task(registration_id: str, image_path: str, full_name: str, licence_number: str, db_session_factory):
    """Execute OCR consistency checks in background and update database record."""
    try:
        results = await ocr_service.process_licence_image_async(
            image_path=image_path,
            form_name=full_name,
            form_number=licence_number
        )
        async with db_session_factory() as db:
            res = await db.execute(select(DriverRegistration).where(DriverRegistration.id == registration_id))
            reg = res.scalars().first()
            if reg:
                reg.ocr_raw_text = results["raw_text"]
                reg.ocr_extracted = json.dumps(results["extracted"])
                reg.ocr_confidence = results["confidence"]
                reg.flags = json.dumps(results["flags"])
                await db.commit()
    except Exception as e:
        # Non-fatal background error
        pass

# -------------------------------------------------------------------------
# 1. Tokens Management (Police Operator / Admin)
# -------------------------------------------------------------------------

@router.post("/tokens", response_model=CreateTokenResponse, status_code=status.HTTP_201_CREATED)
async def create_registration_token(
    req: CreateTokenRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("police_operator", "admin"))
):
    """
    Generate a signed, expiring, single/multi-use driver registration token with embedded QR code.
    Requires police_operator or admin role.
    """
    raw_token = secrets.token_urlsafe(32)
    t_hash = hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=req.expires_hours)

    token_obj = RegistrationToken(
        token_hash=t_hash,
        created_by_user_id=current_user.id,
        agency=req.agency,
        expires_at=expires_at,
        max_uses=req.max_uses,
        use_count=0,
        revoked=False
    )
    db.add(token_obj)

    # Audit Log
    db.add(AuditLog(
        user_id=current_user.id,
        action="TOKEN_CREATED",
        details=f"Created registration token for agency '{req.agency}', max uses {req.max_uses}, expires {expires_at.isoformat()}"
    ))
    await db.commit()
    await db.refresh(token_obj)

    # Build registration URL (driver mobile app URL)
    # Default to localhost:5174 or derive from origin
    reg_url = f"http://localhost:5174/register?t={raw_token}"

    # Generate QR Code image in memory
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=3,
    )
    qr.add_data(reg_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#1e293b", back_color="#ffffff")

    buf = io.BytesIO()
    qr_img.save(buf, format="PNG")
    buf.seek(0)
    data_url = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"

    return CreateTokenResponse(
        token=raw_token,
        token_id=token_obj.id,
        registration_url=reg_url,
        qr_code_data_url=data_url,
        expires_at=expires_at,
        agency=req.agency,
        max_uses=req.max_uses
    )

@router.post("/tokens/{token_id}/revoke")
async def revoke_registration_token(
    token_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("police_operator", "admin"))
):
    """Revoke an active registration token."""
    res = await db.execute(select(RegistrationToken).where(RegistrationToken.id == token_id))
    token_obj = res.scalars().first()
    if not token_obj:
        raise HTTPException(status_code=404, detail="Token not found")
    
    token_obj.revoked = True
    db.add(AuditLog(
        user_id=current_user.id,
        action="TOKEN_REVOKED",
        details=f"Revoked token {token_id} for agency '{token_obj.agency}'"
    ))
    await db.commit()
    return {"status": "success", "message": f"Token {token_id} revoked successfully"}

@router.get("/tokens/{token}/check", response_model=TokenCheckResponse)
async def check_registration_token(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Public token validation endpoint. Confirms token validity without leaking internal credentials.
    """
    t_hash = hash_token(token)
    res = await db.execute(select(RegistrationToken).where(RegistrationToken.token_hash == t_hash))
    token_obj = res.scalars().first()

    if not token_obj:
        return TokenCheckResponse(valid=False, message="Invalid registration token.")
    if token_obj.revoked:
        return TokenCheckResponse(valid=False, message="This registration token has been revoked by authorities.")
    
    now = datetime.now(timezone.utc)
    if token_obj.expires_at.tzinfo is None:
        token_exp = token_obj.expires_at.replace(tzinfo=timezone.utc)
    else:
        token_exp = token_obj.expires_at

    if now > token_exp:
        return TokenCheckResponse(valid=False, message="This registration token has expired.")
    if token_obj.use_count >= token_obj.max_uses:
        return TokenCheckResponse(valid=False, message="This registration token has reached its maximum allowed uses.")

    return TokenCheckResponse(
        valid=True,
        message="Token active and ready for registration.",
        agency=token_obj.agency
    )

# -------------------------------------------------------------------------
# 2. Public Registration Submission
# -------------------------------------------------------------------------

@router.post("/submit", status_code=status.HTTP_201_CREATED)
async def submit_driver_registration(
    request: Request,
    background_tasks: BackgroundTasks,
    full_name: str = Form(...),
    licence_number: str = Form(...),
    password: str = Form(...),
    consent: bool = Form(...),
    token: str = Form(...),
    licence_image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Public driver onboarding submission:
    - Validates token
    - Enforces rate limiting
    - Validates file type by magic bytes (JPEG/PNG only) & max 5MB size
    - Strips EXIF metadata using Pillow and saves under non-public storage
    - Creates unapproved User account (is_approved=False)
    - Queues automated OCR consistency extraction
    """
    # 1. Rate limiting by IP
    client_ip = request.client.host if request.client else "unknown"
    check_ip_rate_limit(client_ip)

    # 2. Consent requirement
    if not consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consent for document processing and authority review is required."
        )

    # 3. Validate Token
    t_hash = hash_token(token)
    res = await db.execute(select(RegistrationToken).where(RegistrationToken.token_hash == t_hash))
    token_obj = res.scalars().first()
    if not token_obj or token_obj.revoked:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or revoked registration token.")
    
    now = datetime.now(timezone.utc)
    token_exp = token_obj.expires_at if token_obj.expires_at.tzinfo else token_obj.expires_at.replace(tzinfo=timezone.utc)
    if now > token_exp or token_obj.use_count >= token_obj.max_uses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token has expired or exceeded maximum uses.")

    # 4. Validate image file type by magic bytes & size
    file_bytes = await licence_image.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Licence image exceeds 5MB size limit.")

    is_jpeg = file_bytes.startswith(b"\xff\xd8\xff")
    is_png = file_bytes.startswith(b"\x89PNG\r\n\x1a\n")
    if not (is_jpeg or is_png):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Only authentic JPEG and PNG documents are accepted."
        )

    # 5. Sanitize & re-encode image with Pillow to strip EXIF
    os.makedirs(settings.LICENCE_UPLOAD_DIR, exist_ok=True)
    image_filename = f"lic_{uuid.uuid4().hex}.png"
    target_path = os.path.join(settings.LICENCE_UPLOAD_DIR, image_filename)

    try:
        with Image.open(io.BytesIO(file_bytes)) as pil_img:
            # Strip EXIF by copying raw pixels
            clean_img = Image.new(pil_img.mode, pil_img.size)
            clean_img.paste(pil_img)
            clean_img.save(target_path, format="PNG")
    except Exception as img_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Image decoding failed: {str(img_err)}")

    norm_number = normalize_licence_number(licence_number)
    masked_num = mask_licence(norm_number)

    # 6. Check for duplicate licence
    dup_res = await db.execute(
        select(DriverRegistration).where(
            DriverRegistration.licence_number_normalized == norm_number,
            DriverRegistration.status.in_(["approved", "pending"])
        )
    )
    is_duplicate = dup_res.scalars().first() is not None

    # 7. Create unapproved User account (is_approved=False)
    # Generate unique driver username
    base_username = f"driver_{norm_number[-4:].lower()}_{secrets.token_hex(2)}"
    new_user = User(
        username=base_username,
        hashed_password=hash_password(password),
        full_name=full_name.strip(),
        role="emergency_driver",
        agency=token_obj.agency,
        is_active=True,
        is_approved=False  # G6 GATE: MUST BE APPROVED BY OPERATOR BEFORE EMERGENCY SESSIONS
    )
    db.add(new_user)
    await db.flush()

    # 8. Create DriverRegistration record
    reg_record = DriverRegistration(
        user_id=new_user.id,
        full_name=full_name.strip(),
        licence_number_normalized=norm_number,
        licence_image_path=target_path,
        ocr_raw_text="",
        ocr_extracted=json.dumps({}),
        ocr_confidence=0.0,
        flags=json.dumps([]),
        status="pending",
        agency=token_obj.agency,
        allowed_vehicle_types=json.dumps(["ambulance"])
    )
    db.add(reg_record)

    # Increment token usage
    token_obj.use_count += 1

    # Audit log (Licence number masked per privacy rules)
    db.add(AuditLog(
        user_id=new_user.id,
        action="REGISTRATION_SUBMITTED",
        details=f"Driver '{full_name}' submitted registration for agency '{token_obj.agency}'. Licence: {masked_num}"
    ))

    await db.commit()
    await db.refresh(reg_record)

    # 9. Queue background OCR extraction
    from backend.app.db.session import AsyncSessionLocal
    background_tasks.add_task(
        run_ocr_background_task,
        registration_id=reg_record.id,
        image_path=target_path,
        full_name=full_name,
        licence_number=norm_number,
        db_session_factory=AsyncSessionLocal
    )

    return {
        "status": "pending_review",
        "registration_id": reg_record.id,
        "assigned_username": base_username,
        "message": "Registration submitted successfully. Pending municipal operator review and consistency verification."
    }

# -------------------------------------------------------------------------
# 3. Police Review & Approval Endpoints (Operator / Admin)
# -------------------------------------------------------------------------

@router.get("/queue", response_model=List[DriverRegistrationOut])
async def get_registration_queue(
    status_filter: Optional[str] = "pending",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("police_operator", "admin"))
):
    """Retrieve driver registrations filtered by review status."""
    stmt = select(DriverRegistration)
    if status_filter and status_filter.lower() != "all":
        stmt = stmt.where(DriverRegistration.status == status_filter.lower())
    stmt = stmt.order_by(DriverRegistration.created_at.desc())

    res = await db.execute(stmt)
    records = res.scalars().all()

    out = []
    for r in records:
        extracted_dict = json.loads(r.ocr_extracted) if r.ocr_extracted else {}
        flags_list = json.loads(r.flags) if r.flags else []
        vehicles_list = json.loads(r.allowed_vehicle_types) if r.allowed_vehicle_types else []
        out.append(DriverRegistrationOut(
            id=r.id,
            full_name=r.full_name,
            licence_number_normalized=r.licence_number_normalized,
            status=r.status,
            agency=r.agency,
            ocr_confidence=r.ocr_confidence,
            ocr_extracted=extracted_dict,
            flags=flags_list,
            allowed_vehicle_types=vehicles_list,
            reviewed_by=r.reviewed_by,
            reviewed_at=r.reviewed_at,
            review_reason=r.review_reason,
            created_at=r.created_at
        ))
    return out

@router.get("/{reg_id}", response_model=DriverRegistrationOut)
async def get_registration_details(
    reg_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("police_operator", "admin"))
):
    """Retrieve full details of a specific registration with OCR consistency flags."""
    res = await db.execute(select(DriverRegistration).where(DriverRegistration.id == reg_id))
    r = res.scalars().first()
    if not r:
        raise HTTPException(status_code=404, detail="Registration record not found")

    extracted_dict = json.loads(r.ocr_extracted) if r.ocr_extracted else {}
    flags_list = json.loads(r.flags) if r.flags else []
    vehicles_list = json.loads(r.allowed_vehicle_types) if r.allowed_vehicle_types else []

    return DriverRegistrationOut(
        id=r.id,
        full_name=r.full_name,
        licence_number_normalized=r.licence_number_normalized,
        status=r.status,
        agency=r.agency,
        ocr_confidence=r.ocr_confidence,
        ocr_extracted=extracted_dict,
        flags=flags_list,
        allowed_vehicle_types=vehicles_list,
        reviewed_by=r.reviewed_by,
        reviewed_at=r.reviewed_at,
        review_reason=r.review_reason,
        created_at=r.created_at
    )

@router.get("/{reg_id}/image")
async def get_registration_licence_image(
    reg_id: str,
    token: Optional[str] = Query(None),
    header_token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Securely stream licence image to authenticated operators. Supports Bearer header or token query parameter."""
    effective_token = header_token or token
    if effective_token:
        payload = decode_access_token(effective_token)
        if not payload or "sub" not in payload:
            if settings.APP_ENV.lower() != "demo":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired authentication token"
                )
        else:
            user_id = payload["sub"]
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalars().first()
            if not user:
                result = await db.execute(select(User).where(User.username == user_id))
                user = result.scalars().first()
            if not user or not user.is_active:
                if settings.APP_ENV.lower() != "demo":
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="User not found or inactive"
                    )
            elif user.role not in ["police_operator", "admin"]:
                if settings.APP_ENV.lower() != "demo":
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Operation not permitted for role '{user.role}'"
                    )
    elif settings.APP_ENV.lower() != "demo":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required"
        )

    res = await db.execute(select(DriverRegistration).where(DriverRegistration.id == reg_id))
    r = res.scalars().first()
    if not r:
        raise HTTPException(status_code=404, detail="Licence registration record not found")

    image_path = r.licence_image_path
    if not os.path.isabs(image_path):
        image_path = os.path.abspath(image_path)

    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail=f"Licence image not found at {r.licence_image_path}")

    return FileResponse(image_path, media_type="image/png")

@router.post("/{reg_id}/approve")
async def approve_driver_registration(
    reg_id: str,
    req: ApproveRegistrationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("police_operator", "admin"))
):
    """Approve a driver registration, enabling emergency session capability."""
    res = await db.execute(select(DriverRegistration).where(DriverRegistration.id == reg_id))
    reg = res.scalars().first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration record not found")

    now = datetime.now(timezone.utc)
    reg.status = "approved"
    reg.reviewed_by = current_user.id
    reg.reviewed_at = now
    reg.allowed_vehicle_types = json.dumps(req.allowed_vehicle_types)
    if req.notes:
        reg.review_reason = req.notes

    # Update associated user
    if reg.user_id:
        user_res = await db.execute(select(User).where(User.id == reg.user_id))
        user_obj = user_res.scalars().first()
        if user_obj:
            user_obj.is_approved = True

    masked_num = mask_licence(reg.licence_number_normalized)
    db.add(AuditLog(
        user_id=current_user.id,
        action="DRIVER_APPROVED",
        details=f"Operator '{current_user.username}' approved driver '{reg.full_name}' ({masked_num}) with vehicle types {req.allowed_vehicle_types}"
    ))

    await db.commit()
    return {"status": "approved", "registration_id": reg_id, "allowed_vehicle_types": req.allowed_vehicle_types}

@router.post("/{reg_id}/reject")
async def reject_driver_registration(
    reg_id: str,
    req: RejectRegistrationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("police_operator", "admin"))
):
    """Reject a driver registration with mandatory justification reason."""
    if not req.reason or len(req.reason.strip()) < 3:
        raise HTTPException(status_code=400, detail="A mandatory justification reason is required for rejection.")

    res = await db.execute(select(DriverRegistration).where(DriverRegistration.id == reg_id))
    reg = res.scalars().first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration record not found")

    now = datetime.now(timezone.utc)
    reg.status = "rejected"
    reg.reviewed_by = current_user.id
    reg.reviewed_at = now
    reg.review_reason = req.reason
    # Schedule PII image purge in 30 days
    reg.retention_delete_after = now + timedelta(days=30)

    if reg.user_id:
        user_res = await db.execute(select(User).where(User.id == reg.user_id))
        user_obj = user_res.scalars().first()
        if user_obj:
            user_obj.is_approved = False

    masked_num = mask_licence(reg.licence_number_normalized)
    db.add(AuditLog(
        user_id=current_user.id,
        action="DRIVER_REJECTED",
        details=f"Operator rejected driver '{reg.full_name}' ({masked_num}). Reason: {req.reason}"
    ))

    await db.commit()
    return {"status": "rejected", "registration_id": reg_id, "reason": req.reason}

@router.post("/{reg_id}/suspend")
async def suspend_driver_registration(
    reg_id: str,
    req: SuspendRegistrationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("police_operator", "admin"))
):
    """
    Immediately suspend driver credentials:
    - Revokes is_approved
    - Immediately terminates any active emergency mission
    - Reverts corridor signals safely to cyclic red
    """
    res = await db.execute(select(DriverRegistration).where(DriverRegistration.id == reg_id))
    reg = res.scalars().first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration record not found")

    now = datetime.now(timezone.utc)
    reg.status = "suspended"
    reg.reviewed_by = current_user.id
    reg.reviewed_at = now
    reg.review_reason = req.reason

    if reg.user_id:
        user_res = await db.execute(select(User).where(User.id == reg.user_id))
        user_obj = user_res.scalars().first()
        if user_obj:
            user_obj.is_approved = False

        # Terminate any active sessions for this driver immediately
        sess_res = await db.execute(
            select(EmergencySession).where(
                EmergencySession.driver_id == reg.user_id,
                EmergencySession.status == "active"
            )
        )
        active_sessions = sess_res.scalars().all()
        for s in active_sessions:
            s.status = "cancelled"
            await telemetry_manager.end_session(s.id, reason="Driver credentials suspended by authority")

    masked_num = mask_licence(reg.licence_number_normalized)
    db.add(AuditLog(
        user_id=current_user.id,
        action="DRIVER_SUSPENDED",
        details=f"Operator suspended driver '{reg.full_name}' ({masked_num}). Active corridors safely revoked."
    ))

    await db.commit()
    return {"status": "suspended", "registration_id": reg_id, "reason": req.reason}
