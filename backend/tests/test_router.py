import pytest
import unittest.mock as mock
import httpx
from backend.app.services.router import (
    RouterService,
    snap_to_polyline,
    order_intersections_along_route,
    project_point_to_segment
)

# Sample polyline: from Koramangala (12.9300, 77.6200) -> MG Road (12.9730, 77.6190) -> Victoria Hospital (12.9634, 77.5756)
# Note GeoJSON format is [lon, lat]
SAMPLE_POLYLINE = [
    [77.6200, 12.9300],  # Start
    [77.6190, 12.9500],  # Mid point 1
    [77.6190, 12.9730],  # Trinity Circle area
    [77.5960, 12.9650],  # Richmond Circle area
    [77.5756, 12.9634]   # Victoria Hospital
]

def test_project_point_to_segment():
    # Segment from (12.9300, 77.6200) to (12.9500, 77.6200) - straight north
    lat1, lon1 = 12.9300, 77.6200
    lat2, lon2 = 12.9500, 77.6200
    # Point at (12.9400, 77.6200) - exactly on segment midway
    s_lat, s_lon, dist_m, t = project_point_to_segment(12.9400, 77.6200, lat1, lon1, lat2, lon2)
    assert abs(s_lat - 12.9400) < 1e-4
    assert abs(s_lon - 77.6200) < 1e-4
    assert dist_m < 1.0
    assert abs(t - 0.5) < 0.05

def test_snap_to_polyline_on_route():
    # Test point right on the first segment
    snap = snap_to_polyline(12.9400, 77.6195, SAMPLE_POLYLINE)
    assert snap["cross_track_distance_m"] < 100.0
    assert snap["distance_along_route_m"] > 0
    assert snap["segment_index"] == 0

def test_distance_along_route_monotonic():
    # P1 near start of polyline
    snap1 = snap_to_polyline(12.9310, 77.6200, SAMPLE_POLYLINE)
    # P2 further along route
    snap2 = snap_to_polyline(12.9550, 77.6190, SAMPLE_POLYLINE)
    # P3 near destination
    snap3 = snap_to_polyline(12.9640, 77.5770, SAMPLE_POLYLINE)

    assert snap1["distance_along_route_m"] < snap2["distance_along_route_m"]
    assert snap2["distance_along_route_m"] < snap3["distance_along_route_m"]

def test_off_route_detection():
    # Point very close to route (<50m)
    on_route_snap = snap_to_polyline(12.9301, 77.6200, SAMPLE_POLYLINE)
    assert on_route_snap["cross_track_distance_m"] < 50.0

    # Point far off route (> 1 km east)
    off_route_snap = snap_to_polyline(12.9300, 77.6500, SAMPLE_POLYLINE)
    assert off_route_snap["cross_track_distance_m"] > 50.0

def test_signal_ordering_along_route_vs_radius():
    """
    Ensure intersections are sorted by sequence of encounter along the route,
    not straight-line radius to the starting point.
    """
    intersections = [
        {
            "intersection_code": "SIG-LATE",
            "name": "Richmond Circle",
            "latitude": 12.9650,
            "longitude": 77.5960
        },
        {
            "intersection_code": "SIG-EARLY",
            "name": "Near Koramangala Start",
            "latitude": 12.9350,
            "longitude": 77.6198
        },
        {
            "intersection_code": "SIG-MID",
            "name": "Trinity Circle",
            "latitude": 12.9730,
            "longitude": 77.6190
        }
    ]

    ordered = order_intersections_along_route(intersections, SAMPLE_POLYLINE, max_lateral_deviation_m=300.0)
    assert len(ordered) == 3
    # Encounter order must be: SIG-EARLY -> SIG-MID -> SIG-LATE
    codes = [s["intersection_code"] for s in ordered]
    assert codes == ["SIG-EARLY", "SIG-MID", "SIG-LATE"]
    assert ordered[0]["distance_along_route_m"] < ordered[1]["distance_along_route_m"]
    assert ordered[1]["distance_along_route_m"] < ordered[2]["distance_along_route_m"]

@pytest.mark.asyncio
async def test_router_service_osrm_mock():
    mock_osrm_response = {
        "code": "Ok",
        "routes": [
            {
                "geometry": {
                    "coordinates": [[77.6200, 12.9300], [77.6190, 12.9500], [77.5756, 12.9634]],
                    "type": "LineString"
                },
                "legs": [
                    {
                        "steps": [
                            {
                                "name": "Hosur Road",
                                "distance": 2200.0,
                                "duration": 180.0,
                                "maneuver": {"type": "depart", "modifier": "straight", "location": [77.6200, 12.9300]}
                            },
                            {
                                "name": "Kalasipalyam Road",
                                "distance": 1800.0,
                                "duration": 150.0,
                                "maneuver": {"type": "arrive", "modifier": "", "location": [77.5756, 12.9634]}
                            }
                        ]
                    }
                ],
                "distance": 4000.0,
                "duration": 330.0
            }
        ]
    }

    router = RouterService(base_url="http://mock-osrm")

    with mock.patch("httpx.AsyncClient.get") as mock_get:
        mock_response = mock.MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_osrm_response
        mock_get.return_value = mock_response

        route = await router.get_route(12.9300, 77.6200, 12.9634, 77.5756)
        assert route["route_source"] == "osrm"
        assert len(route["polyline"]) == 3
        assert route["distance_m"] == 4000.0
        assert route["duration_s"] == 330.0
        assert len(route["steps"]) == 2
        assert "Hosur Road" in route["steps"][0]["instruction"]

@pytest.mark.asyncio
async def test_router_service_fallback_on_timeout():
    router = RouterService(base_url="http://unreachable-osrm")

    with mock.patch("httpx.AsyncClient.get", side_effect=httpx.TimeoutException("Mocked timeout")):
        route = await router.get_route(12.9300, 77.6200, 12.9634, 77.5756)
        assert route["route_source"] == "fallback_straight_line"
        assert len(route["polyline"]) == 2
        assert route["distance_m"] > 0
        assert route["duration_s"] > 0
        assert len(route["steps"]) >= 1
        assert "Proceed" in route["steps"][0]["instruction"]
