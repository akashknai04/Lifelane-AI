from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    full_name: Optional[str] = None
    agency: Optional[str] = None
    user: Optional[Dict[str, Any]] = None

class UserOut(BaseModel):
    id: str
    username: str
    role: str
    full_name: Optional[str]
    agency: Optional[str]
    is_active: bool
    is_approved: bool = True

    model_config = ConfigDict(from_attributes=True)

# --- Emergency Session Schemas ---
class StartEmergencyRequest(BaseModel):
    vehicle_plate: str = Field(..., description="License plate or identifier of emergency vehicle")
    vehicle_type: str = Field(default="ambulance", description="ambulance, fire_truck, police")
    origin_lat: float = Field(..., ge=-90.0, le=90.0)
    origin_lon: float = Field(..., ge=-180.0, le=180.0)
    dest_lat: float = Field(..., ge=-90.0, le=90.0)
    dest_lon: float = Field(..., ge=-180.0, le=180.0)
    destination_name: str = Field(default="Victoria Hospital, Bengaluru")

class EmergencySessionOut(BaseModel):
    id: str
    session_code: str
    vehicle_id: str
    driver_id: str
    status: str
    origin_lat: float
    origin_lon: float
    dest_lat: float
    dest_lon: float
    destination_name: Optional[str]
    baseline_eta_seconds: float
    actual_duration_seconds: Optional[float] = None
    time_saved_seconds: Optional[float] = None
    started_at: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CancelEmergencyRequest(BaseModel):
    reason: Optional[str] = Field(default="Mission concluded or cancelled by operator")

# --- Telemetry Schemas (500 ms stream) ---
class TelemetryFrame(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    speed_kmh: float = Field(default=0.0, ge=0.0, le=250.0)
    heading_deg: float = Field(default=0.0, ge=0.0, le=360.0)
    accuracy_m: float = Field(default=5.0, ge=0.0)
    timestamp: Optional[datetime] = None

class TelemetryOut(BaseModel):
    session_id: str
    timestamp: datetime
    latitude: float
    longitude: float
    speed_kmh: float
    heading_deg: float
    accuracy_m: float

    class Config:
        from_attributes = True

# --- Intersection Schemas ---
class IntersectionOut(BaseModel):
    id: str
    intersection_code: str
    name: str
    latitude: float
    longitude: float
    current_phase: str
    is_corridor_active: bool
    azimuth_deg: float
    distance_to_vehicle_m: Optional[float] = None
    seconds_to_arrival: Optional[float] = None

    class Config:
        from_attributes = True

class IntersectionOverrideRequest(BaseModel):
    target_phase: str = Field(..., description="GREEN, RED, AMBER")
    duration_seconds: int = Field(default=30, ge=5, le=120)
    reason: str = Field(..., min_length=3, description="Audit reason for manual override")

# --- Driver Registration & Review Schemas ---
class CreateTokenRequest(BaseModel):
    agency: str = Field(default="108 GVK-EMRI Ambulance Service")
    expires_hours: int = Field(default=48, ge=1, le=720)
    max_uses: int = Field(default=1, ge=1, le=100)

class CreateTokenResponse(BaseModel):
    token: str
    token_id: str
    registration_url: str
    qr_code_data_url: str
    expires_at: datetime
    agency: str
    max_uses: int

class TokenCheckResponse(BaseModel):
    valid: bool
    message: str
    agency: Optional[str] = None

class FlagItem(BaseModel):
    code: str
    severity: str  # info, warning, critical
    message: str

class DriverRegistrationOut(BaseModel):
    id: str
    full_name: str
    licence_number_normalized: str
    status: str
    agency: str
    ocr_confidence: float
    ocr_extracted: Optional[Dict[str, Any]] = None
    flags: Optional[List[Dict[str, Any]]] = None
    allowed_vehicle_types: Optional[List[str]] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ApproveRegistrationRequest(BaseModel):
    allowed_vehicle_types: List[str] = Field(default=["ambulance"])
    notes: Optional[str] = None

class RejectRegistrationRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Mandatory reason for rejection")

class SuspendRegistrationRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Mandatory reason for suspension")

class RouteCalculationRequest(BaseModel):
    origin_lat: float = Field(..., description="Origin latitude")
    origin_lon: float = Field(..., description="Origin longitude")
    dest_lat: float = Field(..., description="Destination latitude")
    dest_lon: float = Field(..., description="Destination longitude")
    weather: Optional[str] = Field("CLEAR", description="CLEAR, MODERATE_RAIN, or WATERLOGGED")

class IncidentInjectionRequest(BaseModel):
    segment_key: str = Field(..., description="Edge key format: NODE_A->NODE_B")
    severity: int = Field(2, ge=1, le=3, description="Severity 1 to 3")
    description: Optional[str] = Field("Simulated congestion blockage", description="Incident note")

