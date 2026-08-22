import { CaseStatus } from '@saathi/shared-types';
import { prisma, formatCaseFromDb, formatAuditLogFromDb } from '../db';
import { eventBus } from '../events/eventBus';

export const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  CREATED: ['ASSESSING', 'AWAITING_USER', 'AUTHORIZED', 'RESOLVED'],
  ASSESSING: ['AWAITING_USER', 'AUTHORIZED', 'ACTION_EXECUTING', 'RESOLVED'],
  AWAITING_USER: ['AUTHORIZED', 'ACTION_EXECUTING', 'RESOLVED', 'ASSESSING'],
  AUTHORIZED: ['ACTION_EXECUTING', 'ACTION_COMPLETED', 'RESOLVED', 'FOLLOW_UP'],
  ACTION_EXECUTING: ['ACTION_COMPLETED', 'FOLLOW_UP', 'RESOLVED'],
  ACTION_COMPLETED: ['FOLLOW_UP', 'RESOLVED', 'ACTION_EXECUTING'],
  FOLLOW_UP: ['RESOLVED', 'ACTION_EXECUTING', 'ASSESSING'],
  RESOLVED: ['CREATED', 'ASSESSING', 'FOLLOW_UP'], // Allow administrative reopen if required
};

export class StateMachineError extends Error {
  constructor(message: string, public from: CaseStatus, public to: CaseStatus) {
    super(message);
    this.name = 'StateMachineError';
  }
}

export function isValidTransition(from: CaseStatus, to: CaseStatus): boolean {
  if (from === to) return true;
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export interface TransitionOptions {
  caseId: string;
  nextStatus: CaseStatus;
  actor?: string;
  reason?: string;
  payload?: Record<string, any>;
}

export async function transitionCaseStatus(options: TransitionOptions) {
  const { caseId, nextStatus, actor = 'SYSTEM', reason, payload = {} } = options;

  const currentCase = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      user: true,
      actions: { include: { approvals: true } },
      events: true,
      complaints: true,
    },
  });

  if (!currentCase) {
    throw new Error(`Case with ID ${caseId} not found.`);
  }

  const prevStatus = currentCase.status as CaseStatus;

  if (!isValidTransition(prevStatus, nextStatus)) {
    throw new StateMachineError(
      `Invalid state transition from ${prevStatus} to ${nextStatus}. Allowed transitions from ${prevStatus} are: ${ALLOWED_TRANSITIONS[prevStatus].join(', ')}`,
      prevStatus,
      nextStatus
    );
  }

  // Update Case in Database
  const updatedCase = await prisma.case.update({
    where: { id: caseId },
    data: {
      status: nextStatus,
    },
    include: {
      user: true,
      actions: { include: { approvals: true } },
      events: true,
      complaints: true,
    },
  });

  // Create Case Event
  await prisma.caseEvent.create({
    data: {
      caseId,
      eventType: 'STATUS_CHANGED',
      payload: JSON.stringify({
        from: prevStatus,
        to: nextStatus,
        actor,
        reason: reason || `Status changed from ${prevStatus} to ${nextStatus}`,
        extra: payload,
      }),
    },
  });

  // Create Audit Log
  const audit = await prisma.auditLog.create({
    data: {
      caseId,
      actor,
      action: 'CASE_STATUS_TRANSITION',
      details: JSON.stringify({
        previousStatus: prevStatus,
        newStatus: nextStatus,
        reason,
        timestamp: new Date().toISOString(),
      }),
    },
  });

  // Format objects
  const formattedCase = formatCaseFromDb(updatedCase);
  const formattedAudit = formatAuditLogFromDb(audit);

  // Broadcast WebSocket Events
  eventBus.broadcastCaseStatusChanged(caseId, prevStatus, nextStatus, formattedCase, actor);
  eventBus.broadcastAuditLogged(formattedAudit);

  return formattedCase;
}
