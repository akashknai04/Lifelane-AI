import io
import json
import pytest
import pytest_asyncio
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from PIL import Image

from backend.app.main import app
from backend.app.db.session import init_db
from backend.app.models.all_models import AuditLog, DriverRegistration, User
from backend.app.services.ocr_service import ocr_service, normalize_licence_number

def create_synthetic_image(fmt="PNG"):
    img = Image.new("RGB", (400, 250), color=(240, 240, 240))
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()

@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()
    yield

@pytest.mark.asyncio
async def test_ocr_consistency_checks_unit():
    """Unit test OCR consistency check logic against known fixture strings."""
    # 1. Valid Karnataka Driving Licence
    valid_flags = ocr_service.run_consistency_checks(
        form_name="Ramesh Kumar",
        form_number="KA0120180004567",
        extracted={
            "licence_number": "KA0120180004567",
            "name": "Ramesh Kumar",
            "expiry_date": "2030-05-15",
            "issue_date": "2018-05-15"
        },
        confidence=90.0
    )
    # Should have no critical or warning flags
    assert not any(f["severity"] in ("critical", "warning") for f in valid_flags)

    # 2. Number mismatch & Unknown state code
    bad_state_flags = ocr_service.run_consistency_checks(
        form_name="Ramesh Kumar",
        form_number="ZZ0120180004567",  # Unknown state ZZ
        extracted={"licence_number": "KA0120180004567"},
        confidence=80.0
    )
    codes = [f["code"] for f in bad_state_flags]
    assert "STATE_CODE_UNKNOWN" in codes
    assert "NUMBER_MISMATCH" in codes

    # 3. Name mismatch & Expired licence
    mismatch_flags = ocr_service.run_consistency_checks(
        form_name="Ramesh Kumar",
        form_number="KA0120180004567",
        extracted={
            "licence_number": "KA0120180004567",
            "name": "Suresh Patel",  # Name mismatch
            "expiry_date": "2020-01-01"  # Expired
        },
        confidence=85.0
    )
    mismatch_codes = [f["code"] for f in mismatch_flags]
    assert "NAME_MISMATCH" in mismatch_codes
    assert "EXPIRED" in mismatch_codes

    # 4. Duplicate licence
    dup_flags = ocr_service.run_consistency_checks(
        form_name="Ramesh Kumar",
        form_number="KA0120180004567",
        extracted={},
        confidence=0.0,
        is_duplicate=True
    )
    assert any(f["code"] == "DUPLICATE_LICENCE" for f in dup_flags)

@pytest.mark.asyncio
async def test_token_lifecycle_and_rbac():
    """Verify police/admin role required for tokens, and check validation endpoint."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login driver (must be denied token generation)
        driver_login = await client.post("/api/v1/auth/login", json={"username": "driver_blr", "password": "driver123"})
        driver_token = driver_login.json()["access_token"]
        
        token_attempt = await client.post(
            "/api/v1/registration/tokens",
            json={"agency": "108 BLR", "expires_hours": 24, "max_uses": 1},
            headers={"Authorization": f"Bearer {driver_token}"}
        )
        assert token_attempt.status_code == 403  # Forbidden for emergency_driver

        # Login police operator
        police_login = await client.post("/api/v1/auth/login", json={"username": "police_op", "password": "police123"})
        police_token = police_login.json()["access_token"]

        create_res = await client.post(
            "/api/v1/registration/tokens",
            json={"agency": "108 GVK-EMRI", "expires_hours": 24, "max_uses": 1},
            headers={"Authorization": f"Bearer {police_token}"}
        )
        assert create_res.status_code == 201
        data = create_res.json()
        assert "token" in data
        assert "qr_code_data_url" in data
        assert data["qr_code_data_url"].startswith("data:image/png;base64,")
        raw_token = data["token"]
        token_id = data["token_id"]

        # Public check endpoint validates token
        check_res = await client.get(f"/api/v1/registration/tokens/{raw_token}/check")
        assert check_res.status_code == 200
        assert check_res.json()["valid"] is True

        # Revoke token
        revoke_res = await client.post(
            f"/api/v1/registration/tokens/{token_id}/revoke",
            headers={"Authorization": f"Bearer {police_token}"}
        )
        assert revoke_res.status_code == 200

        # Check endpoint now reports revoked
        check_revoked = await client.get(f"/api/v1/registration/tokens/{raw_token}/check")
        assert check_revoked.status_code == 200
        assert check_revoked.json()["valid"] is False

@pytest.mark.asyncio
async def test_registration_submission_and_file_validation():
    """Verify registration rejects invalid files and accepts clean PNG/JPEG with token."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create valid token
        admin_login = await client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
        admin_token = admin_login.json()["access_token"]
        create_res = await client.post(
            "/api/v1/registration/tokens",
            json={"agency": "108 Service", "expires_hours": 24, "max_uses": 2},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        raw_token = create_res.json()["token"]

        # 1. Reject invalid file type (e.g. plain text masquerading as image)
        bad_file = ("bad.png", b"NOT_A_REAL_IMAGE_BYTES", "image/png")
        bad_submit = await client.post(
            "/api/v1/registration/submit",
            data={
                "full_name": "Test Driver",
                "licence_number": "KA0120200009999",
                "password": "securepass123",
                "consent": "true",
                "token": raw_token
            },
            files={"licence_image": bad_file}
        )
        assert bad_submit.status_code == 400

        # 2. Reject missing consent
        png_bytes = create_synthetic_image("PNG")
        good_file = ("licence.png", png_bytes, "image/png")
        no_consent = await client.post(
            "/api/v1/registration/submit",
            data={
                "full_name": "Test Driver",
                "licence_number": "KA0120200009999",
                "password": "securepass123",
                "consent": "false",
                "token": raw_token
            },
            files={"licence_image": good_file}
        )
        assert no_consent.status_code == 400

        # 3. Valid submission
        good_submit = await client.post(
            "/api/v1/registration/submit",
            data={
                "full_name": "Deepak Sharma",
                "licence_number": "KA0420190001122",
                "password": "mypassword123",
                "consent": "true",
                "token": raw_token
            },
            files={"licence_image": ("licence.png", png_bytes, "image/png")}
        )
        assert good_submit.status_code == 201
        res_data = good_submit.json()
        assert res_data["status"] == "pending_review"
        reg_id = res_data["registration_id"]
        driver_username = res_data["assigned_username"]

        # Verify unapproved driver cannot start an emergency session
        driver_login = await client.post("/api/v1/auth/login", json={
            "username": driver_username,
            "password": "mypassword123"
        })
        assert driver_login.status_code == 200
        unapproved_token = driver_login.json()["access_token"]

        start_attempt = await client.post(
            "/api/v1/emergency/sessions",
            json={
                "vehicle_plate": "KA-01-EA-7788",
                "vehicle_type": "ambulance",
                "origin_lat": 12.9300,
                "origin_lon": 77.6200,
                "dest_lat": 12.9634,
                "dest_lon": 77.5756,
                "destination_name": "Victoria Hospital"
            },
            headers={"Authorization": f"Bearer {unapproved_token}"}
        )
        # Blocked because is_approved=False
        assert start_attempt.status_code == 403

        # Operator approves driver
        approve_res = await client.post(
            f"/api/v1/registration/{reg_id}/approve",
            json={"allowed_vehicle_types": ["ambulance"]},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert approve_res.status_code == 200

        # Now approved driver CAN start emergency session
        start_success = await client.post(
            "/api/v1/emergency/sessions",
            json={
                "vehicle_plate": "KA-01-EA-7788",
                "vehicle_type": "ambulance",
                "origin_lat": 12.9300,
                "origin_lon": 77.6200,
                "dest_lat": 12.9634,
                "dest_lon": 77.5756,
                "destination_name": "Victoria Hospital"
            },
            headers={"Authorization": f"Bearer {unapproved_token}"}
        )
        assert start_success.status_code == 201
        session_id = start_success.json()["id"]

        # Operator suspends driver
        suspend_res = await client.post(
            f"/api/v1/registration/{reg_id}/suspend",
            json={"reason": "Suspension per municipal inquiry"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert suspend_res.status_code == 200

        # Session was immediately cancelled
        session_check = await client.get("/api/v1/emergency/sessions/active", headers={"Authorization": f"Bearer {admin_token}"})
        active_ids = [s["id"] for s in session_check.json()]
        assert session_id not in active_ids

@pytest.mark.asyncio
async def test_rejection_requires_reason():
    """Verify rejection without reason is rejected."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        admin_login = await client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
        admin_token = admin_login.json()["access_token"]

        bad_reject = await client.post(
            "/api/v1/registration/dummy-id/reject",
            json={"reason": "  "},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert bad_reject.status_code in (400, 422)
