"""
Tests for Phase 7: Multi-Agent Digital Twin & Evaluation Benchmark Engine
"""

import pytest
from httpx import AsyncClient, ASGITransport
from simulation.digital_twin import digital_twin, SimulationScenario
from backend.app.main import app


def test_digital_twin_scenarios_definition():
    """Verify all 4 canonical presentation scenarios are defined and valid."""
    scenarios = digital_twin.get_available_scenarios()
    assert len(scenarios) == 4
    scenario_ids = [s["id"] for s in scenarios]
    assert SimulationScenario.PEAK_RUSH in scenario_ids
    assert SimulationScenario.MONSOON_FLOOD in scenario_ids
    assert SimulationScenario.DUAL_PRIORITY in scenario_ids
    assert SimulationScenario.ARTERIAL_BLOCK in scenario_ids

    for sc in scenarios:
        assert sc["distance_km"] > 0
        assert sc["signals_count"] >= 5
        assert sc["background_traffic_vph"] >= 1000


def test_digital_twin_benchmark_physics_and_badges():
    """Verify comparative benchmark calculation, travel time savings, and scientific honesty badges."""
    res = digital_twin.run_benchmark(SimulationScenario.PEAK_RUSH)

    assert res["scenario_id"] == SimulationScenario.PEAK_RUSH
    unassisted = res["unassisted_baseline"]
    lifelane = res["lifelane_ai"]
    comparison = res["comparison_metrics"]

    # LifeLane AI travel time must be faster than unassisted baseline
    assert lifelane["travel_time_seconds"] < unassisted["travel_time_seconds"]
    assert comparison["time_saved_seconds"] > 0
    assert comparison["travel_time_reduction_percentage"] > 20.0  # Significant reduction

    # Signal stops must be dramatically reduced (e.g. from 6 stops to 0 stops)
    assert unassisted["signal_stops_count"] >= 4
    assert lifelane["signal_stops_count"] <= 1
    assert comparison["signal_stops_reduction_percentage"] >= 80.0

    # Scientific honesty badges must be present
    assert res["honesty_badges"]["time_saved"] == "Simulated estimate"
    assert res["honesty_badges"]["percentage_claims"] == "Projected target"
    assert "90s" in res["honesty_badges"]["civilian_delay"]


def test_digital_twin_civilian_delay_bounded_to_90s():
    """Verify Duan et al. (2022) constraint: civilian added delay must strictly be < 90.0s."""
    for sc_id in [SimulationScenario.PEAK_RUSH, SimulationScenario.MONSOON_FLOOD, SimulationScenario.DUAL_PRIORITY, SimulationScenario.ARTERIAL_BLOCK]:
        res = digital_twin.run_benchmark(sc_id)
        comp = res["comparison_metrics"]
        assert comp["civilian_added_delay_seconds"] < 90.0
        assert comp["civilian_delay_bounded"] is True


def test_digital_twin_trajectory_timeline():
    """Verify step-by-step trajectory generation."""
    res = digital_twin.run_benchmark(SimulationScenario.ARTERIAL_BLOCK)
    steps = res["trajectory_steps"]
    assert len(steps) >= 10

    # Monotonic progress
    for i in range(len(steps) - 1):
        assert steps[i + 1]["elapsed_seconds"] >= steps[i]["elapsed_seconds"]
        assert steps[i + 1]["distance_covered_km"] >= steps[i]["distance_covered_km"]


@pytest.mark.asyncio
async def test_simulation_api_endpoints():
    """Verify FastAPI simulation endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Scenarios listing
        resp = await client.get("/api/v1/simulation/scenarios")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 4

        # 2. Run scenario
        resp_run = await client.post(f"/api/v1/simulation/run-scenario?scenario_id={SimulationScenario.MONSOON_FLOOD}")
        assert resp_run.status_code == 200
        run_data = resp_run.json()
        assert run_data["scenario_id"] == SimulationScenario.MONSOON_FLOOD
        assert run_data["weather"] == "WATERLOGGED"
        assert run_data["comparison_metrics"]["time_saved_seconds"] > 0
