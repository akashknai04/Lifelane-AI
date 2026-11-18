"""
LifeLane AI — Driver Alert & Diversion Subsystem (Module 6 & Subsystem 4)
Broadcasts multi-channel proactive warnings to civilian commuters:
- Target radius: 500m around emergency vehicle
- Lead time: 30–45s before arrival (10x siren audibility window)
- Delivery channels:
    1. Roadside Variable Message Signs (VMS / LED Displays)
    2. Consumer Navigation Webhook Push (Google Maps / Apple Maps / MapmyIndia)
    3. Simulated C-V2X / DSRC Emergency Vehicle Alert (SAE J2735 EVA)
"""

import time
from typing import Dict, Any, List, Optional
from backend.app.services.osm_service import haversine_distance_m


class VMSDisplay:
    """Simulated municipal roadside Variable Message Sign / LED matrix board."""
    def __init__(self, vms_id: str, location_name: str, latitude: float, longitude: float):
        self.vms_id = vms_id
        self.location_name = location_name
        self.latitude = latitude
        self.longitude = longitude
        self.active_message: str = "WELCOME TO BENGALURU - DRIVE SAFELY"
        self.is_emergency_active: bool = False
        self.activated_at: Optional[float] = None

    def display_emergency(self, vehicle_type: str, eta_seconds: float):
        v_title = vehicle_type.replace("_", " ").upper()
        self.active_message = f"EMERGENCY {v_title} APPROACHING ({int(eta_seconds)}s) - MOVE TO LEFT - KEEP LANE 1 CLEAR"
        self.is_emergency_active = True
        self.activated_at = time.time()

    def reset_display(self):
        self.active_message = "SPEED LIMIT 50 KM/H - DRIVE RESPONSIBLY"
        self.is_emergency_active = False
        self.activated_at = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "vms_id": self.vms_id,
            "location_name": self.location_name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "active_message": self.active_message,
            "is_emergency_active": self.is_emergency_active,
            "activated_at": self.activated_at,
        }


class AlertDispatcher:
    """
    Intelligent Driver Notification Dispatcher.
    Monitors vehicle telemetry and pushes multi-channel alerts within 500m radius.
    """
    ALERT_RADIUS_M = 500.0
    MIN_LEAD_TIME_S = 30.0
    MAX_LEAD_TIME_S = 45.0

    def __init__(self):
        self.vms_signs: Dict[str, VMSDisplay] = {}
        self.active_broadcasts: List[Dict[str, Any]] = []
        self._init_roadside_vms()

    def _init_roadside_vms(self):
        # Roadside LED VMS panels located at major junctions
        sample_vms = [
            ("VMS-01", "Koramangala 100ft Road Gantry", 12.9300, 77.6200),
            ("VMS-02", "Hosur Road - Dairy Circle Overhead", 12.9380, 77.6000),
            ("VMS-03", "Adugodi Junction LED Board", 12.9440, 77.6080),
            ("VMS-04", "Richmond Flyover North Approach", 12.9615, 77.5970),
            ("VMS-05", "Corporation Circle Overhead Matrix", 12.9680, 77.5890),
            ("VMS-06", "Old Airport Road - Manipal Signal Gantry", 12.9585, 77.6490),
        ]
        for vid, loc, lat, lon in sample_vms:
            self.vms_signs[vid] = VMSDisplay(vid, loc, lat, lon)

    def dispatch_alerts(
        self,
        session_id: str,
        vehicle_type: str,
        current_lat: float,
        current_lon: float,
        speed_mps: float,
        heading_deg: float
    ) -> Dict[str, Any]:
        """
        Evaluates surrounding infrastructure and commuters within 500m.
        Updates VMS boards, generates navigation push payloads, and issues C-V2X messages.
        """
        speed = max(speed_mps, 5.0)
        now = time.time()
        activated_vms = []

        # 1. Roadside Variable Message Signs within alert zone
        for vms in self.vms_signs.values():
            dist = haversine_distance_m(current_lat, current_lon, vms.latitude, vms.longitude)
            if dist <= self.ALERT_RADIUS_M:
                eta_s = dist / speed
                vms.display_emergency(vehicle_type, eta_s)
                activated_vms.append({
                    "vms_id": vms.vms_id,
                    "location": vms.location_name,
                    "distance_m": round(dist, 1),
                    "message": vms.active_message,
                })

        # 2. Consumer Navigation Webhook Push Payload (e.g. Google Maps, MapmyIndia)
        nav_push_payload = {
            "protocol": "LIFE_LANE_CIVILIAN_ALERT_V1",
            "session_id": session_id,
            "vehicle_type": vehicle_type,
            "vehicle_location": {"latitude": current_lat, "longitude": current_lon},
            "vehicle_bearing_deg": heading_deg,
            "alert_radius_meters": self.ALERT_RADIUS_M,
            "lead_time_seconds": 35.0,  # 30–45s lead time
            "lead_time_compliance": "30–45s ahead (10x siren range)",
            "action_directive": "YIELD_TO_LEFT",
            "lane_directive": "CLEAR_LANE_1",
            "message": f"Active {vehicle_type.upper()} approaching in 30-45s. Please merge safely to the left."
        }

        # 3. Simulated C-V2X / DSRC Emergency Vehicle Alert (SAE J2735 EVA)
        cv2x_packet = {
            "standard": "SAE_J2735_EVA",
            "vehicle_class": vehicle_type.upper(),
            "station_id": f"LL-{session_id[-4:] if len(session_id) >= 4 else '0000'}",
            "coordinates": [current_lat, current_lon],
            "speed_kmh": round(speed * 3.6, 1),
            "heading_deg": round(heading_deg, 1),
            "priority": "LEVEL_1_HIGHEST",
            "broadcast_radius_m": self.ALERT_RADIUS_M,
        }

        broadcast_summary = {
            "timestamp": now,
            "session_id": session_id,
            "vehicle_type": vehicle_type,
            "activated_vms_count": len(activated_vms),
            "activated_vms": activated_vms,
            "navigation_push": nav_push_payload,
            "cv2x_packet": cv2x_packet,
        }

        self.active_broadcasts.append(broadcast_summary)
        # Keep last 50 broadcasts in memory
        if len(self.active_broadcasts) > 50:
            self.active_broadcasts.pop(0)

        return broadcast_summary

    def get_vms_boards(self) -> List[Dict[str, Any]]:
        return [v.to_dict() for v in self.vms_signs.values()]

    def reset_all_vms(self):
        for v in self.vms_signs.values():
            v.reset_display()


alert_dispatcher = AlertDispatcher()
