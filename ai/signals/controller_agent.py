"""
LifeLane AI — Adaptive Signal Timing AI (Module 3)
Calculates dynamic preemption green-wave window based on vehicle approach velocity,
cross-traffic queue depth, and safety clearance intervals.
"""

from typing import Dict, Any


class SignalTimingAgent:
    """
    Computes dynamic pre-green activation offset and hold duration.
    Balances green-wave creation with cross-traffic queue dissipation.
    """
    MIN_PRE_GREEN_OFFSET_S = 5.0
    MAX_PRE_GREEN_OFFSET_S = 8.0
    MAX_GREEN_HOLD_S = 45.0
    MIN_AMBER_CLEARANCE_S = 4.0

    @classmethod
    def calculate_timing_window(
        cls,
        speed_mps: float,
        distance_m: float,
        cross_queue_vehicles: int = 4
    ) -> Dict[str, Any]:
        """
        Dynamically calculates:
        - pre_green_offset_s: Time before vehicle arrival to initiate green
        - estimated_hold_duration_s: Estimated green hold time needed for vehicle passage
        - queue_clearance_time_s: Time needed to flush waiting cross-traffic
        """
        speed = max(speed_mps, 3.0)  # m/s
        eta_s = distance_m / speed

        # Queue dissipation time: ~2.0s per vehicle startup + progression
        queue_clearance_s = min(cross_queue_vehicles * 1.8, 12.0)

        # Dynamic pre-green offset: higher speed = earlier clearance
        if speed > 15.0:  # > 54 km/h
            pre_green_offset = cls.MAX_PRE_GREEN_OFFSET_S
        elif speed > 8.0:  # > 28 km/h
            pre_green_offset = 6.5
        else:
            pre_green_offset = cls.MIN_PRE_GREEN_OFFSET_S

        # Green hold duration: time until arrival + 5s clearance buffer, capped at 45s
        estimated_hold = min(eta_s + 5.0, cls.MAX_GREEN_HOLD_S)

        return {
            "eta_seconds": round(eta_s, 1),
            "pre_green_offset_s": round(pre_green_offset, 1),
            "queue_clearance_time_s": round(queue_clearance_s, 1),
            "recommended_hold_duration_s": round(estimated_hold, 1),
            "max_hold_cap_s": cls.MAX_GREEN_HOLD_S,
        }
