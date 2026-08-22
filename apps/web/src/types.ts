export type InputType = 'voice' | 'text' | 'vision';
export type IntentType = 'medical' | 'disaster' | 'civic' | 'vision' | 'general';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface UserLocation {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
}

export interface ActionPayload {
  action_type: 'contact_hospital' | 'evacuation_alert' | 'file_civic_complaint' | 'document_summary' | 'none';
  target: string;
  data_shared: string[];
  metadata?: Record<string, any>;
}

export interface AITraceStep {
  step_number: number;
  stage: 'INTENT_CLASSIFICATION' | 'GUARDRAIL_CHECK' | 'RISK_ASSESSMENT' | 'SPECIALIST_ROUTING' | 'ACTION_SYNTHESIS';
  agent_name: string;
  thought: string;
  action_taken: string;
  result: string;
  latency_ms: number;
  timestamp: string;
}

export interface SafeShelter {
  id: string;
  name: string;
  lat: number;
  lng: number;
  elevation_meters: number;
  distance_km: number;
  capacity_available: number;
  amenities?: string[];
}

export interface EvacuationStep {
  step: number;
  lat: number;
  lng: number;
  step_instruction: string;
}

export interface DisasterAssessment {
  flood_risk_score: number;
  risk_level: RiskLevel;
  water_depth_cm: number;
  rainfall_intensity_mm_hr: number;
  key_hazard_drivers?: string[];
  safe_shelters: SafeShelter[];
  evacuation_corridor: EvacuationStep[];
  hazard_zones: Array<{
    zone_id: string;
    severity: 'MODERATE' | 'HIGH' | 'CRITICAL';
    center: { lat: number; lng: number };
    radius_meters: number;
    water_depth_cm?: number;
    status?: string;
  }>;
  requires_immediate_evacuation?: boolean;
}

export interface NearbyHospital {
  id: string;
  name: string;
  type: string;
  distance_km: number;
  eta_minutes: number;
  icu_available: boolean;
  trauma_level: number;
  contact_phone: string;
  triage_dept?: string;
}

export interface MedicalAssessment {
  triage_category: 'IMMEDIATE' | 'URGENT' | 'STANDARD' | 'NON_URGENT';
  suspected_condition: string;
  recommended_first_aid: string[];
  nearest_facilities: NearbyHospital[];
  pre_arrival_handover: {
    chief_complaint: string;
    symptoms: string[];
    risk_level: RiskLevel;
    urgency_code: string;
  };
}

export interface CivicAssessment {
  category: 'SANITATION' | 'ROADS_INFRASTRUCTURE' | 'WATER_SUPPLY' | 'ELECTRICITY' | 'PUBLIC_HEALTH' | 'OTHER';
  department: string;
  urgency_sla_hours: number;
  case_reference_id: string;
  structured_summary: string;
  recommended_actions: string[];
}

export interface VisionAssessment {
  document_type: 'PRESCRIPTION' | 'GOVERNMENT_NOTICE' | 'BILL_RECEIPT' | 'LEGAL_FORM' | 'OFFICIAL_DOCUMENT' | 'OTHER';
  extracted_key_info: Record<string, string>;
  simplified_explanation: string;
  action_items_for_user: string[];
  spoken_script: string;
}

export interface OrchestratorResponse {
  intent: IntentType;
  risk_score: number;
  risk_level: RiskLevel;
  requires_authorization: boolean;
  action_payload: ActionPayload;
  response_voice_text: string;
  ai_trace: AITraceStep[];
  disaster_assessment?: DisasterAssessment;
  medical_assessment?: MedicalAssessment;
  civic_assessment?: CivicAssessment;
  vision_assessment?: VisionAssessment;
  guardrail_verdict: {
    passed: boolean;
    safe_for_voice: boolean;
    disclaimers: string[];
  };
  latency_total_ms: number;
}
