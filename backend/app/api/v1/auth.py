from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.app.core.security import verify_password, hash_password, create_access_token
from backend.app.db.session import get_db
from backend.app.models.all_models import User
from backend.app.schemas.all_schemas import LoginRequest, TokenResponse, UserOut
from backend.app.api.v1.deps import get_current_user

router = APIRouter()

DEMO_SEED_USERS = [
    {
        "username": "admin",
        "password": "admin123",
        "role": "admin",
        "full_name": "LifeLane Municipal Administrator",
        "agency": "Bengaluru Traffic Police HQ"
    },
    {
        "username": "police_op",
        "password": "police123",
        "role": "police_operator",
        "full_name": "Traffic Command Operator #42",
        "agency": "Traffic Management Centre, Bengaluru"
    },
    {
        "username": "driver_blr",
        "password": "driver123",
        "role": "emergency_driver",
        "full_name": "Paramedic Driver Rajesh K",
        "agency": "108 GVK-EMRI Ambulance Service"
    }
]

from backend.app.core.config import settings

async def seed_demo_users_if_needed(db: AsyncSession):
    # Only seed demo users if running in demo environment
    if settings.APP_ENV.lower() != "demo":
        return
    for u in DEMO_SEED_USERS:
        result = await db.execute(select(User).where(User.username == u["username"]))
        existing = result.scalars().first()
        if not existing:
            new_user = User(
                username=u["username"],
                hashed_password=hash_password(u["password"]),
                role=u["role"],
                full_name=u["full_name"],
                agency=u["agency"],
                is_active=True,
                is_approved=True  # Pre-seed demo users as approved
            )
            db.add(new_user)
    await db.commit()

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Auto-seed demo users on first login call if database is fresh
    await seed_demo_users_if_needed(db)

    result = await db.execute(select(User).where(User.username == req.username))
    user = result.scalars().first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    token = create_access_token(
        subject=user.id,
        role=user.role,
        agency=user.agency
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        username=user.username,
        full_name=user.full_name,
        agency=user.agency,
        user={
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "full_name": user.full_name,
            "agency": user.agency
        }
    )

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/drivers/{driver_id}/approve")
async def approve_driver(
    driver_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """G6 anti-spoofing: Police Operator or Administrator approves newly registered emergency driver."""
    if current_user.role not in ("police_operator", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only police operators or administrators can approve emergency drivers"
        )
    
    result = await db.execute(select(User).where(User.id == driver_id))
    driver = result.scalars().first()
    if not driver:
        raise HTTPException(status_code=404, detail=f"Driver with ID {driver_id} not found")
    
    driver.is_approved = True
    await db.commit()
    return {
        "status": "approved",
        "driver_id": driver.id,
        "username": driver.username,
        "is_approved": True,
        "approved_by": current_user.username
    }

