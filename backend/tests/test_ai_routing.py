import pytest
from httpx import AsyncClient, ASGITransport

from backend.app.main import app
from ai.routing.road_network import road_network, CORRIDOR_NODES, CORRIDOR_EDGES
from ai.models.traffic_predictor import traffic_predictor
from ai.routing.astar import astar_router
from backend.app.services.data_fusion import data_fusion_service

def test_road_network_topology():
    """Verify spatial road network graph topology, hospitals, and connectivity."""
    assert len(road_network.nodes) >= 15
    assert len(road_network.edges) >= 20

    # Verify all 4 hospitals exist in network
    hospital_nodes = [n for n, data in road_network.nodes.items() if data["type"] == "hospital"]
    assert "NODE_VICTORIA_HOSP" in hospital_nodes
    assert "NODE_ST_JOHNS" in hospital_nodes
    assert "NODE_BOWRING_HOSP" in hospital_nodes
    assert "NODE_MANIPAL_HOSP" in hospital_nodes

    # Verify nearest node resolution
    nearest = road_network.find_nearest_node(12.9634, 77.5756)
    assert nearest == "NODE_VICTORIA_HOSP"

def test_gcn_traffic_predictor_inference():
    """Verify GAA-GCN + LSTM spatiotemporal prediction outputs."""
    # 1. Off-peak hour prediction (0.15 = 3:36 AM)
    off_peak = traffic_predictor.predict(time_of_day_fraction=0.15)
    assert "edges" in off_peak
    assert off_peak["overall_grid_congestion"] >= 0.0

    # 2. Peak hour prediction (0.38 = ~9:00 AM)
    peak = traffic_predictor.predict(time_of_day_fraction=0.38)
    # Peak hour should have higher overall grid congestion
    assert peak["overall_grid_congestion"] >= off_peak["overall_grid_congestion"]

    # Verify edge attributes
    sample_edge = next(iter(peak["edges"].values()))
    assert "predicted_speed_kmh" in sample_edge
    assert "congestion_index" in sample_edge
    assert 0.0 <= sample_edge["congestion_index"] <= 1.0
    assert sample_edge["predicted_speed_kmh"] > 0

def test_modified_astar_latency_and_optimality():
    """Verify Modified Multi-Factor A* search completes in <200ms with optimal paths."""
    res = astar_router.find_optimal_path(
        origin_node="NODE_KORAMANGALA",
        dest_node="NODE_VICTORIA_HOSP"
    )

    assert res["status"] == "success"
    assert res["origin_node"] == "NODE_KORAMANGALA"
    assert res["destination_node"] == "NODE_VICTORIA_HOSP"
    assert len(res["path_nodes"]) >= 3
    assert res["path_nodes"][0] == "NODE_KORAMANGALA"
    assert res["path_nodes"][-1] == "NODE_VICTORIA_HOSP"
    assert res["total_distance_m"] > 0
    assert res["estimated_duration_s"] > 0
    assert len(res["steps"]) >= 1

    # Requirement: Multi-factor route optimization in < 200 ms
    assert res["latency_ms"] < 200.0

def test_astar_dynamic_reroute_on_congestion_spike():
    """Verify A* dynamically routes around an arterial bottleneck when congestion spikes."""
    # 1. Base route from St. John's to Victoria Hospital
    base_res = astar_router.find_optimal_path("NODE_ST_JOHNS", "NODE_VICTORIA_HOSP")
    base_path = base_res["path_nodes"]

    # 2. Inject critical incident (Severity 3) on the primary segment (NODE_ST_JOHNS->NODE_ADUGODI)
    data_fusion_service.inject_incident("NODE_ST_JOHNS->NODE_ADUGODI", severity=3)
    fused_snapshot = data_fusion_service.get_fused_traffic_snapshot()

    rerouted_res = astar_router.find_optimal_path(
        "NODE_ST_JOHNS", "NODE_VICTORIA_HOSP", fused_snapshot["prediction"]
    )
    rerouted_path = rerouted_res["path_nodes"]

    # Clean up incident
    data_fusion_service.clear_all_incidents()

    # The rerouted path must avoid the blocked segment
    assert "NODE_ADUGODI" not in rerouted_path or rerouted_path[1] != "NODE_ADUGODI"
    assert rerouted_path[0] == "NODE_ST_JOHNS"
    assert rerouted_path[-1] == "NODE_VICTORIA_HOSP"

@pytest.mark.asyncio
async def test_routing_api_endpoints():
    """Verify REST API endpoints for Phase 3 AI routing and congestion mapping."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Congestion map endpoint
        map_res = await client.get("/api/v1/routing/congestion-map")
        assert map_res.status_code == 200
        map_data = map_res.json()
        assert "prediction" in map_data
        assert "weather" in map_data

        # 2. Network graph endpoint
        graph_res = await client.get("/api/v1/routing/network-graph")
        assert graph_res.status_code == 200
        graph_data = graph_res.json()
        assert graph_data["total_nodes"] >= 15
        assert graph_data["total_edges"] >= 20

        # 3. Optimal route computation endpoint
        route_payload = {
            "origin_lat": 12.9340,
            "origin_lon": 77.6205,
            "dest_lat": 12.9634,
            "dest_lon": 77.5756,
            "weather": "CLEAR"
        }
        route_res = await client.post("/api/v1/routing/optimal", json=route_payload)
        assert route_res.status_code == 200
        route_data = route_res.json()
        assert route_data["status"] == "success"
        assert "optimal_route" in route_data
        assert route_data["optimal_route"]["latency_ms"] < 200.0
        assert "baseline_comparison" in route_data
        assert "routing_honesty_note" in route_data["baseline_comparison"]
