import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import ValidationError

from backend.app.schemas.all_schemas import TelemetryFrame
from backend.app.services.telemetry_manager import telemetry_manager, TelemetryRateLimitExceeded
from backend.app.core.security import decode_access_token
from sqlalchemy.future import select
from backend.app.db.session import get_db, AsyncSessionLocal
from backend.app.api.v1.deps import require_roles
from backend.app.models.all_models import User

router = APIRouter()

@router.websocket("/ws/telemetry/{session_id}")
async def websocket_telemetry_endpoint(websocket: WebSocket, session_id: str, token: Optional[str] = Query(None)):
    """
    Subsystem 01: Vehicle Tracking & Communication (Slide 5, Methodology Step 1)
    Persistent bidirectional WebSocket receiving GPS location, speed, and heading
    every 500 ms from the emergency vehicle client.
    Enforces JWT authentication per G6 anti-spoofing requirements.
    """
    # 1. Authenticate token
    if not token:
        await websocket.accept()
        await websocket.send_json({
            "type": "AUTH_ERROR",
            "message": "Authentication token query parameter ?token=... is required."
        })
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = decode_access_token(token)
    if not payload or payload.get("role") not in ("emergency_driver", "admin", "police_operator"):
        await websocket.accept()
        await websocket.send_json({
            "type": "AUTH_ERROR",
            "message": "Unauthorized: Valid emergency_driver or admin token required."
        })
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Check driver approval status in database (G6 gate: cannot rely solely on JWT)
    async with AsyncSessionLocal() as db:
        user_id = payload.get("sub")
        user_res = await db.execute(select(User).where(User.id == user_id))
        user_obj = user_res.scalars().first()
        if not user_obj:
            user_res = await db.execute(select(User).where(User.username == user_id))
            user_obj = user_res.scalars().first()

        if not user_obj or not user_obj.is_active or not getattr(user_obj, "is_approved", True):
            await websocket.accept()
            await websocket.send_json({
                "type": "AUTH_ERROR",
                "message": "Access denied: Driver credentials are unapproved, suspended, or inactive."
            })
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    # 2. Check session exists
    session = telemetry_manager.get_session(session_id)
    if not session:
        await websocket.accept()
        await websocket.send_json({
            "type": "ERROR",
            "message": f"Session {session_id} not registered. Call POST /api/v1/emergency/sessions first."
        })
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return


    await websocket.accept()
    await telemetry_manager.register_driver_socket(session_id, websocket)

    try:
        # Send initial confirmation
        await websocket.send_json({
            "type": "CONNECTED",
            "session_id": session_id,
            "session_code": session["session_code"],
            "driver_id": payload.get("sub"),
            "expected_interval_ms": 500,
            "corridor_signals_count": len(session["intersections"])
        })

        while True:
            # Receive 500 ms telemetry frame or control message from driver app
            data_text = await websocket.receive_text()
            try:
                raw_data = json.loads(data_text)
                if isinstance(raw_data, dict) and raw_data.get("type") in ("GET_ROUTE", "ROUTE_REQUEST"):
                    cur_session = telemetry_manager.get_session(session_id)
                    if cur_session and "route" in cur_session:
                        await websocket.send_json({
                            "type": "ROUTE_UPDATE",
                            "session_id": session_id,
                            "route": cur_session["route"],
                            "destination": cur_session["destination"],
                            "intersections": cur_session["intersections"]
                        })
                    continue
                frame = TelemetryFrame(**raw_data).model_dump()
            except (json.JSONDecodeError, ValidationError) as e:
                await websocket.send_json({
                    "type": "FRAME_ERROR",
                    "error": str(e)
                })
                continue

            try:
                # Ingest frame, evaluate corridor pre-clearing & anti-spoofing
                updated_session = await telemetry_manager.ingest_telemetry(session_id, frame)
            except TelemetryRateLimitExceeded as e:
                await websocket.send_json({
                    "type": "RATE_LIMIT_EXCEEDED",
                    "error": str(e)
                })
                continue

            # Send back HUD feedback to driver client
            next_signals = [
                {
                    "code": sig["intersection_code"],
                    "name": sig["name"],
                    "phase": sig["phase"],
                    "timing_mode": sig.get("timing_mode", "CYCLIC"),
                    "distance_m": sig.get("distance_m", 0.0),
                    "seconds_until_arrival": sig.get("seconds_until_arrival", 0.0),
                    "is_cleared": sig["is_corridor_active"] and sig["phase"] == "GREEN"
                }
                for sig in updated_session["intersections"]
                if sig.get("distance_m", 9999.0) > 10.0  # signals still ahead
            ][:3]  # Return next 3 signals (2-3 intersections ahead per Deck Slide 11)

            # Lean 500 ms TELEMETRY_ACK payload (no heavy geometry)
            await websocket.send_json({
                "type": "TELEMETRY_ACK",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "time_saved_seconds": updated_session["time_saved_seconds"],
                "time_saved_metric_type": "Simulated estimate",
                "remaining_distance_m": updated_session.get("remaining_distance_m", 0.0),
                "eta_s": updated_session.get("eta_s", 0.0),
                "next_instruction": updated_session.get("next_instruction", "Proceed to destination"),
                "off_route": updated_session.get("is_off_route", False),
                "active_corridor_signals": updated_session["active_corridor_intersections"],
                "next_signals": next_signals,
                "is_anomaly": updated_session["current_telemetry"].get("is_anomaly", False)
            })

    except WebSocketDisconnect:
        await telemetry_manager.unregister_driver_socket(session_id)
    except Exception:
        await telemetry_manager.unregister_driver_socket(session_id)

@router.post("/telemetry/ingest")
async def ingest_telemetry_rest(session_id: str, frame: TelemetryFrame):
    """HTTP REST fallback endpoint for 500 ms telemetry ingestion."""
    try:
        session = await telemetry_manager.ingest_telemetry(session_id, frame.model_dump())
        return {
            "status": "success",
            "session_id": session_id,
            "time_saved_seconds": session["time_saved_seconds"],
            "time_saved_metric_type": "Simulated estimate",
            "active_corridor": session["active_corridor_intersections"]
        }
    except TelemetryRateLimitExceeded as e:
        raise HTTPException(status_code=429, detail=str(e))
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/telemetry/purge")
async def purge_telemetry_logs(
    retention_days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin"))
):
    """G5 & Checkpoint 2 Requirement: Purge time-series GPS telemetry and rejected licence images older than retention window (default: 30 days)."""
    import os
    from backend.app.models.all_models import DriverRegistration
    
    deleted_count = await telemetry_manager.purge_stale_telemetry(db, retention_days=retention_days)
    
    # Purge rejected licence images exceeding retention date
    now = datetime.now(timezone.utc)
    rej_res = await db.execute(
        select(DriverRegistration).where(
            DriverRegistration.status == "rejected",
            DriverRegistration.retention_delete_after <= now
        )
    )
    purged_images = 0
    for reg in rej_res.scalars().all():
        if reg.licence_image_path and os.path.exists(reg.licence_image_path):
            try:
                os.remove(reg.licence_image_path)
                purged_images += 1
            except Exception:
                pass
        reg.licence_image_path = "[PURGED_PER_PII_RETENTION_POLICY]"
    await db.commit()

    return {
        "status": "success",
        "retention_days": retention_days,
        "purged_records": deleted_count,
        "purged_licence_images": purged_images,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

