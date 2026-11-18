import asyncio
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Set, Optional
from fastapi import WebSocket
from backend.app.core.config import settings
from backend.app.services.osm_service import osm_service, haversine_distance_m
from backend.app.services.corridor import corridor_engine
from backend.app.services.router import router_service, snap_to_polyline, order_intersections_along_route

class TelemetryRateLimitExceeded(Exception):
    pass

class TelemetryManager:
    def __init__(self):
        # session_id -> latest telemetry dictionary
        self._active_sessions: Dict[str, Dict[str, Any]] = {}
        # session_id -> WebSocket connection from driver app
        self._driver_sockets: Dict[str, WebSocket] = {}
        # session_id -> list of frame arrival timestamps (for rate limiting)
        self._frame_history: Dict[str, List[float]] = {}
        # Set of active WebSocket connections to police dashboard
        self._police_subscribers: Set[WebSocket] = set()
        # Lock for concurrent operations
        self._lock = asyncio.Lock()

    async def register_session(
        self,
        session_id: str,
        session_code: str,
        vehicle_id: str,
        driver_id: str,
        origin_lat: float,
        origin_lon: float,
        dest_lat: float,
        dest_lon: float,
        destination_name: str,
        baseline_eta_seconds: float
    ):
        # Fetch initial route asynchronously
        route = await router_service.get_route(origin_lat, origin_lon, dest_lat, dest_lon)
        corridor_signals = osm_service.get_corridor_intersections_between(
            origin_lat, origin_lon, dest_lat, dest_lon
        )
        ordered_signals = order_intersections_along_route(corridor_signals, route["polyline"])
        if not ordered_signals:
            ordered_signals = corridor_signals

        # Initialize intersection state for this corridor
        intersection_states = []
        for sig in ordered_signals:
            state = {
                "intersection_code": sig["intersection_code"],
                "name": sig["name"],
                "latitude": sig["latitude"],
                "longitude": sig["longitude"],
                "phase": "RED",  # Base state
                "is_corridor_active": False,
                "seconds_until_arrival": 999.0,
                "distance_m": 9999.0,
                "timing_mode": "CYCLIC"
            }
            if "distance_along_route_m" in sig:
                state["distance_along_route_m"] = sig["distance_along_route_m"]
            intersection_states.append(state)

        initial_instruction = (
            route["steps"][0]["instruction"]
            if route.get("steps") and len(route["steps"]) > 0
            else "Proceed to emergency destination"
        )

        async with self._lock:
            self._active_sessions[session_id] = {
                "session_id": session_id,
                "session_code": session_code,
                "vehicle_id": vehicle_id,
                "driver_id": driver_id,
                "status": "active",
                "origin": {"latitude": origin_lat, "longitude": origin_lon},
                "destination": {"latitude": dest_lat, "longitude": dest_lon, "name": destination_name},
                "baseline_eta_seconds": baseline_eta_seconds,
                "start_time": time.time(),
                "route": route,
                "off_route_ticks": 0,
                "is_off_route": False,
                "is_rerouting": False,
                "remaining_distance_m": route.get("distance_m", 0.0),
                "eta_s": route.get("duration_s", 0.0),
                "next_instruction": initial_instruction,
                "smoothed_speed_mps": 0.0,
                "current_telemetry": {
                    "latitude": origin_lat,
                    "longitude": origin_lon,
                    "speed_kmh": 0.0,
                    "heading_deg": 0.0,
                    "accuracy_m": 5.0,
                    "is_anomaly": False,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                },
                "intersections": intersection_states,
                "last_received_time": time.time(),
                "is_stale": False,
                "time_saved_seconds": 0.0,
                "time_saved_metric_type": "Simulated estimate",
                "active_corridor_intersections": []
            }
            self._frame_history[session_id] = []
        
        await self.broadcast_to_police({
            "type": "SESSION_STARTED",
            "session": self._active_sessions[session_id]
        })

    async def ingest_telemetry(self, session_id: str, frame: Dict[str, Any]) -> Dict[str, Any]:
        """Ingest 500 ms telemetry frame with G6 anti-spoofing anomaly checks & rate limiting."""
        now = time.time()
        async with self._lock:
            if session_id not in self._active_sessions:
                raise KeyError(f"Session {session_id} not found or inactive")

            session = self._active_sessions[session_id]
            
            # G6 Rate Limiting: max 10 frames per second per session
            history = self._frame_history.setdefault(session_id, [])
            history = [t for t in history if now - t < 1.0]
            if len(history) >= 10:
                raise TelemetryRateLimitExceeded(f"Rate limit exceeded: >10 frames/sec for session {session_id}")
            history.append(now)
            self._frame_history[session_id] = history

            # G6 Anti-Spoofing: Anomaly detection on speed & acceleration
            speed_kmh = frame.get("speed_kmh", 0.0)
            prev_speed_kmh = session["current_telemetry"].get("speed_kmh", 0.0)
            dt = max(now - session["last_received_time"], 0.1)
            
            # Acceleration in m/s^2
            accel_mps2 = abs((speed_kmh - prev_speed_kmh) * (1000.0 / 3600.0)) / dt
            is_anomaly = False
            anomaly_reasons = []

            if speed_kmh > 120.0:
                is_anomaly = True
                anomaly_reasons.append(f"Implausible urban speed: {speed_kmh:.1f} km/h > 120 km/h cap")
            if accel_mps2 > 8.0:
                is_anomaly = True
                anomaly_reasons.append(f"Implausible acceleration: {accel_mps2:.1f} m/s² > 8.0 m/s² threshold")

            session["last_received_time"] = now
            session["is_stale"] = False
            
            lat = frame["latitude"]
            lon = frame["longitude"]
            heading_deg = frame.get("heading_deg", 0.0)
            speed_mps = max(speed_kmh * (1000.0 / 3600.0), 3.0)

            session["current_telemetry"] = {
                "latitude": lat,
                "longitude": lon,
                "speed_kmh": speed_kmh,
                "heading_deg": heading_deg,
                "accuracy_m": frame.get("accuracy_m", 5.0),
                "is_anomaly": is_anomaly,
                "anomaly_reasons": anomaly_reasons,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

            # Spatial route snapping & along-route navigation
            route = session.get("route")
            polyline = route.get("polyline") if route else None
            
            if polyline and len(polyline) >= 2:
                snap = snap_to_polyline(lat, lon, polyline)
                cross_track_m = snap["cross_track_distance_m"]
                dist_along_m = snap["distance_along_route_m"]
                total_route_m = route.get("distance_m", snap.get("total_route_distance_m", 0.0))
                remaining_distance_m = max(0.0, total_route_m - dist_along_m)

                # Debounced off-route detection (> 50m for > 3 consecutive ticks)
                if cross_track_m > 50.0:
                    session["off_route_ticks"] = session.get("off_route_ticks", 0) + 1
                else:
                    session["off_route_ticks"] = 0

                is_off_route = session["off_route_ticks"] >= 3
                session["is_off_route"] = is_off_route

                # Trigger async reroute if off-route and not already rerouting
                if is_off_route and not session.get("is_rerouting", False):
                    session["is_rerouting"] = True
                    asyncio.create_task(self.trigger_reroute(session_id, lat, lon))

                # Smoothed speed for ETA calculation with floor of 5 m/s (~18 km/h)
                current_speed_mps = speed_kmh * (1000.0 / 3600.0)
                prev_smoothed = session.get("smoothed_speed_mps", current_speed_mps)
                smoothed_mps = 0.3 * current_speed_mps + 0.7 * prev_smoothed
                session["smoothed_speed_mps"] = smoothed_mps
                effective_speed_for_eta = max(smoothed_mps, 5.0)

                remaining_eta_s = round(remaining_distance_m / effective_speed_for_eta, 1)
                session["remaining_distance_m"] = round(remaining_distance_m, 1)
                session["eta_s"] = remaining_eta_s

                # Turn-by-turn next instruction
                steps = route.get("steps", [])
                next_instr = "Proceed to destination"
                cum_step_dist = 0.0
                for step in steps:
                    cum_step_dist += step.get("distance_m", 0.0)
                    if cum_step_dist > dist_along_m:
                        next_instr = step.get("instruction", "Proceed along route")
                        break
                session["next_instruction"] = next_instr
                vehicle_dist_along = dist_along_m
            else:
                vehicle_dist_along = None
                dest = session["destination"]
                remaining_distance_m = haversine_distance_m(lat, lon, dest["latitude"], dest["longitude"])
                session["remaining_distance_m"] = round(remaining_distance_m, 1)
                session["eta_s"] = round(remaining_distance_m / max(speed_mps, 5.0), 1)
                session["next_instruction"] = "Proceed to emergency destination"
                session["is_off_route"] = False

            # Update signal corridor states dynamically using corridor_engine
            updated_intersections, active_cleared = corridor_engine.evaluate_corridor(
                current_lat=lat,
                current_lon=lon,
                speed_mps=speed_mps,
                intersections=session["intersections"],
                haversine_fn=haversine_distance_m,
                vehicle_dist_along_route_m=vehicle_dist_along
            )
            session["intersections"] = updated_intersections
            session["active_corridor_intersections"] = active_cleared

            # Phase 4: Dispatch to physical/simulated intersection controller daemons
            try:
                from simulation.controllers import signal_network
                signal_network.dispatch_preemption(session_id, updated_intersections, current_time=now)
            except Exception:
                pass

            # Phase 5: Dispatch proactive civilian alerts (VMS, Nav push, C-V2X) within 500m
            try:
                from backend.app.services.alerts import alert_dispatcher
                alert_dispatcher.dispatch_alerts(
                    session_id=session_id,
                    vehicle_type=session.get("vehicle_type", "ambulance"),
                    current_lat=lat,
                    current_lon=lon,
                    speed_mps=speed_mps,
                    heading_deg=heading_deg
                )
            except Exception:
                pass

            # Compute real-time time saved vs baseline (labeled "Simulated estimate")
            dest = session["destination"]
            remaining_dist = haversine_distance_m(lat, lon, dest["latitude"], dest["longitude"])
            remaining_life_lane_time = remaining_dist / max(speed_mps * 1.25, 8.0)
            elapsed_time = now - session["start_time"]
            current_eta = elapsed_time + remaining_life_lane_time
            session["time_saved_seconds"] = max(0.0, round(session["baseline_eta_seconds"] - current_eta, 1))

        # Broadcast update to police dashboard
        update_payload = {
            "type": "TELEMETRY_UPDATE",
            "session_id": session_id,
            "telemetry": session["current_telemetry"],
            "intersections": session["intersections"],
            "time_saved_seconds": session["time_saved_seconds"],
            "time_saved_metric_type": "Simulated estimate"
        }

        if is_anomaly:
            update_payload["type"] = "SPOOF_ANOMALY_WARNING"
            update_payload["anomaly_reasons"] = anomaly_reasons

        await self.broadcast_to_police(update_payload)
        return session

    async def check_stale_telemetry(self):
        """G7 fail-safe: check if any active session hasn't received telemetry in > 3.0s."""
        now = time.time()
        stale_sessions = []
        async with self._lock:
            for s_id, session in self._active_sessions.items():
                if session["status"] == "active":
                    elapsed = now - session["last_received_time"]
                    if elapsed > settings.TELEMETRY_TIMEOUT_SECONDS and not session["is_stale"]:
                        session["is_stale"] = True
                        # Revert corridor signals to prevent gridlock
                        for sig in session["intersections"]:
                            sig["phase"] = "RED"
                            sig["is_corridor_active"] = False
                            sig["timing_mode"] = "STALE_FAILSAFE_REVERT"
                        stale_sessions.append(s_id)

        for s_id in stale_sessions:
            await self.broadcast_to_police({
                "type": "TELEMETRY_STALE_WARNING",
                "session_id": s_id,
                "message": f"Telemetry timeout (>3.0s) for session {s_id}. Signals safely reverted to cyclic red."
            })

    async def end_session(self, session_id: str, reason: str = "Completed"):
        async with self._lock:
            if session_id in self._active_sessions:
                session = self._active_sessions[session_id]
                session["status"] = "completed" if reason == "Completed" else "cancelled"
                for sig in session["intersections"]:
                    sig["phase"] = "RED"
                    sig["is_corridor_active"] = False
                    sig["timing_mode"] = "MISSION_CONCLUDED"
                
                # Cleanup socket
                if session_id in self._driver_sockets:
                    try:
                        await self._driver_sockets[session_id].close()
                    except Exception:
                        pass
                    del self._driver_sockets[session_id]

        await self.broadcast_to_police({
            "type": "SESSION_ENDED",
            "session_id": session_id,
            "reason": reason
        })

    async def send_to_driver(self, session_id: str, data: Dict[str, Any]):
        """Send a JSON message to a specific driver's WebSocket."""
        async with self._lock:
            ws = self._driver_sockets.get(session_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception:
                pass

    async def trigger_reroute(self, session_id: str, current_lat: float, current_lon: float):
        """Asynchronously compute a new route when vehicle deviates >50m for >3 ticks."""
        dest = None
        async with self._lock:
            if session_id not in self._active_sessions:
                return
            dest = self._active_sessions[session_id]["destination"]

        try:
            new_route = await router_service.get_route(
                current_lat, current_lon, dest["latitude"], dest["longitude"]
            )
            async with self._lock:
                if session_id not in self._active_sessions:
                    return
                session = self._active_sessions[session_id]
                session["route"] = new_route
                session["off_route_ticks"] = 0
                session["is_off_route"] = False
                session["is_rerouting"] = False
                session["remaining_distance_m"] = new_route.get("distance_m", 0.0)
                session["eta_s"] = new_route.get("duration_s", 0.0)
                session["next_instruction"] = (
                    new_route["steps"][0]["instruction"]
                    if new_route.get("steps") and len(new_route["steps"]) > 0
                    else "Proceed along route"
                )

                # Re-order intersections along new route
                corridor_signals = osm_service.get_corridor_intersections_between(
                    current_lat, current_lon, dest["latitude"], dest["longitude"]
                )
                ordered = order_intersections_along_route(corridor_signals, new_route["polyline"])
                if ordered:
                    for sig in ordered:
                        match = next(
                            (s for s in session["intersections"] if s["intersection_code"] == sig["intersection_code"]),
                            None
                        )
                        sig["phase"] = match["phase"] if match else "RED"
                        sig["is_corridor_active"] = match["is_corridor_active"] if match else False
                        sig["timing_mode"] = match.get("timing_mode", "CYCLIC") if match else "CYCLIC"
                        sig["seconds_until_arrival"] = 999.0
                        sig["distance_m"] = 9999.0
                    session["intersections"] = ordered

                route_copy = session["route"]
                intersections_copy = session["intersections"]
                dest_copy = session["destination"]

            # Broadcast ROUTE_UPDATE to driver socket and police
            route_update_msg = {
                "type": "ROUTE_UPDATE",
                "session_id": session_id,
                "route": route_copy,
                "destination": dest_copy,
                "intersections": intersections_copy
            }
            await self.send_to_driver(session_id, route_update_msg)
            await self.broadcast_to_police(route_update_msg)

        except Exception as e:
            async with self._lock:
                if session_id in self._active_sessions:
                    self._active_sessions[session_id]["is_rerouting"] = False

    async def register_driver_socket(self, session_id: str, websocket: WebSocket):
        async with self._lock:
            self._driver_sockets[session_id] = websocket

    async def unregister_driver_socket(self, session_id: str):
        async with self._lock:
            if session_id in self._driver_sockets:
                del self._driver_sockets[session_id]

    async def register_police_subscriber(self, websocket: WebSocket):
        async with self._lock:
            self._police_subscribers.add(websocket)

    async def unregister_police_subscriber(self, websocket: WebSocket):
        async with self._lock:
            self._police_subscribers.discard(websocket)

    async def broadcast_to_police(self, data: Dict[str, Any]):
        dead = []
        for ws in list(self._police_subscribers):
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for d in dead:
            self._police_subscribers.discard(d)

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self._active_sessions.get(session_id)

    def get_active_sessions(self) -> List[Dict[str, Any]]:
        return [s for s in self._active_sessions.values() if s["status"] == "active"]

    async def purge_stale_telemetry(self, db_session, retention_days: int = 30) -> int:
        """G5 requirement: Purge GPS telemetry records older than retention period."""
        from sqlalchemy import delete
        from backend.app.models.all_models import TelemetryLog
        
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=retention_days)
        stmt = delete(TelemetryLog).where(TelemetryLog.timestamp < cutoff_date)
        result = await db_session.execute(stmt)
        await db_session.commit()
        return result.rowcount or 0

telemetry_manager = TelemetryManager()
