import { PrismaClient } from '@prisma/client';
import type { Case, User, Hospital, CaseAction, CaseEvent, CivicComplaint, AuditLog } from '@saathi/shared-types';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Helper functions to safely parse and serialize JSON fields
export function safeJsonParse<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch (err) {
    return fallback;
  }
}

export function formatCaseFromDb(dbCase: any): Case {
  return {
    id: dbCase.id,
    caseType: dbCase.caseType as any,
    status: dbCase.status as any,
    riskLevel: dbCase.riskLevel as any,
    userId: dbCase.userId,
    user: dbCase.user ? formatUserFromDb(dbCase.user) : undefined,
    location: safeJsonParse(dbCase.location, { lat: 0, lng: 0 }),
    title: dbCase.title || undefined,
    description: dbCase.description || undefined,
    metadata: safeJsonParse(dbCase.metadata, {}),
    events: dbCase.events?.map(formatEventFromDb) || [],
    actions: dbCase.actions?.map(formatActionFromDb) || [],
    complaints: dbCase.complaints?.map(formatComplaintFromDb) || [],
    createdAt: dbCase.createdAt,
    updatedAt: dbCase.updatedAt,
  };
}

export function formatUserFromDb(dbUser: any): User {
  return {
    id: dbUser.id,
    phone: dbUser.phone,
    name: dbUser.name,
    trustedContacts: safeJsonParse(dbUser.trustedContacts, []),
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
  };
}

export function formatHospitalFromDb(dbHosp: any): Hospital {
  return {
    id: dbHosp.id,
    name: dbHosp.name,
    lat: dbHosp.lat,
    lng: dbHosp.lng,
    capacity: dbHosp.capacity,
    availableBeds: dbHosp.availableBeds,
    contactPhone: dbHosp.contactPhone,
    status: dbHosp.status as any,
    specialties: safeJsonParse(dbHosp.specialties, []),
    createdAt: dbHosp.createdAt,
  };
}

export function formatActionFromDb(dbAction: any): CaseAction {
  return {
    id: dbAction.id,
    caseId: dbAction.caseId,
    actionType: dbAction.actionType as any,
    riskLevel: dbAction.riskLevel as any,
    payload: safeJsonParse(dbAction.payload, {}),
    requiresApproval: dbAction.requiresApproval,
    status: dbAction.status as any,
    approvals: dbAction.approvals?.map((a: any) => ({
      id: a.id,
      actionId: a.actionId,
      userId: a.userId,
      status: a.status,
      reason: a.reason || undefined,
      timestamp: a.timestamp,
    })) || [],
    createdAt: dbAction.createdAt,
    updatedAt: dbAction.updatedAt,
  };
}

export function formatEventFromDb(dbEvent: any): CaseEvent {
  return {
    id: dbEvent.id,
    caseId: dbEvent.caseId,
    eventType: dbEvent.eventType,
    payload: safeJsonParse(dbEvent.payload, {}),
    timestamp: dbEvent.timestamp,
  };
}

export function formatComplaintFromDb(dbComp: any): CivicComplaint {
  return {
    id: dbComp.id,
    caseId: dbComp.caseId,
    department: dbComp.department,
    description: dbComp.description,
    status: dbComp.status as any,
    referenceId: dbComp.referenceId,
    location: safeJsonParse(dbComp.location, undefined),
    createdAt: dbComp.createdAt,
  };
}

export function formatAuditLogFromDb(dbLog: any): AuditLog {
  return {
    id: dbLog.id,
    actionId: dbLog.actionId,
    caseId: dbLog.caseId,
    actor: dbLog.actor,
    action: dbLog.action,
    details: safeJsonParse(dbLog.details, {}),
    timestamp: dbLog.timestamp,
  };
}
