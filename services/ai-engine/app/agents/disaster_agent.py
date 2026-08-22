"""
SAATHI Specialist Disaster & Flood Evacuation Agent
Integrates Scikit-Learn / Gradient Boosting flood model with real-time geospatial
evacuation routing and Operations Dashboard telemetry.
"""

import os
import sys
from typing import Dict, Any, List, Optional
from app.agents.base_agent import BaseAgent

# Import Disaster Risk ML Model
from models.disaster_model import get_disaster_model

class DisasterSpecialistAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="DisasterEvacuationSpecialist")
        self.model = get_disaster_model()

    def assess_disaster(
        self,
        input_content: str,
        user_location: Optional[Dict[str, float]] = None,
        custom_features: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Executes ML flood inference and builds live evacuation plan.
        """
        loc = user_location or {"lat": 17.3850, "lng": 78.4867}
        lat = loc.get("lat", 17.3850)
        lng = loc.get("lng", 78.4867)
        
        # Hydrological parameter extraction from text
        text_lower = input_content.lower()
        features = custom_features or {}
        
        if "rising" in text_lower or "rapidly" in text_lower or "flood" in text_lower:
            features.setdefault("rainfall_mm_hr", 75.0)
            features.setdefault("water_level_rise_rate_cm_hr", 14.0)
            features.setdefault("elevation_meters", 12.0)
            features.setdefault("river_distance_meters", 280.0)
            features.setdefault("drainage_capacity_score", 0.25)
            features.setdefault("soil_saturation_pct", 92.0)
            
        disaster_assessment = self.model.assess_location_and_evacuation(
            lat=lat,
            lng=lng,
            flood_features=features
        )
        
        nearest_shelter = disaster_assessment["safe_shelters"][0]
        risk_score = disaster_assessment["flood_risk_score"]
        risk_level = disaster_assessment["risk_level"]
        
        # Action Payload for Operations Dashboard Map broadcast
        action_payload = {
            "action_type": "evacuation_alert",
            "target": "State Disaster Operations Center (SDOC)",
            "data_shared": ["coordinates", "water_depth", "evacuation_route", "shelter_id"],
            "metadata": {
                "flood_risk_score": risk_score,
                "risk_level": risk_level,
                "water_depth_cm": disaster_assessment["water_depth_cm"],
                "target_shelter": nearest_shelter["name"],
                "shelter_distance_km": nearest_shelter["distance_km"],
                "shelter_elevation_m": nearest_shelter["elevation_meters"],
                "total_corridor_steps": len(disaster_assessment["evacuation_corridor"]),
                "hazard_zones_detected": len(disaster_assessment["hazard_zones"])
            }
        }
        
        response_voice = (
            f"High flood risk detected with water rising in your sector. "
            f"Safe high-ground shelter mapped at {nearest_shelter['name']}, {nearest_shelter['distance_km']} kilometers away. "
            f"Please authorize sharing your distress beacon with the Disaster Operations Center to coordinate rescue."
        )

        return {
            "disaster_assessment": disaster_assessment,
            "action_payload": action_payload,
            "response_voice_text": response_voice,
            "risk_score": risk_score,
            "risk_level": risk_level
        }

disaster_agent = DisasterSpecialistAgent()
