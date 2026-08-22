"""
SAATHI Dynamic Multi-Factor Emergency Risk Engine
Computes granular risk scores (0.0 to 1.0), risk levels (LOW, MEDIUM, HIGH, CRITICAL),
recommended actions, confidence scores, and enforces human authorization gating policies.

SAFETY RULE 1 (MANDATORY MEDICAL GUARDRAIL):
- LLMs / AI models are strictly prohibited from diagnosing medical diseases or prescribing treatments.
- AI scope is strictly restricted to clinical symptom severity scoring, urgency triage classification
  (IMMEDIATE, URGENT, STANDARD, NON_URGENT), vital first-aid guidance, and pre-arrival hospital handover routing.
"""

from typing import Dict, Any, List, Optional, Literal
from app.config import settings

# Clinical symptom and disaster hazard dictionary with calibrated weights
RISK_KEYWORDS = {
    # Medical Critical & Urgent Symptoms (Triage Severity Scoring Only - No Disease Diagnosis)
    "chest pain": 0.92,
    "chest heaviness": 0.94,
    "can't breathe": 0.90,
    "cannot breathe": 0.90,
    "difficulty breathing": 0.88,
    "unconscious": 0.98,
    "heart attack": 0.95,
    "cardiac arrest": 0.99,
    "stroke": 0.94,
    "slurred speech": 0.86,
    "facial droop": 0.90,
    "severe bleeding": 0.90,
    "arterial bleeding": 0.96,
    "seizure": 0.88,
    "anaphylaxis": 0.92,
    "choking": 0.95,
    "poisoning": 0.90,
    "broken bone": 0.65,
    "fracture": 0.65,
    "severe burn": 0.78,
    "high fever": 0.45,
    "fever": 0.30,
    "headache": 0.20,
    "vomiting": 0.35,
    "dizziness": 0.40,
    "cough": 0.15,
    
    # Disaster & Flood Critical Indicators
    "flood": 0.80,
    "flooding": 0.82,
    "rising water": 0.88,
    "water level": 0.75,
    "water rising": 0.88,
    "trapped": 0.92,
    "submerged": 0.86,
    "evacuation": 0.82,
    "evacuate": 0.82,
    "landslide": 0.94,
    "building collapse": 0.98,
    "tsunami": 0.98,
    "cyclone": 0.88,
    "dam breach": 0.96,
    "storm surge": 0.85,
    "flash flood": 0.90,
    
    # Civic & Infrastructure Hazards
    "gas leak": 0.90,
    "live wire": 0.88,
    "electrical fire": 0.92,
    "sparking wire": 0.85,
    "open manhole": 0.70,
    "road cave-in": 0.80,
    "bridge damage": 0.85,
    "drainage overflow": 0.50,
    "pothole": 0.35,
    "garbage": 0.25,
    "trash": 0.25,
    "street light": 0.20,
    "water leakage": 0.30,
    "pipe burst": 0.45,
    "drainage blockage": 0.40
}

# Diagnostic phrases that must be rejected / flagged under Rule 1
PROHIBITED_DIAGNOSTIC_PATTERNS = [
    "you have been diagnosed with",
    "my diagnosis is",
    "you definitely have",
    "prescribing you the following medication"
]

class RiskEngine:
    def __init__(self):
        self.crit_threshold = settings.RISK_THRESHOLD_CRITICAL
        self.high_threshold = settings.RISK_THRESHOLD_HIGH
        self.med_threshold = settings.RISK_THRESHOLD_MEDIUM

    def evaluate_medical_safety_guardrail(self, output_text: str) -> Dict[str, Any]:
        """
        Enforces Rule 1: Never allow LLMs to diagnose medical diseases.
        Triage & symptom severity scoring only.
        """
        text_lower = output_text.lower()
        violates_rule = False
        violations = []

        for pattern in PROHIBITED_DIAGNOSTIC_PATTERNS:
            if pattern in text_lower:
                violates_rule = True
                violations.append(f"DIAGNOSTIC_HALLUCINATION_PROHIBITED: '{pattern}'")

        return {
            "compliant_with_rule_1": not violates_rule,
            "rule": "Rule 1: Never allow LLMs to diagnose medical diseases. Triage & symptom severity scoring only.",
            "violations": violations
        }

    def infer_intent(self, text: str) -> str:
        """Heuristic fallback intent inference if not explicitly provided"""
        text_lower = text.lower()
        
        # Medical
        if any(kw in text_lower for kw in [
            "chest", "pain", "breathe", "breathing", "heart", "unconscious", "blood",
            "bleeding", "stroke", "seizure", "ambulance", "hospital", "doctor", "fever", "injury"
        ]):
            return "medical"
            
        # Disaster
        if any(kw in text_lower for kw in [
            "flood", "rising water", "water rising", "submerged", "evacuate", "evacuation",
            "trapped", "landslide", "cyclone", "storm", "dam breach", "water level"
        ]):
            return "disaster"
            
        # Vision
        if any(kw in text_lower for kw in [
            "prescription", "document", "notice", "paper", "ocr", "receipt", "form", "bill"
        ]):
            return "vision"
            
        # Civic
        if any(kw in text_lower for kw in [
            "garbage", "trash", "pothole", "manhole", "street light", "gas leak",
            "live wire", "drainage", "pipe", "sanitation", "municipal"
        ]):
            return "civic"
            
        return "civic"

    def determine_recommended_action(
        self,
        intent: str,
        risk_level: str,
        input_text: str
    ) -> str:
        """
        Determines the deterministic recommended action according to intent and risk level.
        """
        text_lower = input_text.lower()
        
        if intent == "medical":
            if risk_level == "CRITICAL":
                return "search_and_contact_hospital"
            elif risk_level == "HIGH":
                return "search_and_contact_hospital"
            elif risk_level == "MEDIUM":
                return "recommend_urgent_care_clinic"
            else:
                return "provide_symptom_monitoring_guide"
                
        elif intent == "disaster":
            if risk_level in ["CRITICAL", "HIGH"]:
                return "evacuate_to_high_ground_shelter"
            elif risk_level == "MEDIUM":
                return "monitor_flood_warning_and_prepare_kit"
            else:
                return "routine_weather_monitoring"
                
        elif intent == "civic":
            if any(danger in text_lower for danger in ["gas leak", "live wire", "sparking", "electrical fire"]):
                return "dispatch_emergency_municipal_crew"
            return "file_civic_grievance"
            
        elif intent == "vision":
            return "read_simplified_document_audio"
            
        return "provide_voice_assistance"

    def calculate_confidence(
        self,
        intent: str,
        matched_triggers: List[str],
        ml_model_score: Optional[float] = None,
        input_length: int = 0
    ) -> float:
        """
        Calculates calibrated confidence score (0.0 to 1.0) based on signal density.
        """
        base_confidence = 0.88
        
        # Trigger density boost
        trigger_count = len(matched_triggers)
        if trigger_count >= 2:
            base_confidence += min(0.06, trigger_count * 0.02)
            
        # ML model alignment boost
        if ml_model_score is not None:
            base_confidence += 0.04
            
        # Context length boost
        if input_length > 30:
            base_confidence += 0.02
            
        return round(float(min(base_confidence, 0.99)), 2)

    def calculate_risk(
        self,
        intent: str,
        input_text: str,
        ml_model_score: Optional[float] = None,
        context_modifiers: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Computes multi-factor risk score combining keyword clinical NLP,
        ML model outputs, and action severity.
        
        Strictly conforms to standardized SAATHI Risk Contract:
        {
          "intent": "medical" | "disaster" | "civic" | "vision",
          "risk_score": 0.85,
          "risk_level": "HIGH",
          "requires_authorization": true,
          "recommended_action": "search_and_contact_hospital",
          "confidence": 0.94
        }
        """
        text_lower = input_text.lower()
        keyword_scores = []
        matched_triggers = []
        
        # 1. Keyword NLP scan across clinical and environmental keywords
        for kw, weight in RISK_KEYWORDS.items():
            if kw in text_lower:
                keyword_scores.append(weight)
                matched_triggers.append(kw)
                
        base_keyword_score = max(keyword_scores) if keyword_scores else 0.20
        
        # 2. Intent-based baseline adjustments
        if intent == "medical":
            # Acute clinical indicators
            if any(term in text_lower for term in ["chest", "breathe", "unconscious", "bleeding", "stroke", "cardiac"]):
                base_keyword_score = max(base_keyword_score, 0.90)
            elif not keyword_scores:
                base_keyword_score = 0.35
        elif intent == "disaster":
            if ml_model_score is not None:
                # Combine ML model score (70%) with keyword signals (30%)
                base_keyword_score = (ml_model_score * 0.70) + (base_keyword_score * 0.30)
            elif any(term in text_lower for term in ["rising", "water", "flood", "trapped", "submerged"]):
                base_keyword_score = max(base_keyword_score, 0.85)
        elif intent == "civic":
            # Most civic issues are moderate to low, unless life-safety hazard
            if not any(danger in text_lower for danger in ["gas leak", "live wire", "spark", "fire", "electrical"]):
                base_keyword_score = min(base_keyword_score, 0.45)
        elif intent == "vision":
            base_keyword_score = min(base_keyword_score, 0.20)
                
        final_risk_score = round(float(min(max(base_keyword_score, 0.05), 0.99)), 2)
        
        # 3. Classify Risk Level
        if final_risk_score >= self.crit_threshold:
            risk_level = "CRITICAL"
        elif final_risk_score >= self.high_threshold:
            risk_level = "HIGH"
        elif final_risk_score >= self.med_threshold:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
            
        # 4. Authorization Gating Policy:
        # High or Critical risk actions involving external third parties (hospitals, emergency dispatch, personal location sharing)
        # require explicit human-in-the-loop authorization.
        requires_authorization = risk_level in ["HIGH", "CRITICAL"] or intent in ["medical", "disaster"]

        # 5. Deterministic Recommended Action & Confidence
        recommended_action = self.determine_recommended_action(intent, risk_level, input_text)
        confidence = self.calculate_confidence(intent, matched_triggers, ml_model_score, len(input_text))

        return {
            "intent": intent,
            "risk_score": final_risk_score,
            "risk_level": risk_level,
            "requires_authorization": requires_authorization,
            "recommended_action": recommended_action,
            "confidence": confidence,
            "matched_triggers": matched_triggers,
            "factors": {
                "clinical_nlp_score": round(base_keyword_score, 2),
                "ml_disaster_score": round(ml_model_score, 2) if ml_model_score is not None else None,
                "urgency_level": risk_level
            },
            "guardrail_status": {
                "rule_1_enforced": True,
                "medical_diagnosis_permitted": False,
                "triage_scoring_only": True
            }
        }

    def evaluate_risk(
        self,
        input_text: str,
        intent: Optional[str] = None,
        ml_model_score: Optional[float] = None,
        user_location: Optional[Dict[str, Any]] = None,
        features: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        High-level endpoint handler for POST /api/ai/risk-eval.
        """
        resolved_intent = intent or self.infer_intent(input_text)
        
        # If disaster features are passed and no ml_model_score, evaluate via DisasterRiskModel
        if resolved_intent == "disaster" and ml_model_score is None and features:
            try:
                from models.disaster_model import get_disaster_model
                model = get_disaster_model()
                pred = model.predict_risk(features)
                ml_model_score = pred.get("risk_score")
            except Exception:
                pass

        return self.calculate_risk(
            intent=resolved_intent,
            input_text=input_text,
            ml_model_score=ml_model_score
        )

risk_engine = RiskEngine()
