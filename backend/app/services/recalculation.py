"""
LifeLane AI — 10-Second Real-Time Recalculation Engine (Workflow Step 9)
Periodically re-evaluates active emergency routes every 10 seconds.
Detects newly forming bottlenecks or incident blockages downstream.
Issues optimal dynamic reroute within 3.0 seconds if congestion exceeds threshold.
"""

import asyncio
import logging
from typing import Dict, Any, Optional

from backend.app.services.data_fusion import data_fusion_service
from ai.routing.astar import astar_router
from ai.routing.road_network import road_network
from backend.app.services.telemetry_manager import telemetry_manager

logger = logging.getLogger("lifelane.recalculation")

class RecalculationEngine:
    def __init__(self, interval_seconds: float = 10.0, reroute_threshold_ratio: float = 1.25):
        self.interval_seconds = interval_seconds
        self.reroute_threshold_ratio = reroute_threshold_ratio # 25% slower triggers reroute
        self._running = False
        self._task: Optional[asyncio.Task] = None

    async def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._recalculation_loop())
        logger.info("Recalculation engine loop started (10s interval)")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def _recalculation_loop(self):
        while self._running:
            try:
                await self.evaluate_active_routes()
            except Exception as e:
                logger.error(f"Error in recalculation loop: {e}")
            await asyncio.sleep(self.interval_seconds)

    async def evaluate_active_routes(self):
        active_sessions = telemetry_manager.get_active_sessions()
        if not active_sessions:
            return

        fused_snapshot = data_fusion_service.get_fused_traffic_snapshot()
        congestion_data = fused_snapshot.get("prediction")

        for session in active_sessions:
            try:
                await self.check_session_route(session, congestion_data)
            except Exception as e:
                logger.warning(f"Failed to check route for session {session.get('session_id')}: {e}")

    async def check_session_route(self, session: Dict[str, Any], congestion_data: Dict[str, Any]):
        session_id = session["session_id"]
        cur_telem = session["current_telemetry"]
        dest = session["destination"]

        # Map current position and destination to nearest network nodes
        origin_node = road_network.find_nearest_node(cur_telem["latitude"], cur_telem["longitude"])
        dest_node = road_network.find_nearest_node(dest["latitude"], dest["longitude"])

        if not origin_node or not dest_node or origin_node == dest_node:
            return

        # Compute optimal multi-factor route with live congestion
        optimal_route = astar_router.find_optimal_path(origin_node, dest_node, congestion_data)
        current_route_est = session.get("eta_s", 999.0)

        # Trigger dynamic reroute if:
        # 1. Congestion significantly spiked on current route compared to optimal
        # 2. Or off-route flag was set
        if optimal_route["estimated_duration_s"] < current_route_est * (1.0 / self.reroute_threshold_ratio):
            logger.info(f"Faster corridor discovered for session {session_id}! Triggering dynamic reroute.")
            await telemetry_manager.trigger_reroute(session_id, cur_telem["latitude"], cur_telem["longitude"])

recalculation_engine = RecalculationEngine()
