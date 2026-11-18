"""
LifeLane AI — Road Network Graph Engine
Provides:
- Directed spatial graph of the Bengaluru emergency corridor
- Node and edge attributes (coordinates, distance, speed limits, road class, signals)
- Adjacency matrix and normalized graph Laplacian for GCN operations
"""

import math
from typing import Dict, Any, List, Tuple, Optional

# Major nodes across Bengaluru Emergency Grid
CORRIDOR_NODES = {
    "NODE_KORAMANGALA": {
        "id": "NODE_KORAMANGALA",
        "name": "Koramangala 100ft Road / Sony World Junction",
        "lat": 12.9340,
        "lon": 77.6205,
        "type": "intersection"
    },
    "NODE_ST_JOHNS": {
        "id": "NODE_ST_JOHNS",
        "name": "St. John's Hospital Emergency Gate",
        "lat": 12.9298,
        "lon": 77.6205,
        "type": "hospital"
    },
    "NODE_DAIRY_CIRCLE": {
        "id": "NODE_DAIRY_CIRCLE",
        "name": "Dairy Circle Flyover Junction",
        "lat": 12.9385,
        "lon": 77.5997,
        "type": "intersection"
    },
    "NODE_ADUGODI": {
        "id": "NODE_ADUGODI",
        "name": "Adugodi Signal (Hosur Rd / Bosch)",
        "lat": 12.9436,
        "lon": 77.6083,
        "type": "intersection"
    },
    "NODE_ANEPALYA": {
        "id": "NODE_ANEPALYA",
        "name": "Anepalya Junction",
        "lat": 12.9512,
        "lon": 77.6041,
        "type": "intersection"
    },
    "NODE_RICHMOND": {
        "id": "NODE_RICHMOND",
        "name": "Richmond Circle Flyover",
        "lat": 12.9620,
        "lon": 77.5968,
        "type": "intersection"
    },
    "NODE_HUDSON": {
        "id": "NODE_HUDSON",
        "name": "Hudson / Corporation Circle",
        "lat": 12.9667,
        "lon": 77.5872,
        "type": "intersection"
    },
    "NODE_VICTORIA_HOSP": {
        "id": "NODE_VICTORIA_HOSP",
        "name": "Victoria Hospital (BMCRI Trauma Centre)",
        "lat": 12.9634,
        "lon": 77.5756,
        "type": "hospital"
    },
    "NODE_TRINITY": {
        "id": "NODE_TRINITY",
        "name": "Trinity Circle (MG Road / Metro)",
        "lat": 12.9731,
        "lon": 77.6198,
        "type": "intersection"
    },
    "NODE_MAYO_HALL": {
        "id": "NODE_MAYO_HALL",
        "name": "Mayo Hall / Brigade Road Junction",
        "lat": 12.9738,
        "lon": 77.6074,
        "type": "intersection"
    },
    "NODE_BOWRING_HOSP": {
        "id": "NODE_BOWRING_HOSP",
        "name": "Bowring & Lady Curzon Hospital",
        "lat": 12.9821,
        "lon": 77.6012,
        "type": "hospital"
    },
    "NODE_ASC_CENTRE": {
        "id": "NODE_ASC_CENTRE",
        "name": "ASC Centre / Victoria Layout Junction",
        "lat": 12.9678,
        "lon": 77.6285,
        "type": "intersection"
    },
    "NODE_DOMLUR": {
        "id": "NODE_DOMLUR",
        "name": "Domlur Flyover / IRR Junction",
        "lat": 12.9610,
        "lon": 77.6385,
        "type": "intersection"
    },
    "NODE_COMMAND_HOSP": {
        "id": "NODE_COMMAND_HOSP",
        "name": "Command Hospital Signal",
        "lat": 12.9598,
        "lon": 77.6432,
        "type": "intersection"
    },
    "NODE_MANIPAL_HOSP": {
        "id": "NODE_MANIPAL_HOSP",
        "name": "Manipal Hospital Old Airport Road",
        "lat": 12.9589,
        "lon": 77.6483,
        "type": "hospital"
    }
}

# Directed edges representing urban arterial segments in Bengaluru
CORRIDOR_EDGES = [
    # Koramangala <-> St. John's
    {"u": "NODE_KORAMANGALA", "v": "NODE_ST_JOHNS", "name": "Koramangala 100ft Road", "length_m": 520, "speed_limit_kmh": 50, "road_class": "arterial", "signals": 1},
    {"u": "NODE_ST_JOHNS", "v": "NODE_KORAMANGALA", "name": "Koramangala 100ft Road", "length_m": 520, "speed_limit_kmh": 50, "road_class": "arterial", "signals": 1},

    # St. John's <-> Adugodi
    {"u": "NODE_ST_JOHNS", "v": "NODE_ADUGODI", "name": "Hosur Main Road", "length_m": 2100, "speed_limit_kmh": 60, "road_class": "arterial", "signals": 2},
    {"u": "NODE_ADUGODI", "v": "NODE_ST_JOHNS", "name": "Hosur Main Road", "length_m": 2100, "speed_limit_kmh": 60, "road_class": "arterial", "signals": 2},

    # St. John's <-> Dairy Circle
    {"u": "NODE_ST_JOHNS", "v": "NODE_DAIRY_CIRCLE", "name": "Tavarekere Main Rd", "length_m": 2400, "speed_limit_kmh": 45, "road_class": "secondary", "signals": 2},
    {"u": "NODE_DAIRY_CIRCLE", "v": "NODE_ST_JOHNS", "name": "Tavarekere Main Rd", "length_m": 2400, "speed_limit_kmh": 45, "road_class": "secondary", "signals": 2},

    # Dairy Circle <-> Adugodi
    {"u": "NODE_DAIRY_CIRCLE", "v": "NODE_ADUGODI", "name": "Bannerghatta Link Rd", "length_m": 1200, "speed_limit_kmh": 40, "road_class": "secondary", "signals": 1},
    {"u": "NODE_ADUGODI", "v": "NODE_DAIRY_CIRCLE", "name": "Bannerghatta Link Rd", "length_m": 1200, "speed_limit_kmh": 40, "road_class": "secondary", "signals": 1},

    # Adugodi <-> Anepalya
    {"u": "NODE_ADUGODI", "v": "NODE_ANEPALYA", "name": "Hosur Road", "length_m": 950, "speed_limit_kmh": 50, "road_class": "arterial", "signals": 1},
    {"u": "NODE_ANEPALYA", "v": "NODE_ADUGODI", "name": "Hosur Road", "length_m": 950, "speed_limit_kmh": 50, "road_class": "arterial", "signals": 1},

    # Anepalya <-> Richmond Circle
    {"u": "NODE_ANEPALYA", "v": "NODE_RICHMOND", "name": "Langford Road", "length_m": 1450, "speed_limit_kmh": 50, "road_class": "arterial", "signals": 1},
    {"u": "NODE_RICHMOND", "v": "NODE_ANEPALYA", "name": "Langford Road", "length_m": 1450, "speed_limit_kmh": 50, "road_class": "arterial", "signals": 1},

    # Richmond Circle <-> Hudson Circle
    {"u": "NODE_RICHMOND", "v": "NODE_HUDSON", "name": "Kasturba Road", "length_m": 1250, "speed_limit_kmh": 50, "road_class": "arterial", "signals": 1},
    {"u": "NODE_HUDSON", "v": "NODE_RICHMOND", "name": "Kasturba Road", "length_m": 1250, "speed_limit_kmh": 50, "road_class": "arterial", "signals": 1},

    # Hudson Circle <-> Victoria Hospital
    {"u": "NODE_HUDSON", "v": "NODE_VICTORIA_HOSP", "name": "Kalasipalyam Main Rd", "length_m": 1350, "speed_limit_kmh": 40, "road_class": "arterial", "signals": 1},
    {"u": "NODE_VICTORIA_HOSP", "v": "NODE_HUDSON", "name": "Kalasipalyam Main Rd", "length_m": 1350, "speed_limit_kmh": 40, "road_class": "arterial", "signals": 1},

    # Richmond Circle <-> Mayo Hall
    {"u": "NODE_RICHMOND", "v": "NODE_MAYO_HALL", "name": "Residency Road", "length_m": 1500, "speed_limit_kmh": 45, "road_class": "arterial", "signals": 2},
    {"u": "NODE_MAYO_HALL", "v": "NODE_RICHMOND", "name": "Residency Road", "length_m": 1500, "speed_limit_kmh": 45, "road_class": "arterial", "signals": 2},

    # Mayo Hall <-> Trinity Circle
    {"u": "NODE_MAYO_HALL", "v": "NODE_TRINITY", "name": "MG Road", "length_m": 1300, "speed_limit_kmh": 50, "road_class": "arterial", "signals": 1},
    {"u": "NODE_TRINITY", "v": "NODE_MAYO_HALL", "name": "MG Road", "length_m": 1300, "speed_limit_kmh": 50, "road_class": "arterial", "signals": 1},

    # Mayo Hall <-> Bowring Hospital
    {"u": "NODE_MAYO_HALL", "v": "NODE_BOWRING_HOSP", "name": "Lady Curzon Road", "length_m": 1100, "speed_limit_kmh": 40, "road_class": "arterial", "signals": 1},
    {"u": "NODE_BOWRING_HOSP", "v": "NODE_MAYO_HALL", "name": "Lady Curzon Road", "length_m": 1100, "speed_limit_kmh": 40, "road_class": "arterial", "signals": 1},

    # Trinity Circle <-> ASC Centre
    {"u": "NODE_TRINITY", "v": "NODE_ASC_CENTRE", "name": "Old Airport Road (West)", "length_m": 1150, "speed_limit_kmh": 55, "road_class": "arterial", "signals": 1},
    {"u": "NODE_ASC_CENTRE", "v": "NODE_TRINITY", "name": "Old Airport Road (West)", "length_m": 1150, "speed_limit_kmh": 55, "road_class": "arterial", "signals": 1},

    # ASC Centre <-> Domlur
    {"u": "NODE_ASC_CENTRE", "v": "NODE_DOMLUR", "name": "Old Airport Road", "length_m": 1300, "speed_limit_kmh": 55, "road_class": "arterial", "signals": 1},
    {"u": "NODE_DOMLUR", "v": "NODE_ASC_CENTRE", "name": "Old Airport Road", "length_m": 1300, "speed_limit_kmh": 55, "road_class": "arterial", "signals": 1},

    # Domlur <-> Command Hospital
    {"u": "NODE_DOMLUR", "v": "NODE_COMMAND_HOSP", "name": "Old Airport Road (HAL)", "length_m": 550, "speed_limit_kmh": 50, "road_class": "arterial", "signals": 1},
    {"u": "NODE_COMMAND_HOSP", "v": "NODE_DOMLUR", "name": "Old Airport Road (HAL)", "length_m": 550, "speed_limit_kmh": 50, "road_class": "arterial", "signals": 1},

    # Command Hospital <-> Manipal Hospital
    {"u": "NODE_COMMAND_HOSP", "v": "NODE_MANIPAL_HOSP", "name": "Old Airport Road Approach", "length_m": 600, "speed_limit_kmh": 50, "road_class": "arterial", "signals": 1},
    {"u": "NODE_MANIPAL_HOSP", "v": "NODE_COMMAND_HOSP", "name": "Old Airport Road Approach", "length_m": 600, "speed_limit_kmh": 50, "road_class": "arterial", "signals": 1},

    # Domlur <-> Koramangala (via Intermediate Ring Road / IRR)
    {"u": "NODE_DOMLUR", "v": "NODE_KORAMANGALA", "name": "Intermediate Ring Road (IRR)", "length_m": 3400, "speed_limit_kmh": 65, "road_class": "arterial", "signals": 2},
    {"u": "NODE_KORAMANGALA", "v": "NODE_DOMLUR", "name": "Intermediate Ring Road (IRR)", "length_m": 3400, "speed_limit_kmh": 65, "road_class": "arterial", "signals": 2},
]

class RoadNetworkGraph:
    def __init__(self):
        self.nodes = CORRIDOR_NODES
        self.edges = CORRIDOR_EDGES
        self.node_ids = list(self.nodes.keys())
        self.node_index = {nid: idx for idx, nid in enumerate(self.node_ids)}
        self._adj = {nid: [] for nid in self.node_ids}
        for edge in self.edges:
            self._adj[edge["u"]].append(edge)

    def get_neighbors(self, node_id: str) -> List[Dict[str, Any]]:
        return self._adj.get(node_id, [])

    def get_edge(self, u: str, v: str) -> Optional[Dict[str, Any]]:
        for edge in self._adj.get(u, []):
            if edge["v"] == v:
                return edge
        return None

    def find_nearest_node(self, lat: float, lon: float) -> str:
        """Find the closest graph node to given coordinates using haversine."""
        best_node = None
        min_dist = float("inf")
        for nid, data in self.nodes.items():
            d = self._haversine(lat, lon, data["lat"], data["lon"])
            if d < min_dist:
                min_dist = d
                best_node = nid
        return best_node

    @staticmethod
    def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371000.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2.0) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
        return R * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    def get_adjacency_matrix(self) -> List[List[float]]:
        """Returns standard binary adjacency matrix for GNN convolutions."""
        n = len(self.node_ids)
        matrix = [[0.0 for _ in range(n)] for _ in range(n)]
        for edge in self.edges:
            u_idx = self.node_index[edge["u"]]
            v_idx = self.node_index[edge["v"]]
            matrix[u_idx][v_idx] = 1.0
        return matrix

road_network = RoadNetworkGraph()
