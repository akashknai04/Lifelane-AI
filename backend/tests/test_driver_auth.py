import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.db.session import init_db
from backend.app.core.security import create_access_token

@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()
    yield

@pytest.mark.asyncio
async def test_driver_login_success():
    """Verify explicit driver authentication with valid credentials."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/auth/login", json={
            "username": "driver_blr",
            "password": "driver123"
        })
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["role"] == "emergency_driver"
        assert data["username"] == "driver_blr"
        assert data["full_name"] == "Paramedic Driver Rajesh K"
        assert "108" in data["agency"]

        # Validate that the token works against /auth/me
        me_res = await client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {data['access_token']}"
        })
        assert me_res.status_code == 200
        assert me_res.json()["username"] == "driver_blr"

@pytest.mark.asyncio
async def test_driver_login_bad_credentials():
    """Verify rejected authentication on bad password or invalid user."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        bad_pass = await client.post("/api/v1/auth/login", json={
            "username": "driver_blr",
            "password": "incorrect_password"
        })
        assert bad_pass.status_code == 401

        bad_user = await client.post("/api/v1/auth/login", json={
            "username": "non_existent_driver",
            "password": "password123"
        })
        assert bad_user.status_code == 401

@pytest.mark.asyncio
async def test_driver_role_boundaries():
    """Verify emergency_driver cannot access privileged admin operations."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        auth_res = await client.post("/api/v1/auth/login", json={
            "username": "driver_blr",
            "password": "driver123"
        })
        token = auth_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Telemetry purge requires admin role
        purge_res = await client.delete("/api/v1/telemetry/purge", headers=headers)
        assert purge_res.status_code == 403

        # Approving other drivers requires admin/operator role
        approve_res = await client.patch("/api/v1/auth/drivers/some-id/approve", headers=headers)
        assert approve_res.status_code == 403
