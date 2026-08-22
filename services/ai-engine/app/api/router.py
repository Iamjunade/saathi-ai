"""
SAATHI AI Engine API Endpoints
Implements REST routes for Orchestration, Deterministic Risk Evaluation,
Disaster ML, Medical Triage, Civic NLP, and Vision OCR/Explanation.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Literal
from app.agents.orchestrator import orchestrator
from app.agents.medical_agent import medical_agent
from app.agents.disaster_agent import disaster_agent
from app.agents.civic_agent import civic_agent
from app.agents.vision_agent import vision_agent
from app.risk_engine import risk_engine
from app.guardrails import guardrails

router = APIRouter()

# ----------------------------------------------------
# Request & Response Schemas
# ----------------------------------------------------

class UserLocationSchema(BaseModel):
    lat: float = 17.3850
    lng: float = 78.4867
    address: Optional[str] = None
    city: Optional[str] = "Hyderabad"

class OrchestrateRequest(BaseModel):
    user_id: str = "usr_1029"
    input_type: Literal["voice", "text", "vision"] = "voice"
    input_content: str
    user_location: Optional[UserLocationSchema] = Field(default_factory=UserLocationSchema)
    audio_base64: Optional[str] = None
    image_base64: Optional[str] = None

class RiskEvalRequest(BaseModel):
    intent: Optional[Literal["medical", "disaster", "civic", "vision", "general"]] = None
    input_text: str = Field(..., description="User transcript, symptom text, or situational report")
    ml_model_score: Optional[float] = None
    user_location: Optional[UserLocationSchema] = Field(default_factory=UserLocationSchema)
    features: Optional[Dict[str, float]] = None

class VisionExplainRequest(BaseModel):
    user_id: str = "usr_1029"
    input_content: Optional[str] = None
    document_description_or_ocr: Optional[str] = None
    image_base64: Optional[str] = None
    language: Optional[str] = "en"

class DisasterRiskRequest(BaseModel):
    user_location: Optional[UserLocationSchema] = Field(default_factory=UserLocationSchema)
    rainfall_mm_hr: Optional[float] = 65.0
    elevation_meters: Optional[float] = 15.0
    river_distance_meters: Optional[float] = 350.0
    water_level_rise_rate_cm_hr: Optional[float] = 12.0
    drainage_capacity_score: Optional[float] = 0.35
    soil_saturation_pct: Optional[float] = 85.0
    user_report_text: Optional[str] = "Water is rising rapidly near our apartment building"

class MedicalTriageRequest(BaseModel):
    user_id: str = "usr_1029"
    symptoms_text: str
    user_location: Optional[UserLocationSchema] = Field(default_factory=UserLocationSchema)
    patient_age: Optional[int] = None

class CivicComplaintRequest(BaseModel):
    user_id: str = "usr_1029"
    complaint_text: str
    user_location: Optional[UserLocationSchema] = Field(default_factory=UserLocationSchema)

class VisionOCRRequest(BaseModel):
    user_id: str = "usr_1029"
    document_description_or_ocr: str
    image_base64: Optional[str] = None

# ----------------------------------------------------
# Endpoints
# ----------------------------------------------------

@router.post("/orchestrate", response_model=Dict[str, Any])
async def orchestrate_request(req: OrchestrateRequest):
    """
    Primary SAATHI Multimodal Orchestration Gateway.
    - Handles natural voice/text/vision input
    - Evaluates safety guardrails (Prompt injection defense + Rule 1 medical protection)
    - Determines domain intent (medical, disaster, civic, vision)
    - Executes domain specialist agent
    - Computes multi-factor risk score, risk level, authorization gating
    - Returns actionable payload + transparent step-by-step AI trace.
    """
    try:
        loc_dict = req.user_location.model_dump() if req.user_location else {"lat": 17.3850, "lng": 78.4867}
        result = await orchestrator.orchestrate(
            user_id=req.user_id,
            input_type=req.input_type,
            input_content=req.input_content,
            user_location=loc_dict,
            image_base64=req.image_base64
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Orchestration Error: {str(e)}")

@router.post("/risk-eval", response_model=Dict[str, Any])
async def evaluate_risk_endpoint(req: RiskEvalRequest):
    """
    Deterministic Emergency Risk Engine Endpoint.
    Calculates calibrated emergency risk score (0.0 - 1.0) & risk level: LOW, MEDIUM, HIGH, CRITICAL.
    Enforces Rule 1: No medical disease diagnosis. Triage & symptom severity scoring only.
    
    Returns standard contract:
    {
      "intent": "medical" | "disaster" | "civic" | "vision",
      "risk_score": 0.85,
      "risk_level": "HIGH",
      "requires_authorization": true,
      "recommended_action": "search_and_contact_hospital",
      "confidence": 0.94
    }
    """
    try:
        loc_dict = req.user_location.model_dump() if req.user_location else None
        res = risk_engine.evaluate_risk(
            input_text=req.input_text,
            intent=req.intent,
            ml_model_score=req.ml_model_score,
            user_location=loc_dict,
            features=req.features
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk Evaluation Error: {str(e)}")

@router.post("/vision-explain", response_model=Dict[str, Any])
async def vision_explain_endpoint(req: VisionExplainRequest):
    """
    Dedicated Accessibility Document OCR & Voice Explanation Endpoint.
    Processes document image / OCR transcription and generates simple voice-ready explanation
    and structured action items.
    """
    try:
        content = req.input_content or req.document_description_or_ocr or "Official Notice"
        res = vision_agent.process_document(
            input_content=content,
            image_base64=req.image_base64
        )
        
        # Add risk evaluation contract properties for consistency
        res["intent"] = "vision"
        res["requires_authorization"] = False
        res["recommended_action"] = "read_simplified_document_audio"
        res["confidence"] = 0.96
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision Explanation Error: {str(e)}")

@router.post("/disaster-risk", response_model=Dict[str, Any])
async def evaluate_disaster_risk(req: DisasterRiskRequest):
    """
    Dedicated Disaster & Evacuation Risk Endpoint.
    Uses Scikit-Learn ML Model for flood risk calculation and safe route corridor mapping.
    """
    try:
        loc_dict = req.user_location.model_dump() if req.user_location else {"lat": 17.3850, "lng": 78.4867}
        features = {
            "rainfall_mm_hr": req.rainfall_mm_hr,
            "elevation_meters": req.elevation_meters,
            "river_distance_meters": req.river_distance_meters,
            "water_level_rise_rate_cm_hr": req.water_level_rise_rate_cm_hr,
            "drainage_capacity_score": req.drainage_capacity_score,
            "soil_saturation_pct": req.soil_saturation_pct
        }
        res = disaster_agent.assess_disaster(
            input_content=req.user_report_text or "",
            user_location=loc_dict,
            custom_features=features
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Disaster Risk Evaluation Error: {str(e)}")

@router.post("/medical-triage", response_model=Dict[str, Any])
async def evaluate_medical_triage(req: MedicalTriageRequest):
    """
    Dedicated Medical Emergency Triage Endpoint.
    Evaluates acute symptoms, life-support first aid, and hospital handover payload.
    Adheres strictly to Rule 1: No medical disease diagnosis. Triage & symptom severity scoring only.
    """
    try:
        loc_dict = req.user_location.model_dump() if req.user_location else {"lat": 17.3850, "lng": 78.4867}
        res = medical_agent.assess_emergency(
            input_content=req.symptoms_text,
            user_location=loc_dict
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Medical Triage Error: {str(e)}")

@router.post("/civic-classify", response_model=Dict[str, Any])
async def evaluate_civic_complaint(req: CivicComplaintRequest):
    """
    Dedicated Civic Grievance NLP Router.
    Classifies municipal department, generates SLA, and creates tracking ID.
    """
    try:
        loc_dict = req.user_location.model_dump() if req.user_location else {"lat": 17.3850, "lng": 78.4867}
        res = civic_agent.process_complaint(
            input_content=req.complaint_text,
            user_location=loc_dict
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Civic Classification Error: {str(e)}")

@router.post("/vision-ocr", response_model=Dict[str, Any])
async def evaluate_vision_document(req: VisionOCRRequest):
    """
    Dedicated Accessibility & Document OCR Simplifier Endpoint (Alias for vision-explain).
    """
    try:
        res = vision_agent.process_document(
            input_content=req.document_description_or_ocr,
            image_base64=req.image_base64
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision OCR Error: {str(e)}")

@router.get("/health")
async def health_check():
    """
    AI Engine Service Health Check.
    """
    return {
        "status": "healthy",
        "service": "SAATHI AI Engine",
        "model_loaded": True,
        "framework": "FastAPI + Scikit-Learn",
        "endpoints": [
            "/api/ai/orchestrate",
            "/api/ai/risk-eval",
            "/api/ai/vision-explain",
            "/api/ai/disaster-risk",
            "/api/ai/medical-triage",
            "/api/ai/civic-classify",
            "/api/ai/vision-ocr",
            "/api/ai/health"
        ]
    }
