import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "LifeLane AI"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Security & Auth
    APP_ENV: str = os.getenv("APP_ENV", "demo")  # demo, development, production
    JWT_SECRET: str = os.getenv("JWT_SECRET", "lifelane_super_secret_jwt_key_2026_dev_mode")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Database
    # Default to PostgreSQL/PostGIS, with auto-fallback to SQLite for standalone local testing
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./lifelane.db"
    )
    
    # Redis Cache & Message Broker
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # MQTT
    MQTT_BROKER_HOST: str = os.getenv("MQTT_BROKER_HOST", "localhost")
    MQTT_BROKER_PORT: int = int(os.getenv("MQTT_BROKER_PORT", "1883"))
    
    # Telemetry Parameters
    TELEMETRY_INTERVAL_MS: int = 500
    TELEMETRY_TIMEOUT_SECONDS: float = 3.0  # Fail-safe timeout per G7
    
    # Registration & OCR Settings
    LICENCE_UPLOAD_DIR: str = os.getenv("LICENCE_UPLOAD_DIR", "backend/data/licences")
    REGISTRATION_TOKEN_EXPIRE_HOURS: int = int(os.getenv("REGISTRATION_TOKEN_EXPIRE_HOURS", "48"))
    REGISTRATION_RATE_LIMIT_PER_MINUTE: int = int(os.getenv("REGISTRATION_RATE_LIMIT_PER_MINUTE", "10"))
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "")
    
    # OSRM & Routing Service Settings
    OSRM_BASE_URL: str = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org")

    # Default City Corridor
    CITY_NAME: str = "Bengaluru, India"
    CITY_BBOX: List[float] = [12.920, 77.580, 12.985, 77.650] # [min_lat, min_lon, max_lat, max_lon]
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        case_sensitive = True

settings = Settings()
