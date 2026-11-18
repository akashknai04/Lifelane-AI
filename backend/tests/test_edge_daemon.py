"""
Tests for Phase 8: Edge Intelligence Daemon, Offline Continuity, & MQTT
"""

import time
import pytest
from edge.mqtt_client import EdgeMQTTBroker
from edge.intersection_daemon import EdgeIntersectionDaemon
from edge.controller import SignalPhase, PreemptionState


def test_mqtt_client_in_memory_fallback():
    """Verify MQTT broker connects and dispatches messages over in-memory bus when Mosquitto is offline."""
    mqtt = EdgeMQTTBroker(client_id="test_client")
    assert mqtt.connect() is True

    received_payloads = []

    def on_msg(topic, payload):
        received_payloads.append((topic, payload))

    mqtt.subscribe("lifelane/test/topic", on_msg)
    mqtt.publish("lifelane/test/topic", {"status": "ok", "value": 42})

    assert len(received_payloads) == 1
    assert received_payloads[0][0] == "lifelane/test/topic"
    assert received_payloads[0][1]["value"] == 42
    mqtt.disconnect()


def test_edge_daemon_mqtt_preemption():
    """Verify Edge daemon reacts to preemption command received over MQTT."""
    daemon = EdgeIntersectionDaemon(
        intersection_code="INT-EDGE-01",
        name="Edge Test Junction",
        latitude=12.93,
        longitude=77.60
    )
    daemon.start()

    # Simulate cloud publishing preemption command to MQTT
    daemon.mqtt.publish(
        "lifelane/intersection/INT-EDGE-01/preempt",
        {"session_id": "MQTT-TEST-01", "eta_seconds": 6.0, "distance_meters": 80.0}
    )

    st = daemon.controller.get_status()
    assert st["preempt_state"] == PreemptionState.ACTUATED_HOLD.value
    assert st["corridor_phase"] == SignalPhase.GREEN.value
    daemon.stop()


def test_edge_daemon_cloud_backhaul_loss():
    """Verify edge daemon detects cloud heartbeat loss and transitions to offline mode."""
    t0 = 1000.0
    daemon = EdgeIntersectionDaemon(
        intersection_code="INT-EDGE-02",
        name="Edge Heartbeat Junction",
        latitude=12.93,
        longitude=77.60
    )
    daemon.last_cloud_heartbeat = t0

    # Within 3s: Cloud is connected
    assert daemon.check_cloud_liveness(current_time=t0 + 2.0) is True
    assert daemon.offline_mode is False

    # After 6s: Cloud heartbeat timed out -> Offline mode active
    assert daemon.check_cloud_liveness(current_time=t0 + 6.0) is False
    assert daemon.offline_mode is True


def test_edge_daemon_autonomous_vision_preemption():
    """Verify autonomous local camera-triggered green preemption when cloud is offline."""
    daemon = EdgeIntersectionDaemon(
        intersection_code="INT-EDGE-03",
        name="Autonomous Vision Junction",
        latitude=12.93,
        longitude=77.60
    )
    daemon.start()

    # Cloud is offline
    daemon.offline_mode = True
    daemon.is_cloud_connected = False

    # Local CCTV detects approaching ambulance
    det = daemon.process_local_camera_frame(
        frame_bytes=b"",
        simulate_vehicle="ambulance"
    )

    assert det["emergency_detected"] is True
    # Signal must have actuated green wave autonomously
    st = daemon.controller.get_status()
    assert st["preempt_state"] == PreemptionState.ACTUATED_HOLD.value
    assert st["corridor_phase"] == SignalPhase.GREEN.value
    daemon.stop()
