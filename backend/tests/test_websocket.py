import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

def test_websocket_telemetry_flow():
    client = TestClient(app)
    
    # 1. Login driver
    auth_res = client.post("/api/v1/auth/login", json={
        "username": "driver_blr",
        "password": "driver123"
    })
    token = auth_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. START EMERGENCY
    start_payload = {
        "vehicle_plate": "KA-01-EA-1088",
        "vehicle_type": "ambulance",
        "origin_lat": 12.9300,
        "origin_lon": 77.6200,
        "dest_lat": 12.9634,
        "dest_lon": 77.5756,
        "destination_name": "Victoria Hospital (BMCRI Trauma Centre)"
    }
    create_res = client.post("/api/v1/emergency/sessions", json=start_payload, headers=headers)
    assert create_res.status_code == 201
    session_id = create_res.json()["id"]

    # 3. Verify WebSocket rejects unauthenticated connection
    with client.websocket_connect(f"/api/v1/ws/telemetry/{session_id}") as unauth_ws:
        reject_data = unauth_ws.receive_json()
        assert reject_data["type"] == "AUTH_ERROR"

    # 4. Connect WebSocket with valid driver token for 500ms telemetry
    with client.websocket_connect(f"/api/v1/ws/telemetry/{session_id}?token={token}") as websocket:
        # Initial connect confirmation
        init_data = websocket.receive_json()
        assert init_data["type"] == "CONNECTED"
        assert init_data["expected_interval_ms"] == 500

        # Send 500ms telemetry frame
        frame = {
            "latitude": 12.9385,
            "longitude": 77.5997, # Approaching Dairy Circle
            "speed_kmh": 48.0,
            "heading_deg": 320.0,
            "accuracy_m": 4.0
        }
        websocket.send_json(frame)

        # Receive ACK and next signals feedback
        ack = websocket.receive_json()
        assert ack["type"] == "TELEMETRY_ACK"
        assert "next_signals" in ack
        assert "time_saved_seconds" in ack
        assert len(ack["next_signals"]) <= 3
