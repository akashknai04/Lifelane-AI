from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.db.session import get_db
from backend.app.models.all_models import Intersection, AuditLog, User
from backend.app.schemas.all_schemas import IntersectionOut, IntersectionOverrideRequest
from backend.app.api.v1.deps import require_roles, get_current_user
from backend.app.services.osm_service import osm_service
from simulation.controllers import signal_network
from ai.signals.controller_agent import SignalTimingAgent

router = APIRouter()

@router.get("", response_model=List[IntersectionOut])
async def list_intersections(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all municipal smart intersections in the district."""
    # Query database or seed from osm_service
    res = await db.execute(select(Intersection))
    records = res.scalars().all()
    if not records:
        # Seed intersections from OSM corridor service
        for item in osm_service.get_all_intersections():
            db_int = Intersection(
                intersection_code=item["intersection_code"],
                name=item["name"],
                latitude=item["latitude"],
                longitude=item["longitude"],
                current_phase="RED",
                is_corridor_active=False,
                azimuth_deg=item.get("azimuth_deg", 0.0)
            )
            db.add(db_int)
        await db.commit()
        res = await db.execute(select(Intersection))
        records = res.scalars().all()

    return records

@router.get("/hospitals")
async def list_hospitals():
    """List major medical and trauma center destinations."""
    return osm_service.get_all_hospitals()

@router.post("/{intersection_code}/override")
async def manual_signal_override(
    intersection_code: str,
    req: IntersectionOverrideRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("police_operator", "admin"))
):
    """
    Traffic Police Manual Override (Workflow Step 10 & Objective 5).
    Allows operators to force signal phase with mandatory audit reason logging.
    """
    res = await db.execute(select(Intersection).where(Intersection.intersection_code == intersection_code))
    intersection = res.scalars().first()
    if not intersection:
        raise HTTPException(status_code=404, detail="Intersection code not found")

    prev_phase = intersection.current_phase
    intersection.current_phase = req.target_phase
    intersection.is_corridor_active = (req.target_phase == "GREEN")

    # Record tamper-evident audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="MANUAL_SIGNAL_OVERRIDE",
        details=f"Operator {current_user.username} overridden {intersection_code} from {prev_phase} to {req.target_phase} for {req.duration_seconds}s. Reason: {req.reason}"
    )
    db.add(audit)
    await db.commit()
    await db.refresh(intersection)

    return {
        "status": "success",
        "intersection_code": intersection_code,
        "new_phase": intersection.current_phase,
        "duration_seconds": req.duration_seconds,
        "operator": current_user.username
    }


@router.get("/controllers/status")
async def get_controllers_status():
    """
    Phase 4: Adaptive Signal Control Network Status.
    Returns live controller states across all smart intersections in the network.
    """
    return {
        "count": len(signal_network.controllers),
        "controllers": signal_network.get_network_status()
    }


@router.get("/controllers/timing-recommendation")
async def get_timing_recommendation(
    speed_mps: float = Query(12.0, ge=1.0, le=45.0, description="Vehicle speed in m/s"),
    distance_m: float = Query(350.0, ge=10.0, le=5000.0, description="Distance to intersection in meters"),
    cross_queue_vehicles: int = Query(4, ge=0, le=50, description="Estimated waiting cross-traffic queue depth")
):
    """
    Phase 4: Adaptive Signal Timing AI calculation (Module 3).
    Computes optimal pre-green trigger offset, green hold duration, and queue clearance.
    """
    return SignalTimingAgent.calculate_timing_window(
        speed_mps=speed_mps,
        distance_m=distance_m,
        cross_queue_vehicles=cross_queue_vehicles
    )


@router.post("/controllers/{intersection_code}/preempt")
async def trigger_controller_preemption(
    intersection_code: str,
    eta_seconds: float = Query(..., ge=0.0, le=300.0),
    distance_meters: float = Query(..., ge=0.0, le=5000.0),
    session_id: str = Query("DEMO-MANUAL-ACTUATION")
):
    """
    Directly tests preemption actuation on an individual intersection controller.
    """
    ctrl = signal_network.get_controller(intersection_code)
    if not ctrl:
        raise HTTPException(status_code=404, detail=f"Controller {intersection_code} not found")

    status = ctrl.request_preemption(
        session_id=session_id,
        eta_seconds=eta_seconds,
        distance_meters=distance_meters
    )
    return status

