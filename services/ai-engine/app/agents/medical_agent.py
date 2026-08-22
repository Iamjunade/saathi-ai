"""
SAATHI Specialist Medical Emergency Agent
Handles emergency triage, symptom assessment, pre-arrival hospital handovers,
and life-support first aid instructions.
"""

import time
from typing import Dict, Any, List, Optional
from app.agents.base_agent import BaseAgent, AITraceStep

NEARBY_HOSPITALS_DATABASE = [
    {
        "id": "HOSP-01",
        "name": "Apollo Emergency Triage & Trauma Center",
        "type": "Tertiary Multi-Specialty & Cardiac Care",
        "distance_km": 1.8,
        "eta_minutes": 6,
        "icu_available": True,
        "trauma_level": 1,
        "contact_phone": "+91-40-2360-7777",
        "triage_dept": "Apollo Emergency Triage"
    },
    {
        "id": "HOSP-02",
        "name": "Care Hospital Emergency Unit",
        "type": "Cardiac & Critical Care",
        "distance_km": 3.2,
        "eta_minutes": 10,
        "icu_available": True,
        "trauma_level": 1,
        "contact_phone": "+91-40-6165-6565",
        "triage_dept": "Care Emergency Triage"
    },
    {
        "id": "HOSP-03",
        "name": "Yashoda Hospitals Triage Center",
        "type": "General & Emergency Care",
        "distance_km": 4.5,
        "eta_minutes": 14,
        "icu_available": True,
        "trauma_level": 2,
        "contact_phone": "+91-40-4567-4567",
        "triage_dept": "Yashoda Emergency Desk"
    }
]

class MedicalSpecialistAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="MedicalTriageSpecialist")

    def assess_emergency(
        self,
        input_content: str,
        user_location: Optional[Dict[str, float]] = None,
        risk_score: float = 0.92
    ) -> Dict[str, Any]:
        """
        Performs clinical symptom triage and prepares emergency dispatch handover.
        """
        text_lower = input_content.lower()
        
        # Clinical symptom extraction
        symptoms = []
        if "chest" in text_lower or "heaviness" in text_lower:
            symptoms.append("Chest heaviness / tightness")
        if "breathe" in text_lower or "breath" in text_lower:
            symptoms.append("Dyspnea / Shortness of breath")
        if "pain" in text_lower:
            symptoms.append("Acute discomfort / pain")
        if "sweat" in text_lower:
            symptoms.append("Diaphoresis / cold sweats")
        if "dizzy" in text_lower or "faint" in text_lower:
            symptoms.append("Dizziness / lightheadedness")
        if not symptoms:
            symptoms.append("General acute medical distress")

        # Determine condition & urgency
        is_cardiac_or_respiratory = any("chest" in s.lower() or "breath" in s.lower() for s in symptoms)
        
        if is_cardiac_or_respiratory or risk_score >= 0.80:
            triage_category = "IMMEDIATE"
            suspected_condition = "Acute Coronary Syndrome / Acute Respiratory Compromise"
            urgency_code = "CODE_RED_CARDIAC"
            target_facility = NEARBY_HOSPITALS_DATABASE[0]
            first_aid = [
                "Sit upright in a comfortable position with back supported.",
                "Loosen all tight collar, neck, and waist clothing immediately.",
                "Take slow, gentle breaths and avoid any physical movement.",
                "Do NOT drive yourself; ambulance / emergency response is being prepared."
            ]
            response_voice = (
                "I understand you are experiencing severe chest heaviness. "
                "I have identified nearby emergency triage. "
                "I need your permission to share your location and contact Apollo Emergency Triage immediately."
            )
        else:
            triage_category = "URGENT" if risk_score >= 0.55 else "STANDARD"
            suspected_condition = "Acute Medical Evaluation Required"
            urgency_code = "CODE_YELLOW"
            target_facility = NEARBY_HOSPITALS_DATABASE[1]
            first_aid = [
                "Rest in a seated position.",
                "Keep hydration nearby and monitor vital comfort.",
                "Prepare medical history and list of current medications."
            ]
            response_voice = (
                "I have recorded your symptoms. I can connect you with nearby urgent care. "
                "Please confirm if you would like me to share details with Care Hospital Emergency Unit."
            )

        # Action payload for Hospital Portal and backend state machine
        action_payload = {
            "action_type": "contact_hospital",
            "target": target_facility["triage_dept"],
            "data_shared": ["name", "symptoms", "location"],
            "metadata": {
                "hospital_id": target_facility["id"],
                "hospital_name": target_facility["name"],
                "urgency_code": urgency_code,
                "eta_minutes": target_facility["eta_minutes"],
                "chief_complaint": symptoms[0],
                "recommended_first_aid": first_aid
            }
        }

        medical_assessment = {
            "triage_category": triage_category,
            "suspected_condition": suspected_condition,
            "recommended_first_aid": first_aid,
            "nearest_facilities": NEARBY_HOSPITALS_DATABASE,
            "pre_arrival_handover": {
                "chief_complaint": symptoms[0],
                "symptoms": symptoms,
                "risk_level": "CRITICAL" if triage_category == "IMMEDIATE" else "HIGH",
                "urgency_code": urgency_code
            }
        }

        return {
            "medical_assessment": medical_assessment,
            "action_payload": action_payload,
            "response_voice_text": response_voice
        }

medical_agent = MedicalSpecialistAgent()
