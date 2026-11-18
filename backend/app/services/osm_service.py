import math
from typing import List, Dict, Any, Optional

def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance in meters between two coordinates."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

# Pre-indexed major road intersections along the Koramangala - Richmond - MG Road - Victoria Hospital corridor in Bengaluru
BENGALURU_CORRIDOR_INTERSECTIONS = [
    {
        "intersection_code": "INT-BLR-01",
        "name": "St. John's Hospital Junction (Koramangala 100ft Rd)",
        "latitude": 12.9298,
        "longitude": 77.6205,
        "azimuth_deg": 330.0,
        "default_cycle_sec": 90
    },
    {
        "intersection_code": "INT-BLR-02",
        "name": "Dairy Circle (Hosur Main Road)",
        "latitude": 12.9385,
        "longitude": 77.5997,
        "azimuth_deg": 320.0,
        "default_cycle_sec": 100
    },
    {
        "intersection_code": "INT-BLR-03",
        "name": "Adugodi Signal (Hosur Road / Bosch Gate)",
        "latitude": 12.9436,
        "longitude": 77.6083,
        "azimuth_deg": 340.0,
        "default_cycle_sec": 80
    },
    {
        "intersection_code": "INT-BLR-04",
        "name": "Anepalya Junction",
        "latitude": 12.9512,
        "longitude": 77.6041,
        "azimuth_deg": 350.0,
        "default_cycle_sec": 90
    },
    {
        "intersection_code": "INT-BLR-05",
        "name": "Richmond Circle Flyover Intersection",
        "latitude": 12.9620,
        "longitude": 77.5968,
        "azimuth_deg": 315.0,
        "default_cycle_sec": 120
    },
    {
        "intersection_code": "INT-BLR-06",
        "name": "Hudson / Corporation Circle",
        "latitude": 12.9667,
        "longitude": 77.5872,
        "azimuth_deg": 280.0,
        "default_cycle_sec": 110
    },
    {
        "intersection_code": "INT-BLR-07",
        "name": "Kalasipalyam / Victoria Hospital Emergency Gate Signal",
        "latitude": 12.9634,
        "longitude": 77.5756,
        "azimuth_deg": 260.0,
        "default_cycle_sec": 75
    },
    {
        "intersection_code": "INT-BLR-08",
        "name": "Trinity Circle (MG Road / Trinity Metro)",
        "latitude": 12.9731,
        "longitude": 77.6198,
        "azimuth_deg": 90.0,
        "default_cycle_sec": 90
    },
    {
        "intersection_code": "INT-BLR-09",
        "name": "Mayo Hall / Brigade Road Junction",
        "latitude": 12.9738,
        "longitude": 77.6074,
        "azimuth_deg": 270.0,
        "default_cycle_sec": 100
    },
    {
        "intersection_code": "INT-BLR-10",
        "name": "Bowring Hospital / Lady Curzon Road Junction",
        "latitude": 12.9821,
        "longitude": 77.6012,
        "azimuth_deg": 300.0,
        "default_cycle_sec": 80
    },
    {
        "intersection_code": "INT-BLR-11",
        "name": "ASC Centre / Victoria Layout Junction (Old Airport Rd)",
        "latitude": 12.9678,
        "longitude": 77.6285,
        "azimuth_deg": 110.0,
        "default_cycle_sec": 90
    },
    {
        "intersection_code": "INT-BLR-12",
        "name": "Domlur Flyover / Intermediate Ring Road (IRR) Junction",
        "latitude": 12.9610,
        "longitude": 77.6385,
        "azimuth_deg": 115.0,
        "default_cycle_sec": 110
    },
    {
        "intersection_code": "INT-BLR-13",
        "name": "Command Hospital / HAL 2nd Stage Gate Junction",
        "latitude": 12.9598,
        "longitude": 77.6432,
        "azimuth_deg": 105.0,
        "default_cycle_sec": 80
    },
    {
        "intersection_code": "INT-BLR-14",
        "name": "Manipal Hospital Emergency Entrance Signal (Old Airport Rd)",
        "latitude": 12.9589,
        "longitude": 77.6480,
        "azimuth_deg": 95.0,
        "default_cycle_sec": 75
    }
]

HOSPITAL_DESTINATIONS = [
    {
        "id": "HOSP-01",
        "name": "Victoria Hospital (BMCRI Trauma Centre)",
        "latitude": 12.9634,
        "longitude": 77.5756,
        "type": "Level 1 Emergency & Trauma"
    },
    {
        "id": "HOSP-02",
        "name": "St. John's Medical College Hospital",
        "latitude": 12.9298,
        "longitude": 77.6205,
        "type": "Tertiary Referral & Pediatric"
    },
    {
        "id": "HOSP-03",
        "name": "Bowring and Lady Curzon Hospital",
        "latitude": 12.9821,
        "longitude": 77.6012,
        "type": "General Acute Care"
    },
    {
        "id": "HOSP-04",
        "name": "Manipal Hospital Old Airport Road",
        "latitude": 12.9589,
        "longitude": 77.6483,
        "type": "Cardiac & Critical Care"
    }
]

class OSMDistrictService:
    def __init__(self):
        self.intersections = BENGALURU_CORRIDOR_INTERSECTIONS
        self.hospitals = HOSPITAL_DESTINATIONS

    def get_all_intersections(self) -> List[Dict[str, Any]]:
        return self.intersections

    def get_all_hospitals(self) -> List[Dict[str, Any]]:
        return self.hospitals

    def find_nearest_intersection(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        if not self.intersections:
            return None
        closest = None
        min_dist = float('inf')
        for item in self.intersections:
            d = haversine_distance_m(lat, lon, item["latitude"], item["longitude"])
            if d < min_dist:
                min_dist = d
                closest = {**item, "distance_m": round(d, 1)}
        return closest

    def get_corridor_intersections_between(
        self, origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float
    ) -> List[Dict[str, Any]]:
        """Filter intersections along the corridor within the bounding box plus margin."""
        min_lat = min(origin_lat, dest_lat) - 0.008
        max_lat = max(origin_lat, dest_lat) + 0.008
        min_lon = min(origin_lon, dest_lon) - 0.008
        max_lon = max(origin_lon, dest_lon) + 0.008

        corridor_ints = []
        for item in self.intersections:
            if (min_lat <= item["latitude"] <= max_lat and 
                min_lon <= item["longitude"] <= max_lon):
                # distance from origin
                dist_from_origin = haversine_distance_m(origin_lat, origin_lon, item["latitude"], item["longitude"])
                corridor_ints.append({**item, "dist_from_origin_m": round(dist_from_origin, 1)})

        corridor_ints.sort(key=lambda x: x["dist_from_origin_m"])
        return corridor_ints

    def calculate_baseline_eta_seconds(self, origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float) -> float:
        """Baseline travel time: great-circle route with 1.35 urban circuity factor at average 22 km/h urban speed."""
        straight_line_dist_m = haversine_distance_m(origin_lat, origin_lon, dest_lat, dest_lon)
        urban_road_distance_m = straight_line_dist_m * 1.35
        # Average unassisted urban speed: 22 km/h = 6.11 m/s, plus average 45s wait per encountered signal
        corridor_signals = len(self.get_corridor_intersections_between(origin_lat, origin_lon, dest_lat, dest_lon))
        travel_seconds = (urban_road_distance_m / 6.11) + (corridor_signals * 35.0)
        return round(travel_seconds, 1)

osm_service = OSMDistrictService()
