from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from backend.app.services.telemetry_manager import telemetry_manager
from backend.app.core.security import decode_access_token

router = APIRouter()

@router.websocket("/ws/police")
async def websocket_police_endpoint(websocket: WebSocket, token: Optional[str] = Query(None)):
    """
    Tier 3 / Workflow Step 10: Police Control Dashboard live stream.
    Broadcasts real-time vehicle positions, active corridors, signal phase changes,
    and stale telemetry warnings.
    Enforces JWT authentication per G5/G6 security controls.
    """
    if not token:
        await websocket.accept()
        await websocket.send_json({
            "type": "AUTH_ERROR",
            "message": "Authentication token query parameter ?token=... is required."
        })
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = decode_access_token(token)
    if not payload or payload.get("role") not in ("police_operator", "admin"):
        await websocket.accept()
        await websocket.send_json({
            "type": "AUTH_ERROR",
            "message": "Unauthorized: Operator or Administrator clearance required."
        })
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    await telemetry_manager.register_police_subscriber(websocket)
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "CONNECTED",
            "operator_id": payload.get("sub"),
            "role": payload.get("role"),
            "active_sessions_count": len(telemetry_manager.get_active_sessions())
        })
        while True:
            # Keep connection open, handle client ping/commands if any
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        await telemetry_manager.unregister_police_subscriber(websocket)
    except Exception:
        await telemetry_manager.unregister_police_subscriber(websocket)
