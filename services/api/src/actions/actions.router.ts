import { Router, Request, Response } from 'express';
import { prisma, formatActionFromDb, formatAuditLogFromDb, formatCaseFromDb } from '../db';
import { eventBus } from '../events/eventBus';
import { transitionCaseStatus } from '../cases/stateMachine';
import type { ApproveActionDto, RejectActionDto, CaseStatus } from '@saathi/shared-types';

export const actionsRouter = Router();

// GET /api/actions/:id
actionsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const action = await prisma.action.findUnique({
      where: { id },
      include: { approvals: true, case: true },
    });

    if (!action) {
      return res.status(404).json({ success: false, error: `Action ${id} not found` });
    }

    res.json({ success: true, data: formatActionFromDb(action) });
  } catch (error: any) {
    console.error('Error fetching action:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/actions/:id/approve - Handles explicit user authorization
actionsRouter.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body: ApproveActionDto = req.body;
    const actor = body.actor || 'USER';

    const existingAction = await prisma.action.findUnique({
      where: { id },
      include: { case: true, approvals: true },
    });

    if (!existingAction) {
      return res.status(404).json({ success: false, error: `Action ${id} not found` });
    }

    // 1. Create Action Approval record
    await prisma.actionApproval.create({
      data: {
        actionId: id,
        userId: body.userId || existingAction.case.userId || null,
        status: 'APPROVED',
        reason: body.reason || 'Authorized by user',
      },
    });

    // 2. Update Action status to EXECUTING or APPROVED
    const updatedAction = await prisma.action.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: { approvals: true },
    });

    // 3. Create Case Event
    await prisma.caseEvent.create({
      data: {
        caseId: existingAction.caseId,
        eventType: 'ACTION_APPROVED',
        payload: JSON.stringify({
          actionId: id,
          actionType: existingAction.actionType,
          actor,
          reason: body.reason,
        }),
      },
    });

    // 4. Log to Audit Table
    const audit = await prisma.auditLog.create({
      data: {
        caseId: existingAction.caseId,
        actionId: id,
        actor,
        action: 'ACTION_AUTHORIZATION_APPROVED',
        details: JSON.stringify({
          actionType: existingAction.actionType,
          reason: body.reason,
          metadata: body.metadata || {},
          timestamp: new Date().toISOString(),
        }),
      },
    });

    const formattedAction = formatActionFromDb(updatedAction);
    const formattedAudit = formatAuditLogFromDb(audit);

    // 5. Broadcast WebSocket Events
    eventBus.broadcastActionApproved(id, existingAction.caseId, formattedAction, actor);
    eventBus.broadcastAuditLogged(formattedAudit);

    // 6. Transition Case State to AUTHORIZED or ACTION_EXECUTING if in AWAITING_USER
    let transitionedCase = null;
    const currentCaseStatus = existingAction.case.status as CaseStatus;
    if (currentCaseStatus === 'AWAITING_USER' || currentCaseStatus === 'CREATED') {
      try {
        transitionedCase = await transitionCaseStatus({
          caseId: existingAction.caseId,
          nextStatus: 'AUTHORIZED',
          actor,
          reason: `Action ${existingAction.actionType} was authorized.`,
        });
      } catch (e) {
        console.warn('Auto case transition warning:', e);
      }
    }

    res.json({
      success: true,
      message: 'Action successfully approved and authorized.',
      data: {
        action: formattedAction,
        case: transitionedCase,
      },
    });
  } catch (error: any) {
    console.error('Error approving action:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/actions/:id/reject - Handles explicit user rejection
actionsRouter.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body: RejectActionDto = req.body;
    const actor = body.actor || 'USER';

    const existingAction = await prisma.action.findUnique({
      where: { id },
      include: { case: true, approvals: true },
    });

    if (!existingAction) {
      return res.status(404).json({ success: false, error: `Action ${id} not found` });
    }

    // 1. Create Action Approval record with REJECTED
    await prisma.actionApproval.create({
      data: {
        actionId: id,
        userId: body.userId || existingAction.case.userId || null,
        status: 'REJECTED',
        reason: body.reason || 'User declined authorization',
      },
    });

    // 2. Update Action status to REJECTED
    const updatedAction = await prisma.action.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: { approvals: true },
    });

    // 3. Create Case Event
    await prisma.caseEvent.create({
      data: {
        caseId: existingAction.caseId,
        eventType: 'ACTION_REJECTED',
        payload: JSON.stringify({
          actionId: id,
          actionType: existingAction.actionType,
          actor,
          reason: body.reason,
        }),
      },
    });

    // 4. Log to Audit Table
    const audit = await prisma.auditLog.create({
      data: {
        caseId: existingAction.caseId,
        actionId: id,
        actor,
        action: 'ACTION_AUTHORIZATION_REJECTED',
        details: JSON.stringify({
          actionType: existingAction.actionType,
          reason: body.reason,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    const formattedAction = formatActionFromDb(updatedAction);
    const formattedAudit = formatAuditLogFromDb(audit);

    // 5. Broadcast WebSocket Events
    eventBus.broadcastActionRejected(id, existingAction.caseId, formattedAction, actor, body.reason);
    eventBus.broadcastAuditLogged(formattedAudit);

    res.json({
      success: true,
      message: 'Action was rejected.',
      data: { action: formattedAction },
    });
  } catch (error: any) {
    console.error('Error rejecting action:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
