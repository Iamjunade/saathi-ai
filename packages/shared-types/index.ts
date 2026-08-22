export type WorkflowDomain = 'medical' | 'disaster' | 'civic' | 'vision';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type CaseStatus =
  | 'CREATED'
  | 'ASSESSING'
  | 'AWAITING_USER'
  | 'AUTHORIZED'
  | 'ACTION_PENDING'
  | 'ACTION_EXECUTING'
  | 'ACTION_COMPLETED'
  | 'FOLLOW_UP'
  | 'RESOLVED'
  | 'ACTION_FAILED';

export interface UserLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface ActionPayload {
  actionId: string;
  actionType: string;
  targetProvider: string;
  riskLevel: RiskLevel;
  requiresConfirmation: boolean;
  dataShared: string[];
  description: string;
  details?: Record<string, any>;
}

export interface IntentAssessment {
  intent: WorkflowDomain;
  confidence: number;
  riskScore: number; // 0.0 to 1.0
  riskLevel: RiskLevel;
  requiresAuthorization: boolean;
  recommendedAction?: ActionPayload;
  summary: string;
}

export interface TraceStep {
  id: string;
  timestamp: string;
  stage: 'INPUT' | 'INTENT_RISK' | 'AGENT_ROUTING' | 'TOOL_EXECUTION' | 'APPROVAL' | 'OUTCOME';
  label: string;
  details: string;
  status: 'pending' | 'success' | 'warning' | 'error';
}

export interface CaseRecord {
  id: string;
  domain: WorkflowDomain;
  status: CaseStatus;
  riskLevel: RiskLevel;
  summary: string;
  createdAt: string;
  updatedAt: string;
  location?: UserLocation;
  referenceId?: string;
  actions: ActionPayload[];
  trace: TraceStep[];
  followUpMessage?: string;
}
