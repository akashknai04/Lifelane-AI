"""
Tests for Phase 5: Vision & Multi-Channel Civilian Alerts + Traffic Diversion
"""

import numpy as np
import pytest
from httpx import AsyncClient, ASGITransport
from ai.vision.detector import yolo_detector, VehicleClass
from ai.incident.incident_detector import incident_detector, IncidentSeverity
from backend.app.services.alerts import alert_dispatcher
from backend.app.services.diversion import diversion_engine
from backend.app.main import app


def test_yolo_detector_latency_and_output():
    """Verify YOLOv11 sub-350ms latency benchmark and output structure (Noor et al. 2024)."""
    dummy_frame = np.zeros((720, 1280, 3), dtype=np.uint8)
    res = yolo_detector.detect_frame(dummy_frame, camera_id="CAM-TEST-01")

    assert res["camera_id"] == "CAM-TEST-01"
    assert res["inference_time_ms"] < 350.0
    assert res["latency_compliant"] is True
    assert "Noor et al." in res["citation"]
    assert isinstance(res["detections"], list)
    assert len(res["detections"]) > 0


def test_yolo_detector_emergency_vehicle_classes():
    """Verify emergency vehicle detection for ambulance, fire truck, police."""
    dummy_frame = np.zeros((720, 1280, 3), dtype=np.uint8)

    for ev_class in [VehicleClass.AMBULANCE, VehicleClass.FIRE_TRUCK, VehicleClass.POLICE]:
        res = yolo_detector.detect_frame(dummy_frame, simulate_emergency_vehicle=ev_class)
        assert res["emergency_detected"] is True
        assert res["highest_confidence"] >= 0.85
        assert any(d["class"] == ev_class and d["is_emergency"] is True for d in res["detections"])


def test_incident_detector_statistical_anomalies():
    """Verify Incident Detection AI statistical variance filter and severity classifications."""
    # Normal speeds (35 km/h mean) -> No incident
    res_normal = incident_detector.evaluate_link_telemetry(
        link_id="L-TEST",
        recent_speeds_kmh=[34.0, 36.0, 35.0, 33.0],
        historical_mean_kmh=35.0,
        historical_std_kmh=4.0
    )
    assert res_normal["incident_detected"] is False

    # Speed drop > 3σ (e.g. down to 10 km/h) -> Level 2 Incident
    res_l2 = incident_detector.evaluate_link_telemetry(
        link_id="L-TEST",
        recent_speeds_kmh=[12.0, 10.0, 9.0, 11.0],
        historical_mean_kmh=35.0,
        historical_std_kmh=4.0
    )
    assert res_l2["incident_detected"] is True
    assert res_l2["severity"] in (IncidentSeverity.LEVEL_2, IncidentSeverity.LEVEL_3)
    assert res_l2["z_score"] >= 3.0

    # Vision detected obstacle or zero speed -> Level 3 Incident
    res_l3 = incident_detector.evaluate_link_telemetry(
        link_id="L-TEST",
        recent_speeds_kmh=[2.0, 1.0],
        historical_mean_kmh=35.0,
        historical_std_kmh=4.0,
        vision_detected_obstacle=True
    )
    assert res_l3["incident_detected"] is True
    assert res_l3["severity"] == IncidentSeverity.LEVEL_3
    assert res_l3["clearance_penalty_minutes"] >= 20.0


def test_alert_dispatcher_500m_radius_and_multichannel():
    """Verify alert dispatcher triggers VMS boards within 500m and formats C-V2X/nav push."""
    alert_dispatcher.reset_all_vms()

    # Place vehicle right next to Dairy Circle VMS-02 (12.9380, 77.6000)
    res = alert_dispatcher.dispatch_alerts(
        session_id="SESS-TEST-ALERT",
        vehicle_type="ambulance",
        current_lat=12.9382,
        current_lon=77.6002,
        speed_mps=15.0,
        heading_deg=330.0
    )

    assert res["session_id"] == "SESS-TEST-ALERT"
    assert res["activated_vms_count"] >= 1
    # Check VMS message contains emergency directive
    assert "MOVE TO LEFT" in res["activated_vms"][0]["message"]
    # Check Navigation Push payload
    assert res["navigation_push"]["alert_radius_meters"] == 500.0
    assert res["navigation_push"]["action_directive"] == "YIELD_TO_LEFT"
    # Check C-V2X SAE J2735 EVA packet
    assert res["cv2x_packet"]["standard"] == "SAE_J2735_EVA"
    assert res["cv2x_packet"]["vehicle_class"] == "AMBULANCE"


def test_traffic_diversion_engine_90s_delay_cap():
    """Verify traffic diversion engine enforces strict < 90s civilian delay bound (Duan et al. 2022)."""
    plan = diversion_engine.calculate_diversion_plan(
        corridor_name="HOSUR_MAIN_ROAD",
        active_emergency_session_id="SESS-DIV-01",
        civilian_flow_rate_vph=1500
    )

    assert plan["delay_bound_satisfied"] is True
    assert plan["added_civilian_delay_seconds"] <= 90.0
    assert 0.0 <= plan["traffic_congestion_index_tci"] <= 1.0
    assert "Duan et al." in plan["citation"]
    assert plan["honesty_badge"] == "Projected target"


@pytest.mark.asyncio
async def test_vision_and_alerts_api():
    """Verify FastAPI endpoints for Vision CCTV feeds and Alert dispatching."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Cameras listing
        resp = await client.get("/api/v1/vision/cameras")
        assert resp.status_code == 200
        cams = resp.json()
        assert len(cams) >= 5

        # 2. Vision detect endpoint
        resp_detect = await client.post("/api/v1/vision/detect?camera_id=CAM-BLR-01&simulate_vehicle=ambulance")
        assert resp_detect.status_code == 200
        det_data = resp_detect.json()
        assert det_data["emergency_detected"] is True
        assert det_data["inference_time_ms"] < 350.0

        # 3. Incident check endpoint
        resp_inc = await client.get("/api/v1/vision/incident-check?link_id=L1&speeds_csv=8.0,7.5,6.0&historical_mean=35.0")
        assert resp_inc.status_code == 200
        assert resp_inc.json()["incident_detected"] is True

        # 4. VMS boards
        resp_vms = await client.get("/api/v1/alerts/vms")
        assert resp_vms.status_code == 200
        assert len(resp_vms.json()) >= 5

        # 5. Alert broadcast
        resp_bcast = await client.post("/api/v1/alerts/broadcast?session_id=TEST-API&vehicle_type=fire_truck&current_lat=12.9380&current_lon=77.6000")
        assert resp_bcast.status_code == 200
        assert resp_bcast.json()["session_id"] == "TEST-API"

        # 6. Diversion calculation
        resp_div = await client.post("/api/v1/alerts/diversion?corridor_name=RICHMOND_CORRIDOR")
        assert resp_div.status_code == 200
        div_data = resp_div.json()
        assert div_data["added_civilian_delay_seconds"] <= 90.0
