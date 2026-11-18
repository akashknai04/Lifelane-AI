import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.db.session import get_db
import json
from backend.app.models.all_models import User, Vehicle, EmergencySession, AuditLog, DriverRegistration
from backend.app.schemas.all_schemas import (
    StartEmergencyRequest,
    EmergencySessionOut,
    CancelEmergencyRequest
)
from backend.app.api.v1.deps import get_current_user, require_roles
from backend.app.services.osm_service import osm_service
from backend.app.services.telemetry_manager import telemetry_manager

router = APIRouter()

def generate_session_code() -> str:
    # Human-friendly mission code, e.g. LL-2026-F894A1
    random_suffix = uuid.uuid4().hex[:6].upper()
    return f"LL-{datetime.now().year}-{random_suffix}"

@router.post("/sessions", response_model=EmergencySessionOut, status_code=status.HTTP_201_CREATED)
async def start_emergency_session(
    req: StartEmergencyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("emergency_driver", "admin", "police_operator"))
):
    """
    Step 1 of 10-Step Workflow:
    Driver presses START EMERGENCY. Registers new mission, computes baseline unassisted ETA,
    and initializes the predictive corridor state machine.
    """
    # G6 anti-spoofing: Emergency drivers must be approved by an operator
    if current_user.role == "emergency_driver":
        if not getattr(current_user, "is_approved", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Emergency driver registration is pending operator approval (G6 anti-spoofing protection)."
            )
        # Check allowed vehicle types if registration exists
        reg_res = await db.execute(
            select(DriverRegistration).where(DriverRegistration.user_id == current_user.id)
        )
        reg = reg_res.scalars().first()
        if reg and reg.allowed_vehicle_types:
            try:
                allowed_types = json.loads(reg.allowed_vehicle_types)
                if allowed_types and req.vehicle_type not in allowed_types:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Vehicle type '{req.vehicle_type}' is not authorized for driver '{current_user.full_name}'. Authorized types: {allowed_types}"
                    )
            except Exception:
                pass


    # 1. Resolve or create vehicle
    res = await db.execute(select(Vehicle).where(Vehicle.plate_number == req.vehicle_plate))
    vehicle = res.scalars().first()
    if not vehicle:
        vehicle = Vehicle(
            plate_number=req.vehicle_plate,
            vehicle_type=req.vehicle_type,
            agency=current_user.agency or "Emergency Command",
            status="emergency",
            registered_driver_id=current_user.id
        )
        db.add(vehicle)
        await db.flush()
    else:
        vehicle.status = "emergency"

    # 2. Calculate unassisted baseline ETA for honest metrics
    baseline_eta = osm_service.calculate_baseline_eta_seconds(
        req.origin_lat, req.origin_lon, req.dest_lat, req.dest_lon
    )

    # 3. Create Emergency Session record
    session_id = str(uuid.uuid4())
    session_code = generate_session_code()
    now = datetime.now(timezone.utc)

    emergency_session = EmergencySession(
        id=session_id,
        session_code=session_code,
        vehicle_id=vehicle.id,
        driver_id=current_user.id,
        status="active",
        origin_lat=req.origin_lat,
        origin_lon=req.origin_lon,
        dest_lat=req.dest_lat,
        dest_lon=req.dest_lon,
        destination_name=req.destination_name,
        baseline_eta_seconds=baseline_eta,
        started_at=now
    )
    db.add(emergency_session)

    # 4. Log Audit
    audit = AuditLog(
        user_id=current_user.id,
        action="START_EMERGENCY",
        details=f"Session {session_code} initiated for vehicle {req.vehicle_plate} to {req.destination_name}"
    )
    db.add(audit)
    await db.commit()
    await db.refresh(emergency_session)

    # 5. Register with Live Telemetry Orchestrator
    await telemetry_manager.register_session(
        session_id=session_id,
        session_code=session_code,
        vehicle_id=vehicle.id,
        driver_id=current_user.id,
        origin_lat=req.origin_lat,
        origin_lon=req.origin_lon,
        dest_lat=req.dest_lat,
        dest_lon=req.dest_lon,
        destination_name=req.destination_name,
        baseline_eta_seconds=baseline_eta
    )

    return emergency_session

@router.get("/sessions/active", response_model=List[EmergencySessionOut])
async def list_active_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all active emergency vehicle corridors."""
    res = await db.execute(
        select(EmergencySession).where(EmergencySession.status == "active").order_by(EmergencySession.started_at.desc())
    )
    return res.scalars().all()

@router.get("/sessions/{session_id}", response_model=EmergencySessionOut)
async def get_session_details(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(select(EmergencySession).where(EmergencySession.id == session_id))
    session = res.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Emergency session not found")
    return session

@router.post("/sessions/{session_id}/cancel", response_model=EmergencySessionOut)
async def cancel_emergency_session(
    session_id: str,
    req: CancelEmergencyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("emergency_driver", "police_operator", "admin"))
):
    """Cancel emergency session and safely revert signals."""
    res = await db.execute(select(EmergencySession).where(EmergencySession.id == session_id))
    session = res.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Emergency session not found")
    
    now = datetime.now(timezone.utc)
    session.status = "cancelled"
    session.ended_at = now
    
    # Update vehicle status
    v_res = await db.execute(select(Vehicle).where(Vehicle.id == session.vehicle_id))
    vehicle = v_res.scalars().first()
    if vehicle:
        vehicle.status = "idle"

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="CANCEL_EMERGENCY",
        details=f"Session {session.session_code} cancelled. Reason: {req.reason}"
    )
    db.add(audit)
    await db.commit()
    await db.refresh(session)

    # Revert signals in telemetry manager
    await telemetry_manager.end_session(session_id, reason=req.reason)

    return session
