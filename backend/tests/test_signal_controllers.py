"""
Tests for Phase 4: Adaptive Signal Control Network Simulation & Actuation
"""

import time
import pytest
from httpx import AsyncClient, ASGITransport
from edge.controller import (
    EdgeIntersectionController,
    IntersectionApproach,
    SignalPhase,
    PreemptionState,
    ConflictInterlockException
)
from simulation.controllers import signal_network
from ai.signals.controller_agent import SignalTimingAgent
from backend.app.main import app


def test_controller_initialization_safety():
    """Verify controller boots with safe non-conflicting phases."""
    ctrl = EdgeIntersectionController(
        intersection_code="INT-TEST-01",
        name="Test Junction",
        latitude=12.93,
        longitude=77.60,
        corridor_approach=IntersectionApproach.NORTH_SOUTH
    )
    # Interlock check must pass
    ctrl.verify_safety_interlock()
    assert ctrl.heads[IntersectionApproach.NORTH_SOUTH].state == SignalPhase.RED
    assert ctrl.heads[IntersectionApproach.EAST_WEST].state == SignalPhase.GREEN
    assert ctrl.preempt_state == PreemptionState.STANDBY


def test_preemption_two_stage_transitions():
    """Verify Stage 1 (Pre-clearing) and Stage 2 (Actuated green wave) transitions."""
    ctrl = EdgeIntersectionController(
        intersection_code="INT-TEST-02",
        name="Test Junction",
        latitude=12.93,
        longitude=77.60
    )
    t0 = 1000.0

    # Approaching at 600m, 25s ETA -> PRE_CLEARING
    status1 = ctrl.request_preemption(
        session_id="SESS-001",
        eta_seconds=25.0,
        distance_meters=600.0,
        now=t0
    )
    assert status1["preempt_state"] == PreemptionState.PRE_CLEARING.value
    assert ctrl.heads[IntersectionApproach.EAST_WEST].state == SignalPhase.AMBER
    assert ctrl.heads[IntersectionApproach.NORTH_SOUTH].state == SignalPhase.RED

    # Closer: 100m, 6.0s ETA -> ACTUATED_HOLD (Green wave)
    status2 = ctrl.request_preemption(
        session_id="SESS-001",
        eta_seconds=6.0,
        distance_meters=100.0,
        now=t0 + 10.0
    )
    assert status2["preempt_state"] == PreemptionState.ACTUATED_HOLD.value
    assert ctrl.heads[IntersectionApproach.NORTH_SOUTH].state == SignalPhase.GREEN
    assert ctrl.heads[IntersectionApproach.EAST_WEST].state == SignalPhase.RED

    # Vehicle passed: 10m -> POST_PASSAGE
    status3 = ctrl.request_preemption(
        session_id="SESS-001",
        eta_seconds=1.0,
        distance_meters=10.0,
        now=t0 + 16.0
    )
    assert status3["preempt_state"] == PreemptionState.POST_PASSAGE.value
    assert ctrl.heads[IntersectionApproach.NORTH_SOUTH].state == SignalPhase.AMBER


def test_conflicting_green_interlock_exception():
    """Verify hardware safety interlock violently catches simultaneous conflicting green/amber."""
    ctrl = EdgeIntersectionController(
        intersection_code="INT-TEST-03",
        name="Test Junction",
        latitude=12.93,
        longitude=77.60
    )
    # Manually force conflicting green
    ctrl.heads[IntersectionApproach.NORTH_SOUTH].state = SignalPhase.GREEN
    ctrl.heads[IntersectionApproach.EAST_WEST].state = SignalPhase.GREEN

    with pytest.raises(ConflictInterlockException):
        ctrl.verify_safety_interlock()

    # Safety system must force flashing amber failsafe
    assert ctrl.preempt_state == PreemptionState.FAILSAFE_ABORT


def test_dynamic_max_green_cap_45s():
    """Verify that an emergency green hold cannot exceed 45.0s."""
    ctrl = EdgeIntersectionController(
        intersection_code="INT-TEST-04",
        name="Test Junction",
        latitude=12.93,
        longitude=77.60
    )
    t0 = 1000.0

    # Trigger green wave
    ctrl.request_preemption("SESS-CAP", eta_seconds=5.0, distance_meters=80.0, now=t0)
    assert ctrl.preempt_state == PreemptionState.ACTUATED_HOLD

    # Advance 46 seconds
    ctrl.step_time(46.0, current_time=t0 + 46.0)
    assert ctrl.preempt_state == PreemptionState.FAILSAFE_ABORT


def test_post_passage_10s_recovery():
    """Verify post-passage safely transitions through amber and all-red back to cyclic standby."""
    ctrl = EdgeIntersectionController(
        intersection_code="INT-TEST-05",
        name="Test Junction",
        latitude=12.93,
        longitude=77.60
    )
    t0 = 1000.0

    ctrl.request_preemption("SESS-REV", eta_seconds=5.0, distance_meters=80.0, now=t0)
    ctrl.request_preemption("SESS-REV", eta_seconds=0.5, distance_meters=5.0, now=t0 + 5.0)
    assert ctrl.preempt_state == PreemptionState.POST_PASSAGE

    # Advance 11.0s (past the 10s reversion window)
    ctrl.step_time(11.0, current_time=t0 + 16.0)
    assert ctrl.preempt_state == PreemptionState.STANDBY
    assert ctrl.heads[IntersectionApproach.NORTH_SOUTH].state == SignalPhase.RED
    assert ctrl.heads[IntersectionApproach.EAST_WEST].state == SignalPhase.GREEN


def test_stale_telemetry_watchdog_g7():
    """Verify G7 fail-safe: controller aborts green if telemetry drops for >3.0s."""
    ctrl = EdgeIntersectionController(
        intersection_code="INT-TEST-06",
        name="Test Junction",
        latitude=12.93,
        longitude=77.60
    )
    t0 = 1000.0

    ctrl.request_preemption("SESS-WATCHDOG", eta_seconds=6.0, distance_meters=90.0, now=t0)
    assert ctrl.preempt_state == PreemptionState.ACTUATED_HOLD

    # Advance 3.5s without any telemetry update
    ctrl.step_time(3.5, current_time=t0 + 3.5)
    assert ctrl.preempt_state == PreemptionState.FAILSAFE_ABORT


def test_adaptive_timing_agent():
    """Verify Module 3 SignalTimingAgent dynamic pre-green and hold calculation."""
    res = SignalTimingAgent.calculate_timing_window(speed_mps=15.0, distance_m=300.0, cross_queue_vehicles=5)
    assert res["eta_seconds"] == 20.0
    assert 5.0 <= res["pre_green_offset_s"] <= 8.0
    assert res["max_hold_cap_s"] == 45.0
    assert res["recommended_hold_duration_s"] <= 45.0


@pytest.mark.asyncio
async def test_controller_api_endpoints():
    """Test REST endpoints for controller status and manual preemption."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Get controller status
        resp = await client.get("/api/v1/intersections/controllers/status")
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] >= 10
        assert len(data["controllers"]) >= 10

        # Timing recommendation
        resp2 = await client.get("/api/v1/intersections/controllers/timing-recommendation?speed_mps=16.0&distance_m=400.0")
        assert resp2.status_code == 200
        rec = resp2.json()
        assert rec["eta_seconds"] == 25.0
        assert rec["pre_green_offset_s"] == 8.0

        # Test preemption actuation on INT-BLR-01
        resp3 = await client.post("/api/v1/intersections/controllers/INT-BLR-01/preempt?eta_seconds=6.0&distance_meters=80.0")
        assert resp3.status_code == 200
        st = resp3.json()
        assert st["intersection_code"] == "INT-BLR-01"
        assert st["corridor_phase"] == "GREEN"
        assert st["preempt_state"] == "ACTUATED_HOLD"
