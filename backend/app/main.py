import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.db.session import init_db
from backend.app.api.v1 import (
    auth as auth_router,
    emergency as emergency_router,
    telemetry as telemetry_router,
    intersections as intersections_router,
    ws_police as ws_police_router,
    registration as registration_router,
    routing as routing_router,
    vision as vision_router,
    alerts as alerts_router,
    simulation as simulation_router
)
from backend.app.services.telemetry_manager import telemetry_manager
from backend.app.services.recalculation import recalculation_engine

async def background_stale_telemetry_monitor():
    """Background loop checking for stale vehicle telemetry every 1.0 second."""
    while True:
        try:
            await telemetry_manager.check_stale_telemetry()
        except Exception:
            pass
        await asyncio.sleep(1.0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables created and start background monitors
    await init_db()
    monitor_task = asyncio.create_task(background_stale_telemetry_monitor())
    await recalculation_engine.start()
    yield
    # Shutdown
    await recalculation_engine.stop()
    monitor_task.cancel()
    try:
        await monitor_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Predictive Green Corridors for Emergency Response Vehicles",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication & RBAC"])
app.include_router(emergency_router.router, prefix=f"{settings.API_V1_STR}/emergency", tags=["Emergency Sessions"])
app.include_router(intersections_router.router, prefix=f"{settings.API_V1_STR}/intersections", tags=["Smart Intersections"])
app.include_router(telemetry_router.router, prefix=settings.API_V1_STR, tags=["500ms Vehicle Telemetry"])
app.include_router(ws_police_router.router, prefix=settings.API_V1_STR, tags=["Police Command WebSockets"])
app.include_router(registration_router.router, prefix=f"{settings.API_V1_STR}/registration", tags=["Driver Registration & Approval"])
app.include_router(routing_router.router, prefix=f"{settings.API_V1_STR}/routing", tags=["AI Routing & Traffic Prediction"])
app.include_router(vision_router.router, prefix=f"{settings.API_V1_STR}/vision", tags=["Vision & CCTV Perception"])
app.include_router(alerts_router.router, prefix=f"{settings.API_V1_STR}/alerts", tags=["Driver Alert & Diversion"])
app.include_router(simulation_router.router, prefix=f"{settings.API_V1_STR}/simulation", tags=["Digital Twin & Simulation"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "Phase 1 Foundation",
        "telemetry_interval_ms": settings.TELEMETRY_INTERVAL_MS,
        "district": settings.CITY_NAME
    }

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "LifeLane AI API — Predictive Green Corridor Engine",
        "docs_url": "/docs",
        "health_url": "/health"
    }
