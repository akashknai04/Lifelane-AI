"""
LifeLane AI — Vision & Incident Perception API (Phase 5)
Endpoints for YOLOv11 emergency vehicle perception and incident detection.
"""

from typing import Optional, List
from fastapi import APIRouter, File, UploadFile, Query, HTTPException
from ai.vision.detector import yolo_detector, VehicleClass
from ai.incident.incident_detector import incident_detector

router = APIRouter()


CCTV_CAMERA_FEEDS = [
    {"camera_id": "CAM-BLR-01", "name": "St. John's Hospital North Approach", "intersection": "INT-BLR-01", "fps": 25, "resolution": "1080p", "status": "ONLINE"},
    {"camera_id": "CAM-BLR-02", "name": "Dairy Circle Hosur Rd Inbound", "intersection": "INT-BLR-02", "fps": 30, "resolution": "1080p", "status": "ONLINE"},
    {"camera_id": "CAM-BLR-03", "name": "Adugodi Junction Bosch Flyover", "intersection": "INT-BLR-03", "fps": 25, "resolution": "1080p", "status": "ONLINE"},
    {"camera_id": "CAM-BLR-04", "name": "Richmond Circle Dual Level", "intersection": "INT-BLR-05", "fps": 30, "resolution": "1080p", "status": "ONLINE"},
    {"camera_id": "CAM-BLR-05", "name": "Corporation Circle Central Hub", "intersection": "INT-BLR-06", "fps": 30, "resolution": "1080p", "status": "ONLINE"},
    {"camera_id": "CAM-BLR-06", "name": "Manipal Hospital Old Airport Gantry", "intersection": "INT-BLR-14", "fps": 25, "resolution": "1080p", "status": "ONLINE"},
]


@router.get("/cameras")
async def list_cctv_cameras():
    """List all intersection CCTV camera perception feeds."""
    return CCTV_CAMERA_FEEDS


@router.post("/detect")
async def detect_emergency_vehicles(
    camera_id: str = Query("CAM-BLR-01"),
    simulate_vehicle: Optional[str] = Query(None, description="Optional injection: ambulance, fire_truck, police, civilian"),
    file: Optional[UploadFile] = File(None)
):
    """
    Performs YOLOv11 emergency vehicle perception on video frame or camera feed.
    Grounded in Noor et al. (2024), Applied Sciences.
    Guarantees sub-350 ms latency.
    """
    frame_bytes = None
    if file:
        frame_bytes = await file.read()

    res = yolo_detector.detect_frame(
        frame=frame_bytes or b"",
        camera_id=camera_id,
        simulate_emergency_vehicle=simulate_vehicle
    )
    return res


@router.get("/incident-check")
async def check_incident_anomaly(
    link_id: str = Query("L1-KORAMANGALA-DAIRY"),
    speeds_csv: str = Query("12.0,10.5,8.2,5.0", description="Comma-separated recent vehicle speeds in km/h"),
    historical_mean: float = Query(35.0),
    historical_std: float = Query(6.0),
    obstacle_detected: bool = Query(False)
):
    """
    Performs statistical anomaly detection on link speeds to detect road incidents.
    """
    try:
        speed_list = [float(s.strip()) for s in speeds_csv.split(",") if s.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid speeds format; provide comma-separated floats")

    return incident_detector.evaluate_link_telemetry(
        link_id=link_id,
        recent_speeds_kmh=speed_list,
        historical_mean_kmh=historical_mean,
        historical_std_kmh=historical_std,
        vision_detected_obstacle=obstacle_detected
    )
