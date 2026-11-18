import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

def get_utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(64), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    full_name = Column(String(128), nullable=True)
    role = Column(String(32), nullable=False)  # admin, police_operator, emergency_driver
    agency = Column(String(128), nullable=True, default="Emergency Response Command")
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=True)  # G6 anti-spoofing: police operator approval for drivers
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    sessions = relationship("EmergencySession", back_populates="driver")

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plate_number = Column(String(32), unique=True, index=True, nullable=False)
    vehicle_type = Column(String(32), nullable=False)  # ambulance, fire_truck, police
    agency = Column(String(128), nullable=False)
    status = Column(String(32), default="idle")  # idle, in_service, emergency
    registered_driver_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    sessions = relationship("EmergencySession", back_populates="vehicle")

class EmergencySession(Base):
    __tablename__ = "emergency_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_code = Column(String(16), unique=True, index=True, nullable=False)
    vehicle_id = Column(String(36), ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(32), default="active")  # pending, active, completed, cancelled
    
    # Geolocation Origin and Destination
    origin_lat = Column(Float, nullable=False)
    origin_lon = Column(Float, nullable=False)
    dest_lat = Column(Float, nullable=False)
    dest_lon = Column(Float, nullable=False)
    destination_name = Column(String(128), nullable=True)
    
    # Baselines for Honest Metrics
    baseline_eta_seconds = Column(Float, nullable=False)
    actual_duration_seconds = Column(Float, nullable=True)
    time_saved_seconds = Column(Float, nullable=True)
    
    started_at = Column(DateTime(timezone=True), default=get_utc_now)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    driver = relationship("User", back_populates="sessions")
    vehicle = relationship("Vehicle", back_populates="sessions")
    telemetry = relationship("TelemetryLog", back_populates="session", cascade="all, delete-orphan")

class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(36), ForeignKey("emergency_sessions.id"), index=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=get_utc_now, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed_kmh = Column(Float, default=0.0)
    heading_deg = Column(Float, default=0.0)
    accuracy_m = Column(Float, default=5.0)
    is_anomaly = Column(Boolean, default=False)  # G6 anti-spoofing: flagged if speed > 120kmh or acc > 8m/s2

    session = relationship("EmergencySession", back_populates="telemetry")

class Intersection(Base):
    __tablename__ = "intersections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    intersection_code = Column(String(32), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    current_phase = Column(String(16), default="RED")  # GREEN, RED, AMBER
    is_corridor_active = Column(Boolean, default=False)
    azimuth_deg = Column(Float, default=0.0)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), nullable=False)
    action = Column(String(64), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=get_utc_now)

class RegistrationToken(Base):
    __tablename__ = "registration_tokens"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    token_hash = Column(String(64), unique=True, index=True, nullable=False)
    created_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    agency = Column(String(128), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    max_uses = Column(Integer, default=1)
    use_count = Column(Integer, default=0)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

class DriverRegistration(Base):
    __tablename__ = "driver_registrations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    full_name = Column(String(128), nullable=False)
    licence_number_normalized = Column(String(64), index=True, nullable=False)
    licence_image_path = Column(String(256), nullable=False)
    ocr_raw_text = Column(Text, nullable=True)
    ocr_extracted = Column(Text, nullable=True)  # JSON-encoded dict
    ocr_confidence = Column(Float, default=0.0)
    flags = Column(Text, nullable=True)  # JSON-encoded list of {code, severity, message}
    status = Column(String(32), default="pending")  # pending, approved, rejected, suspended
    agency = Column(String(128), nullable=False)
    allowed_vehicle_types = Column(Text, nullable=True)  # JSON list of vehicle types, e.g. ["ambulance"]
    reviewed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    retention_delete_after = Column(DateTime(timezone=True), nullable=True)

