"""
SAATHI Specialist Civic Intelligence Agent
Processes citizen grievances, classifies municipal departments, calculates resolution SLAs,
and generates structured tracking dossiers.
"""

import time
import random
from typing import Dict, Any, List, Optional
from app.agents.base_agent import BaseAgent

CIVIC_CATEGORIES = {
    "garbage": {
        "category": "SANITATION",
        "department": "Greater Municipal Corporation - Solid Waste Management Division",
        "sla_hours": 24,
        "priority": "HIGH"
    },
    "trash": {
        "category": "SANITATION",
        "department": "Greater Municipal Corporation - Solid Waste Management Division",
        "sla_hours": 24,
        "priority": "HIGH"
    },
    "pothole": {
        "category": "ROADS_INFRASTRUCTURE",
        "department": "Department of Urban Roads & Public Infrastructure",
        "sla_hours": 48,
        "priority": "MEDIUM"
    },
    "road": {
        "category": "ROADS_INFRASTRUCTURE",
        "department": "Department of Urban Roads & Public Infrastructure",
        "sla_hours": 48,
        "priority": "MEDIUM"
    },
    "water": {
        "category": "WATER_SUPPLY",
        "department": "Metropolitan Water Supply & Sewerage Board",
        "sla_hours": 12,
        "priority": "HIGH"
    },
    "drain": {
        "category": "WATER_SUPPLY",
        "department": "Metropolitan Water Supply & Sewerage Board",
        "sla_hours": 24,
        "priority": "HIGH"
    },
    "light": {
        "category": "ELECTRICITY",
        "department": "State Power Distribution Corporation - Street Lighting Cell",
        "sla_hours": 36,
        "priority": "MEDIUM"
    },
    "wire": {
        "category": "ELECTRICITY",
        "department": "State Power Distribution Corporation - Emergency Repair Cell",
        "sla_hours": 4,
        "priority": "CRITICAL"
    }
}

class CivicSpecialistAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="CivicGrievanceSpecialist")

    def process_complaint(
        self,
        input_content: str,
        user_location: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Classifies municipal issue, drafts structured case, and returns tracking ID.
        """
        text_lower = input_content.lower()
        matched_cat = None
        
        for kw, details in CIVIC_CATEGORIES.items():
            if kw in text_lower:
                matched_cat = details
                break
                
        if not matched_cat:
            matched_cat = {
                "category": "PUBLIC_HEALTH",
                "department": "Municipal Grievance Redressal Cell",
                "sla_hours": 48,
                "priority": "MEDIUM"
            }
            
        case_ref_id = f"CIVIC-2026-{random.randint(7000, 9999)}"
        
        civic_assessment = {
            "category": matched_cat["category"],
            "department": matched_cat["department"],
            "urgency_sla_hours": matched_cat["sla_hours"],
            "case_reference_id": case_ref_id,
            "structured_summary": f"Citizen reported: {input_content[:120]}...",
            "recommended_actions": [
                f"Dispatch inspection task force to assigned coordinates.",
                f"Route work ticket to {matched_cat['department']}.",
                f"Send SMS and WhatsApp tracking update with reference {case_ref_id}."
            ]
        }
        
        action_payload = {
            "action_type": "file_civic_complaint",
            "target": matched_cat["department"],
            "data_shared": ["description", "location", "contact_info"],
            "metadata": {
                "case_reference_id": case_ref_id,
                "category": matched_cat["category"],
                "sla_hours": matched_cat["sla_hours"],
                "priority": matched_cat["priority"]
            }
        }
        
        response_voice = (
            f"I have classified your grievance under {matched_cat['category'].replace('_', ' ').title()}. "
            f"I have generated Case Reference ID {case_ref_id} with a {matched_cat['sla_hours']} hour resolution SLA. "
            f"Please authorize to officially submit this report to the {matched_cat['department']}."
        )

        return {
            "civic_assessment": civic_assessment,
            "action_payload": action_payload,
            "response_voice_text": response_voice,
            "risk_score": 0.35 if matched_cat["priority"] == "MEDIUM" else 0.65,
            "risk_level": matched_cat["priority"]
        }

civic_agent = CivicSpecialistAgent()
