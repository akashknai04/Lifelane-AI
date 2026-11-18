"""
LifeLane AI — Incident Detection AI (Module 5)
Statistical anomaly detection and spatiotemporal variance filter.
Detects unexpected road blockages, vehicle breakdowns, and traffic anomalies.
"""

from typing import Dict, Any, List, Optional
import numpy as np


class IncidentSeverity:
    LEVEL_1 = "LEVEL_1"  # Minor friction / slow moving obstruction
    LEVEL_2 = "LEVEL_2"  # Moderate breakdown (1 lane blocked)
    LEVEL_3 = "LEVEL_3"  # Severe blockage / road closed


class IncidentDetector:
    """
    Evaluates sudden vehicle deceleration and speed variances across links.
    Triggers incident alerts to prompt dynamic A* rerouting.
    """
    def __init__(self, z_score_threshold: float = 3.0):
        self.z_score_threshold = z_score_threshold

    def evaluate_link_telemetry(
        self,
        link_id: str,
        recent_speeds_kmh: List[float],
        historical_mean_kmh: float,
        historical_std_kmh: float,
        vision_detected_obstacle: bool = False
    ) -> Dict[str, Any]:
        """
        Determines if an incident is occurring on a road link based on speed variance and vision cues.
        """
        if not recent_speeds_kmh:
            return {"incident_detected": False, "link_id": link_id}

        current_avg = float(np.mean(recent_speeds_kmh))
        std = max(historical_std_kmh, 2.0)
        z_score = (historical_mean_kmh - current_avg) / std

        is_incident = False
        severity = None
        clearance_penalty_minutes = 0.0

        if vision_detected_obstacle or z_score >= 4.0 or current_avg < 5.0:
            is_incident = True
            severity = IncidentSeverity.LEVEL_3
            clearance_penalty_minutes = 25.0
            description = "Complete lane blockage or severe breakdown detected"
        elif z_score >= self.z_score_threshold or current_avg < (historical_mean_kmh * 0.4):
            is_incident = True
            severity = IncidentSeverity.LEVEL_2
            clearance_penalty_minutes = 12.0
            description = "Moderate traffic anomaly / speed drop > 3σ"
        elif z_score >= 2.0:
            is_incident = True
            severity = IncidentSeverity.LEVEL_1
            clearance_penalty_minutes = 5.0
            description = "Minor slowdown / lane friction"
        else:
            description = "Normal traffic flow"

        return {
            "link_id": link_id,
            "incident_detected": is_incident,
            "severity": severity,
            "z_score": round(float(z_score), 2),
            "current_speed_kmh": round(current_avg, 1),
            "historical_mean_kmh": round(historical_mean_kmh, 1),
            "clearance_penalty_minutes": clearance_penalty_minutes,
            "description": description,
        }


incident_detector = IncidentDetector()
