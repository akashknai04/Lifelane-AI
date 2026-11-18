"""
LifeLane AI — Digital Twin & Benchmark Simulation API (Phase 7)
Endpoints for running scenario simulations, comparing unassisted baselines vs LifeLane AI,
and inspecting traffic diversion impacts.
"""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from simulation.digital_twin import digital_twin, SimulationScenario

router = APIRouter()


@router.get("/scenarios")
async def list_scenarios():
    """Retrieve all pre-configured digital twin benchmark scenarios."""
    return digital_twin.get_available_scenarios()


@router.post("/run-scenario")
async def execute_scenario_benchmark(
    scenario_id: str = Query(
        SimulationScenario.PEAK_RUSH,
        description="Scenario: peak_morning_rush, monsoon_downpour_waterlogged, dual_ambulance_conflict, sudden_arterial_incident"
    )
):
    """
    Executes multi-agent digital twin benchmark comparison.
    Returns:
        - Unassisted baseline metrics (stops, speed, delay)
        - LifeLane AI metrics (continuous green wave, travel time)
        - Comparative gains badged with 'Simulated estimate'
        - Civilian delay impact (< 90s bound verified)
        - Step-by-step trajectory timeline
    """
    return digital_twin.run_benchmark(scenario_id)
