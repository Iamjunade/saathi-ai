export type CaseType = 'MEDICAL' | 'DISASTER' | 'CIVIC' | 'SECURITY';

export type CaseStatus =
  | 'CREATED'
  | 'ASSESSING'
  | 'AWAITING_USER'
  | 'AUTHORIZED'
  | 'ACTION_EXECUTING'
  | 'ACTION_COMPLETED'
  | 'FOLLOW_UP'
  | 'RESOLVED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ActionType =
  | 'AMBULANCE_DISPATCH'
  | 'HOSPITAL_ALERT'
  | 'DISASTER_EVACUATION'
  | 'CIVIC_TICKET_ESCALATION'
  | 'POLICE_ALERT'
  | 'TRUSTED_CONTACT_ALERT'
  | 'FIRST_RESPONDER_NOTIFY';

export type ActionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTING' | 'COMPLETED' | 'FAILED';

export type HospitalStatus = 'AVAILABLE' | 'BUSY' | 'FULL' | 'OFFLINE';

export type ComplaintStatus = 'SUBMITTED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'ESCALATED' | 'RESOLVED';

export interface TrustedContact {
  name: string;
  phone: string;
  relation: string;
}

export interface LocationInfo {
  lat: number;
  lng: number;
  address?: string;
  landmark?: string;
  city?: string;
  zone?: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  trustedContacts?: TrustedContact[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Case {
  id: string;
  caseType: CaseType;
  status: CaseStatus;
  riskLevel: RiskLevel;
  userId?: string | null;
  user?: User | null;
  location: LocationInfo;
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
  events?: CaseEvent[];
  actions?: CaseAction[];
  complaints?: CivicComplaint[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CaseEvent {
  id: string;
  caseId: string;
  eventType: string;
  payload: Record<string, any>;
  timestamp: string | Date;
}

export interface CaseAction {
  id: string;
  caseId: string;
  actionType: ActionType;
  riskLevel: RiskLevel;
  payload: Record<string, any>;
  requiresApproval: boolean;
  status: ActionStatus;
  approvals?: ActionApproval[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ActionApproval {
  id: string;
  actionId: string;
  userId?: string | null;
  status: 'APPROVED' | 'REJECTED';
  reason?: string;
  timestamp: string | Date;
}

export interface Hospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  availableBeds: number;
  contactPhone: string;
  status: HospitalStatus;
  specialties: string[];
  distanceKm?: number;
  estimatedArrivalMins?: number;
  createdAt: string | Date;
}

export interface CivicComplaint {
  id: string;
  caseId?: string | null;
  department: string;
  description: string;
  status: ComplaintStatus;
  referenceId: string;
  location?: LocationInfo;
  createdAt: string | Date;
}

export interface AuditLog {
  id: string;
  actionId?: string | null;
  caseId?: string | null;
  actor: string;
  action: string;
  details: Record<string, any>;
  timestamp: string | Date;
}

// Request / Response DTOs
export interface CreateCaseDto {
  caseType: CaseType;
  riskLevel: RiskLevel;
  userId?: string;
  userName?: string;
  userPhone?: string;
  location: LocationInfo;
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
  initialAction?: {
    actionType: ActionType;
    riskLevel?: RiskLevel;
    payload?: Record<string, any>;
    requiresApproval?: boolean;
  };
}

export interface UpdateCaseStatusDto {
  status: CaseStatus;
  reason?: string;
  actor?: string;
  payload?: Record<string, any>;
}

export interface ApproveActionDto {
  userId?: string;
  actor?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface RejectActionDto {
  userId?: string;
  actor?: string;
  reason: string;
  metadata?: Record<string, any>;
}

export interface CreateComplaintDto {
  caseId?: string;
  department: string;
  description: string;
  location?: LocationInfo;
}

export interface NearbyHospitalQuery {
  lat: number;
  lng: number;
  radiusKm?: number;
  specialty?: string;
}

// Real-Time Socket Events Map
export interface ServerToClientEvents {
  'case:created': (data: { case: Case }) => void;
  'case:updated': (data: { case: Case }) => void;
  'case:status_changed': (data: {
    caseId: string;
    previousStatus: CaseStatus;
    newStatus: CaseStatus;
    case: Case;
    actor: string;
  }) => void;
  'action:created': (data: { action: CaseAction; caseId: string }) => void;
  'action:approved': (data: { actionId: string; caseId: string; action: CaseAction; actor: string }) => void;
  'action:rejected': (data: { actionId: string; caseId: string; action: CaseAction; actor: string; reason: string }) => void;
  'hospital:incoming_case': (data: { case: Case; hospitalId?: string; etaMins?: number }) => void;
  'hospital:capacity_updated': (data: { hospital: Hospital }) => void;
  'audit:logged': (data: { log: AuditLog }) => void;
  'civic:complaint_created': (data: { complaint: CivicComplaint }) => void;
}

export interface ClientToServerEvents {
  'join:room': (room: 'hospital-intake' | 'ops-dashboard' | string) => void;
  'leave:room': (room: string) => void;
  'hospital:accept_case': (data: { hospitalId: string; caseId: string; notes?: string }) => void;
  'hospital:decline_case': (data: { hospitalId: string; caseId: string; reason: string }) => void;
}
