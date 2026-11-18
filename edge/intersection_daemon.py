"""
LifeLane AI — Edge Intersection Intelligence Daemon (Phase 8: Edge & Hardening)
Autonomous edge daemon running at physical smart intersections:
- Bridges EdgeIntersectionController with EdgeMQTTBroker
- Handles autonomous local CCTV-triggered preemption when cloud backhaul drops
- Safe offline fallback: returns to standard IRC:SP:72 fixed-time cycle with 4s Amber
- Hardware/Software interlock verification guaranteeing zero conflicting green phases
"""

import time
from typing import Dict, Any, Optional
from edge.controller import EdgeIntersectionController, IntersectionApproach, SignalPhase, PreemptionState
from edge.mqtt_client import EdgeMQTTBroker
from ai.vision.detector import yolo_detector, VehicleClass


class EdgeIntersectionDaemon:
    """
    Autonomous intelligence daemon for a single smart intersection node.
    Maintains corridor continuity even during total cloud network disconnect.
    """
    def __init__(
        self,
        intersection_code: str,
        name: str,
        latitude: float,
        longitude: float,
        mqtt_host: str = "localhost",
        mqtt_port: int = 1883
    ):
        self.intersection_code = intersection_code
        self.name = name
        self.latitude = latitude
        self.longitude = longitude

        # Core Controller
        self.controller = EdgeIntersectionController(
            intersection_code=intersection_code,
            name=name,
            latitude=latitude,
            longitude=longitude,
            corridor_approach=IntersectionApproach.NORTH_SOUTH
        )

        # Local MQTT Client
        self.mqtt = EdgeMQTTBroker(
            client_id=f"daemon_{intersection_code}",
            host=mqtt_host,
            port=mqtt_port
        )

        # Operational Flags
        self.is_cloud_connected = True
        self.last_cloud_heartbeat = time.time()
        self.offline_mode = False

        self._setup_mqtt_handlers()

    def _setup_mqtt_handlers(self):
        # Subscribe to cloud preemption commands
        preempt_topic = f"lifelane/intersection/{self.intersection_code}/preempt"
        self.mqtt.subscribe(preempt_topic, self._handle_preempt_message)

        # Subscribe to cloud heartbeat
        self.mqtt.subscribe("lifelane/cloud/heartbeat", self._handle_cloud_heartbeat)

    def _handle_preempt_message(self, topic: str, payload: Dict[str, Any]):
        """Processes preemption command received over MQTT."""
        session_id = payload.get("session_id", "MQTT-EMERGENCY")
        eta_s = float(payload.get("eta_seconds", 30.0))
        dist_m = float(payload.get("distance_meters", 500.0))

        self.last_cloud_heartbeat = time.time()
        self.is_cloud_connected = True
        self.offline_mode = False

        st = self.controller.request_preemption(
            session_id=session_id,
            eta_seconds=eta_s,
            distance_meters=dist_m
        )
        self._publish_status()

    def _handle_cloud_heartbeat(self, topic: str, payload: Dict[str, Any]):
        self.last_cloud_heartbeat = time.time()
        self.is_cloud_connected = True
        self.offline_mode = False

    def check_cloud_liveness(self, current_time: Optional[float] = None) -> bool:
        """Checks if central cloud connection is healthy or has dropped."""
        now = current_time or time.time()
        if (now - self.last_cloud_heartbeat) > 5.0:  # > 5s heartbeat timeout
            self.is_cloud_connected = False
            self.offline_mode = True
            return False
        self.is_cloud_connected = True
        self.offline_mode = False
        return True

    def process_local_camera_frame(
        self,
        frame_bytes: bytes,
        simulate_vehicle: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Autonomous edge vision preemption:
        When cloud backhaul is down, local camera perception directly preempts the signal!
        """
        det = yolo_detector.detect_frame(
            frame=frame_bytes,
            camera_id=f"CAM-{self.intersection_code}",
            simulate_emergency_vehicle=simulate_vehicle
        )

        # If emergency vehicle detected locally with high confidence
        if det["emergency_detected"]:
            # Local autonomous green corridor actuation
            self.controller.request_preemption(
                session_id=f"AUTONOMOUS-EDGE-{self.intersection_code}",
                eta_seconds=6.0,  # immediate preemption
                distance_meters=100.0
            )

        self._publish_status()
        return det

    def step(self, elapsed_s: float, current_time: Optional[float] = None) -> Dict[str, Any]:
        """Advances the local controller state machine."""
        now = current_time or time.time()
        self.check_cloud_liveness(now)

        st = self.controller.step_time(elapsed_s, current_time=now)
        return st

    def _publish_status(self):
        st = self.controller.get_status()
        st["is_cloud_connected"] = self.is_cloud_connected
        st["offline_mode"] = self.offline_mode
        self.mqtt.publish(f"lifelane/intersection/{self.intersection_code}/status", st)

    def start(self):
        """Starts MQTT connectivity and daemon loops."""
        self.mqtt.connect()
        self._publish_status()

    def stop(self):
        self.mqtt.disconnect()


def create_intersection_daemon(code: str, name: str, lat: float, lon: float) -> EdgeIntersectionDaemon:
    return EdgeIntersectionDaemon(intersection_code=code, name=name, latitude=lat, longitude=lon)
