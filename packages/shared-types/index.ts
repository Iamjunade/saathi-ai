/**
 * SAATHI Shared Types and Data Contracts
 * Single source of truth for Web App, AI Engine, API, Hospital Portal, and Ops Dashboard.
 */

export type InputType = 'voice' | 'text' | 'vision';

export type IntentType = 'medical' | 'disaster' | 'civic' | 'vision' | 'general';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface UserLocation {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
}

export interface OrchestratorRequest {
  user_id: string;
  input_type: InputType;
  input_content: string;
  user_location?: UserLocation;
  audio_base64?: string;
  image_base64?: string;
  context_history?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}

export interface RiskEvalRequest {
  intent?: IntentType;
  input_text: string;
  ml_model_score?: number;
  user_location?: UserLocation;
  features?: Record<string, number>;
}

export interface RiskEvalResponse {
  intent: IntentType;
  risk_score: number;
  risk_level: RiskLevel;
  requires_authorization: boolean;
  recommended_action: string;
  confidence: number;
  matched_triggers?: string[];
  factors?: {
    clinical_nlp_score: number;
    ml_disaster_score?: number | null;
    urgency_level: RiskLevel;
  };
  guardrail_status?: {
    rule_1_enforced: boolean;
    medical_diagnosis_permitted: boolean;
    triage_scoring_only: boolean;
  };
}

export interface VisionExplainRequest {
  user_id?: string;
  input_content?: string;
  document_description_or_ocr?: string;
  image_base64?: string;
  language?: string;
}

export interface VisionExplainResponse {
  intent: 'vision';
  vision_assessment: VisionAssessment;
  action_payload: ActionPayload;
  response_voice_text: string;
  risk_score: number;
  risk_level: RiskLevel;
  requires_authorization: boolean;
  recommended_action: string;
  confidence: number;
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

export interface DisasterAssessment {
  flood_risk_score: number;
  risk_level: RiskLevel;
  water_depth_cm: number;
  rainfall_intensity_mm_hr: number;
  safe_shelters: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    elevation_meters: number;
    distance_km: number;
    capacity_available: number;
  }>;
  evacuation_corridor: Array<{
    lat: number;
    lng: number;
    step_instruction: string;
  }>;
  hazard_zones: Array<{
    zone_id: string;
    severity: 'MODERATE' | 'HIGH' | 'CRITICAL';
    center: { lat: number; lng: number };
    radius_meters: number;
  }>;
}

export interface MedicalAssessment {
  triage_category: 'IMMEDIATE' | 'URGENT' | 'STANDARD' | 'NON_URGENT';
  suspected_condition: string;
  recommended_first_aid: string[];
  nearest_facilities: Array<{
    id: string;
    name: string;
    type: string;
    distance_km: number;
    eta_minutes: number;
    icu_available: boolean;
    trauma_level: number;
    contact_phone: string;
  }>;
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
  document_type: 'PRESCRIPTION' | 'GOVERNMENT_NOTICE' | 'BILL_RECEIPT' | 'LEGAL_FORM' | 'OTHER';
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

// Case State Machine
export type CaseState =
  | 'CREATED'
  | 'ASSESSING'
  | 'AWAITING_USER'
  | 'AUTHORIZED'
  | 'ACTION_EXECUTING'
  | 'ACTION_COMPLETED'
  | 'FOLLOW_UP'
  | 'RESOLVED'
  | 'REJECTED';

export interface CaseRecord {
  id: string;
  user_id: string;
  intent: IntentType;
  state: CaseState;
  risk_level: RiskLevel;
  risk_score: number;
  user_location?: UserLocation;
  input_summary: string;
  action_details?: ActionPayload;
  created_at: string;
  updated_at: string;
  trace_log: AITraceStep[];
}
