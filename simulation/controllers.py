"""
LifeLane AI — Signal Network Simulator (Phase 4: Adaptive Signal Control)
Manages the fleet of simulated intersection signal controllers across the Bengaluru emergency grid.
Interfaces between the high-level corridor engine and low-level physical controller daemons.
"""

from typing import Dict, Any, List, Optional
import time
from edge.controller import EdgeIntersectionController, IntersectionApproach, SignalPhase, PreemptionState
from backend.app.services.osm_service import BENGALURU_CORRIDOR_INTERSECTIONS


class SimulatedSignalNetwork:
    """
    Simulated network of all smart signal controllers in the city corridor.
    Provides coordinated cycle management, preemption dispatch, and safety auditing.
    """
    def __init__(self):
        self.controllers: Dict[str, EdgeIntersectionController] = {}
        self._initialize_controllers()

    def _initialize_controllers(self):
        for raw in BENGALURU_CORRIDOR_INTERSECTIONS:
            code = raw["intersection_code"]
            ctrl = EdgeIntersectionController(
                intersection_code=code,
                name=raw["name"],
                latitude=raw["latitude"],
                longitude=raw["longitude"],
                corridor_approach=IntersectionApproach.NORTH_SOUTH,
                cycle_length_s=float(raw.get("default_cycle_sec", 90)),
            )
            self.controllers[code] = ctrl

    def get_controller(self, code: str) -> Optional[EdgeIntersectionController]:
        return self.controllers.get(code)

    def dispatch_preemption(
        self,
        session_id: str,
        evaluated_signals: List[Dict[str, Any]],
        current_time: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Dispatches preemption commands from CorridorEngine to each physical controller daemon.
        """
        t = current_time or time.time()
        results = []

        for sig in evaluated_signals:
            code = sig.get("intersection_code")
            ctrl = self.controllers.get(code)
            if not ctrl:
                continue

            dist_m = float(sig.get("distance_m", 9999.0))
            eta_s = float(sig.get("seconds_until_arrival", 999.0))

            status = ctrl.request_preemption(
                session_id=session_id,
                eta_seconds=eta_s,
                distance_meters=dist_m,
                now=t
            )
            results.append(status)

        return results

    def advance_time(self, elapsed_s: float, current_time: Optional[float] = None) -> List[Dict[str, Any]]:
        """Advances the simulation clock across all controllers."""
        t = current_time or time.time()
        statuses = []
        for ctrl in self.controllers.values():
            st = ctrl.step_time(elapsed_s, current_time=t)
            statuses.append(st)
        return statuses

    def get_network_status(self) -> List[Dict[str, Any]]:
        """Returns the live status of all controllers in the network."""
        return [ctrl.get_status() for ctrl in self.controllers.values()]

    def reset_network(self):
        """Resets all controllers to standard coordinated standby."""
        for ctrl in self.controllers.values():
            ctrl._enter_standby(time.time())


signal_network = SimulatedSignalNetwork()
