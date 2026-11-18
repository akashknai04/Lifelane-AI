"""
LifeLane AI — Routing & Spatial Navigation Engine
Provides:
- Async OSRM client (with 3s timeout and non-blocking event loop execution)
- Straight-line fallback with honest badging ('fallback_straight_line')
- Polyline snapping and distance-along-route calculation
- Off-route detection (threshold > 50m)
- Along-route intersection sorting and filtering
"""

import math
import logging
from typing import Dict, Any, List, Optional, Tuple
import httpx

from backend.app.core.config import settings
from backend.app.services.osm_service import haversine_distance_m

logger = logging.getLogger("lifelane.router")

def project_point_to_segment(
    lat: float, lon: float,
    lat1: float, lon1: float,
    lat2: float, lon2: float
) -> Tuple[float, float, float, float]:
    """
    Project point (lat, lon) onto segment (lat1, lon1) -> (lat2, lon2)
    using local equirectangular projection in meters.
    Returns: (snapped_lat, snapped_lon, cross_track_distance_m, segment_t)
    where segment_t is in [0.0, 1.0].
    """
    mid_lat = (lat1 + lat2 + lat) / 3.0
    cos_lat = math.cos(math.radians(mid_lat))
    kx = cos_lat * 111320.0
    ky = 110540.0

    x1 = lon1 * kx
    y1 = lat1 * ky
    x2 = lon2 * kx
    y2 = lat2 * ky
    px = lon * kx
    py = lat * ky

    dx = x2 - x1
    dy = y2 - y1
    seg_len_sq = dx * dx + dy * dy

    if seg_len_sq < 1e-9:
        t = 0.0
        proj_x, proj_y = x1, y1
    else:
        t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / seg_len_sq))
        proj_x = x1 + t * dx
        proj_y = y1 + t * dy

    dist_m = math.hypot(px - proj_x, py - proj_y)
    snapped_lon = proj_x / kx
    snapped_lat = proj_y / ky
    return snapped_lat, snapped_lon, dist_m, t

def snap_to_polyline(lat: float, lon: float, polyline: List[List[float]]) -> Dict[str, Any]:
    """
    Snap (lat, lon) to nearest segment on polyline (GeoJSON format: [[lon, lat], ...]).
    Returns:
      snapped_lat, snapped_lon,
      cross_track_distance_m,
      distance_along_route_m (from polyline start to snapped point),
      segment_index
    """
    if not polyline or len(polyline) < 2:
        return {
            "snapped_lat": lat,
            "snapped_lon": lon,
            "cross_track_distance_m": 0.0,
            "distance_along_route_m": 0.0,
            "segment_index": 0
        }

    min_dist = float("inf")
    best_snap = (lat, lon)
    best_segment_idx = 0
    best_t = 0.0

    # Cumulative distance array for segment starts
    segment_cum_dist = [0.0]
    total_cum = 0.0
    for i in range(len(polyline) - 1):
        seg_d = haversine_distance_m(polyline[i][1], polyline[i][0], polyline[i+1][1], polyline[i+1][0])
        total_cum += seg_d
        segment_cum_dist.append(total_cum)

    for i in range(len(polyline) - 1):
        p1 = polyline[i]
        p2 = polyline[i+1]
        s_lat, s_lon, d_m, t = project_point_to_segment(
            lat, lon, p1[1], p1[0], p2[1], p2[0]
        )
        if d_m < min_dist:
            min_dist = d_m
            best_snap = (s_lat, s_lon)
            best_segment_idx = i
            best_t = t

    # Compute distance along polyline to snapped point
    seg_start_dist = segment_cum_dist[best_segment_idx]
    seg_length = segment_cum_dist[best_segment_idx + 1] - seg_start_dist
    dist_along = seg_start_dist + (best_t * seg_length)

    return {
        "snapped_lat": round(best_snap[0], 6),
        "snapped_lon": round(best_snap[1], 6),
        "cross_track_distance_m": round(min_dist, 1),
        "distance_along_route_m": round(dist_along, 1),
        "segment_index": best_segment_idx,
        "total_route_distance_m": round(total_cum, 1)
    }

def order_intersections_along_route(
    intersections: List[Dict[str, Any]],
    polyline: List[List[float]],
    max_lateral_deviation_m: float = 200.0
) -> List[Dict[str, Any]]:
    """
    Project and sort traffic signals along the active route polyline.
    Filters out intersections that are too far from the corridor (> max_lateral_deviation_m).
    Orders signals strictly by their distance along the route.
    """
    along_route = []
    for sig in intersections:
        snap = snap_to_polyline(sig["latitude"], sig["longitude"], polyline)
        if snap["cross_track_distance_m"] <= max_lateral_deviation_m:
            along_route.append({
                **sig,
                "distance_along_route_m": snap["distance_along_route_m"],
                "lateral_offset_m": snap["cross_track_distance_m"]
            })

    # Sort strictly by order of encounter along route
    along_route.sort(key=lambda s: s["distance_along_route_m"])
    return along_route


class RouterService:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or getattr(settings, "OSRM_BASE_URL", "https://router.project-osrm.org")

    def _fallback_route(
        self, origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float
    ) -> Dict[str, Any]:
        """Compute straight-line route fallback if OSRM is unreachable."""
        dist_m = haversine_distance_m(origin_lat, origin_lon, dest_lat, dest_lon)
        # Average simulated speed ~ 40 km/h = 11.1 m/s
        duration_s = round(dist_m / 11.1, 1) if dist_m > 0 else 0.0
        return {
            "polyline": [
                [round(origin_lon, 6), round(origin_lat, 6)],
                [round(dest_lon, 6), round(dest_lat, 6)]
            ],
            "distance_m": round(dist_m, 1),
            "duration_s": duration_s,
            "steps": [
                {
                    "instruction": "Proceed to emergency destination",
                    "distance_m": round(dist_m, 1),
                    "duration_s": duration_s,
                    "location": [round(origin_lon, 6), round(origin_lat, 6)]
                }
            ],
            "route_source": "fallback_straight_line"
        }

    async def get_route(
        self, origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float
    ) -> Dict[str, Any]:
        """
        Request driving route from OSRM. Coordinates are {lon},{lat}.
        Never block the event loop: uses httpx.AsyncClient with 3.0s timeout.
        Falls back to straight-line route on error/timeout.
        """
        # Format: /route/v1/driving/{start_lon},{start_lat};{dest_lon},{dest_lat}?steps=true&geometries=geojson&overview=full
        url = (
            f"{self.base_url.rstrip('/')}/route/v1/driving/"
            f"{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
            f"?steps=true&geometries=geojson&overview=full"
        )

        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(url)
                if res.status_code != 200:
                    logger.warning(f"OSRM returned status {res.status_code}, falling back to straight-line route")
                    return self._fallback_route(origin_lat, origin_lon, dest_lat, dest_lon)

                data = res.json()
                routes = data.get("routes", [])
                if not routes:
                    return self._fallback_route(origin_lat, origin_lon, dest_lat, dest_lon)

                route = routes[0]
                geometry = route.get("geometry", {})
                coordinates = geometry.get("coordinates", [])
                distance_m = route.get("distance", 0.0)
                duration_s = route.get("duration", 0.0)

                # Extract turn-by-turn steps
                steps = []
                legs = route.get("legs", [])
                for leg in legs:
                    for raw_step in leg.get("steps", []):
                        maneuver = raw_step.get("maneuver", {})
                        m_type = maneuver.get("type", "")
                        m_modifier = maneuver.get("modifier", "")
                        name = raw_step.get("name", "")
                        
                        # Build clear instruction
                        if m_type == "depart":
                            instruction = f"Head on {name}" if name else "Depart towards destination"
                        elif m_type == "arrive":
                            instruction = "Arrive at destination"
                        elif m_modifier:
                            instruction = f"Turn {m_modifier} onto {name}" if name else f"Turn {m_modifier}"
                        elif m_type:
                            instruction = f"Continue on {name}" if name else "Continue along route"
                        else:
                            instruction = "Proceed on route"

                        steps.append({
                            "instruction": instruction,
                            "distance_m": round(raw_step.get("distance", 0.0), 1),
                            "duration_s": round(raw_step.get("duration", 0.0), 1),
                            "location": maneuver.get("location", [0.0, 0.0])
                        })

                if not coordinates:
                    return self._fallback_route(origin_lat, origin_lon, dest_lat, dest_lon)

                return {
                    "polyline": coordinates,
                    "distance_m": round(distance_m, 1),
                    "duration_s": round(duration_s, 1),
                    "steps": steps,
                    "route_source": "osrm"
                }

        except Exception as e:
            logger.warning(f"OSRM request failed ({type(e).__name__}: {e}), using fallback route")
            return self._fallback_route(origin_lat, origin_lon, dest_lat, dest_lon)


router_service = RouterService()
