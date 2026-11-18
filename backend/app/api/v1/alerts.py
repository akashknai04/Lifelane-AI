"""
LifeLane AI — Driver Alert & Diversion API (Phase 5)
Endpoints for Variable Message Signs (VMS), consumer navigation webhooks, C-V2X, and traffic diversion.
"""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from backend.app.services.alerts import alert_dispatcher
from backend.app.services.diversion import diversion_engine

router = APIRouter()


@router.get("/vms")
async def get_roadside_vms_boards():
    """Retrieve status and active messages of all roadside Variable Message Signs."""
    return alert_dispatcher.get_vms_boards()


@router.get("/active")
async def get_recent_broadcasts():
    """Retrieve recent multi-channel alert broadcasts."""
    return {
        "count": len(alert_dispatcher.active_broadcasts),
        "broadcasts": alert_dispatcher.active_broadcasts
    }


@router.post("/broadcast")
async def dispatch_emergency_alert(
    session_id: str = Query(..., description="Active emergency session code"),
    vehicle_type: str = Query("ambulance", description="ambulance, fire_truck, police"),
    current_lat: float = Query(12.9380),
    current_lon: float = Query(77.6000),
    speed_mps: float = Query(14.0),
    heading_deg: float = Query(320.0)
):
    """
    Broadcasts multi-channel civilian warnings within 500m radius, 30–45s lead time.
    Updates roadside VMS displays, prepares navigation push payload, and broadcasts C-V2X EVA packets.
    """
    res = alert_dispatcher.dispatch_alerts(
        session_id=session_id,
        vehicle_type=vehicle_type,
        current_lat=current_lat,
        current_lon=current_lon,
        speed_mps=speed_mps,
        heading_deg=heading_deg
    )
    return res


@router.post("/diversion")
async def calculate_traffic_diversion(
    corridor_name: str = Query("HOSUR_MAIN_ROAD", description="Corridor to divert from"),
    session_id: str = Query("EMERGENCY-DIVERSION-01"),
    civilian_flow_rate_vph: int = Query(1400, ge=100, le=10000)
):
    """
    Phase 5: Traffic Diversion Engine calculation (Workflow Step 7).
    Grounded in Duan et al. (2022).
    Evaluates parallel bypass routing while strictly bounding added civilian delay to < 90s.
    """
    plan = diversion_engine.calculate_diversion_plan(
        corridor_name=corridor_name,
        active_emergency_session_id=session_id,
        civilian_flow_rate_vph=civilian_flow_rate_vph
    )
    return plan
