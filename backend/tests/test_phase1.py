import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.db.session import init_db

@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()
    yield

@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["telemetry_interval_ms"] == 500

@pytest.mark.asyncio
async def test_auth_login():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login with demo driver
        res = await client.post("/api/v1/auth/login", json={
            "username": "driver_blr",
            "password": "driver123"
        })
        assert res.status_code == 200
        token_data = res.json()
        assert "access_token" in token_data
        assert token_data["role"] == "emergency_driver"
        token = token_data["access_token"]

        # 2. Check /me with Bearer token
        me_res = await client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert me_res.status_code == 200
        assert me_res.json()["username"] == "driver_blr"

        # 3. Test invalid password
        bad_res = await client.post("/api/v1/auth/login", json={
            "username": "driver_blr",
            "password": "wrongpassword"
        })
        assert bad_res.status_code == 401

@pytest.mark.asyncio
async def test_emergency_lifecycle_and_telemetry():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login driver
        auth_res = await client.post("/api/v1/auth/login", json={
            "username": "driver_blr",
            "password": "driver123"
        })
        token = auth_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Step 1: START EMERGENCY
        start_payload = {
            "vehicle_plate": "KA-01-EA-1088",
            "vehicle_type": "ambulance",
            "origin_lat": 12.9300,
            "origin_lon": 77.6200,
            "dest_lat": 12.9634,
            "dest_lon": 77.5756,
            "destination_name": "Victoria Hospital (BMCRI Trauma Centre)"
        }
        create_res = await client.post("/api/v1/emergency/sessions", json=start_payload, headers=headers)
        assert create_res.status_code == 201
        session_data = create_res.json()
        session_id = session_data["id"]
        assert session_data["status"] == "active"
        assert session_data["baseline_eta_seconds"] > 0
        assert session_data["session_code"].startswith("LL-")

        # Step 2: Ingest 500ms telemetry frame
        telemetry_frame = {
            "latitude": 12.9380,
            "longitude": 77.6000,
            "speed_kmh": 45.0,
            "heading_deg": 325.0,
            "accuracy_m": 3.5
        }
        telem_res = await client.post(
            f"/api/v1/telemetry/ingest?session_id={session_id}",
            json=telemetry_frame
        )
        assert telem_res.status_code == 200
        telem_data = telem_res.json()
        assert telem_data["status"] == "success"
        assert "time_saved_seconds" in telem_data

        # Step 3: Check Active Sessions listing
        active_res = await client.get("/api/v1/emergency/sessions/active", headers=headers)
        assert active_res.status_code == 200
        active_list = active_res.json()
        assert len(active_list) >= 1
        assert any(s["id"] == session_id for s in active_list)

        # Step 4: Cancel Emergency Session
        cancel_res = await client.post(
            f"/api/v1/emergency/sessions/{session_id}/cancel",
            json={"reason": "Test mission arrived at hospital safely"},
            headers=headers
        )
        assert cancel_res.status_code == 200
        assert cancel_res.json()["status"] == "cancelled"
