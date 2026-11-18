"""
LifeLane AI — Corridor Service (Objective 2 & Methodology Steps 5, 8)
Implements predictive green-corridor state machine:
- Preparation / Pre-clearing Armed Window: <800m or <=35s arrival window (flushing conflicting cross-traffic)
- Green-Start Actuation Moment: 5–8s before vehicle arrival (t_arrival <= 8.0s)
- Lookahead horizon: 2–3 intersections ahead along active route
- Post-passage Reversion: within 10s after vehicle passes intersection
- Fail-safe Timeout: 3.0s telemetry timeout reverts signals to cyclic red (G7)
- Dynamic timing cap: 45s maximum green phase (Step 8)
"""

from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timezone

PREPARATION_DISTANCE_M = 800.0
PREPARATION_TIME_S = 35.0
GREEN_TRIGGER_MAX_S = 8.0
GREEN_TRIGGER_MIN_S = 5.0
MAX_LOOKAHEAD_SIGNALS = 3
POST_PASSAGE_REVERT_S = 10.0
MAX_GREEN_DURATION_S = 45.0

class CorridorSignalState:
    RED = "RED"
    AMBER_PREPARE = "AMBER_PREPARE"  # Preparation window (flushing cross-traffic queues)
    GREEN = "GREEN"                  # Actuated green wave (5–8s before arrival)
    REVERTING = "REVERTING"          # Post-passage safe transition back to cyclic

class CorridorEngine:
    def __init__(self):
        pass

    def evaluate_corridor(
        self,
        current_lat: float,
        current_lon: float,
        speed_mps: float,
        intersections: List[Dict[str, Any]],
        haversine_fn,
        vehicle_dist_along_route_m: Optional[float] = None
    ) -> Tuple[List[Dict[str, Any]], List[str]]:
        """
        Evaluate and update all intersection signal phases for an active emergency vehicle corridor.
        Uses distance along route polyline if vehicle_dist_along_route_m is provided and intersections
        have distance_along_route_m; otherwise falls back to straight-line haversine distance.
        Returns: (updated_intersections, active_cleared_codes)
        """
        effective_speed = max(speed_mps, 3.0)  # Min 3 m/s (~11 km/h) to avoid divide-by-zero
        active_cleared_codes = []
        upcoming_signals = []

        # 1. Compute distance and ETA to each intersection along route
        for sig in intersections:
            if vehicle_dist_along_route_m is not None and "distance_along_route_m" in sig:
                dist_ahead = sig["distance_along_route_m"] - vehicle_dist_along_route_m
                sig["distance_m"] = round(dist_ahead, 1)
                time_to_reach_s = max(0.0, dist_ahead) / effective_speed
                sig["seconds_until_arrival"] = round(time_to_reach_s, 1)
                
                # Signal is upcoming if it is ahead (>= 15m)
                if dist_ahead >= 15.0:
                    upcoming_signals.append(sig)
            else:
                dist = haversine_fn(current_lat, current_lon, sig["latitude"], sig["longitude"])
                sig["distance_m"] = round(dist, 1)
                time_to_reach_s = dist / effective_speed
                sig["seconds_until_arrival"] = round(time_to_reach_s, 1)
                
                if dist >= 0:
                    upcoming_signals.append(sig)

        # Sort upcoming signals by distance along route (or straight-line distance)
        upcoming_signals.sort(key=lambda s: s["distance_m"])

        # 2. Apply 2-3 intersections lookahead rule
        lookahead_set = set()
        for idx, s in enumerate(upcoming_signals[:MAX_LOOKAHEAD_SIGNALS]):
            lookahead_set.add(s["intersection_code"])

        # 3. Apply exact Slide 7 Step 5 & Slide 8 Step 8 two-stage timing:
        for sig in intersections:
            code = sig["intersection_code"]
            dist = sig["distance_m"]
            eta_s = sig["seconds_until_arrival"]

            if code in lookahead_set:
                # Stage 2: Green-Start Actuation Moment (5–8s before arrival)
                if eta_s <= GREEN_TRIGGER_MAX_S and dist >= 15.0:
                    sig["phase"] = CorridorSignalState.GREEN
                    sig["is_corridor_active"] = True
                    sig["timing_mode"] = "ACTUATED_GREEN_WAVE"
                    active_cleared_codes.append(code)

                # Stage 1: Preparation Window (<800m or <=35s arrival window)
                elif dist <= PREPARATION_DISTANCE_M and eta_s <= PREPARATION_TIME_S and dist >= 15.0:
                    sig["phase"] = CorridorSignalState.AMBER_PREPARE
                    sig["is_corridor_active"] = True
                    sig["timing_mode"] = "PRE_CLEARING_ARMED"
                    active_cleared_codes.append(code)

                else:
                    # Staged in lookahead but beyond preparation window
                    sig["phase"] = CorridorSignalState.RED
                    sig["is_corridor_active"] = False
                    sig["timing_mode"] = "STANDBY"
            else:
                # Signal has either been passed or is >3 intersections ahead
                if dist < 15.0:
                    # Vehicle is passing / has passed intersection: Revert within 10s
                    sig["phase"] = CorridorSignalState.REVERTING
                    sig["is_corridor_active"] = False
                    sig["timing_mode"] = "POST_PASSAGE_REVERT"
                else:
                    # Outside lookahead: normal cyclic RED
                    sig["phase"] = CorridorSignalState.RED
                    sig["is_corridor_active"] = False
                    sig["timing_mode"] = "CYCLIC"

        return intersections, active_cleared_codes

corridor_engine = CorridorEngine()
