import { Router, Request, Response } from 'express';
import { prisma, formatCaseFromDb, formatAuditLogFromDb, safeJsonParse } from '../db';
import { transitionCaseStatus } from './stateMachine';
import { eventBus } from '../events/eventBus';
import type { CreateCaseDto, UpdateCaseStatusDto } from '@saathi/shared-types';

export const casesRouter = Router();

// GET /api/cases - List all cases with optional filters
casesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, caseType, riskLevel } = req.query;

    const where: any = {};
    if (status) where.status = String(status);
    if (caseType) where.caseType = String(caseType);
    if (riskLevel) where.riskLevel = String(riskLevel);

    const cases = await prisma.case.findMany({
      where,
      include: {
        user: true,
        actions: { include: { approvals: true } },
        events: { orderBy: { timestamp: 'desc' } },
        complaints: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = cases.map(formatCaseFromDb);
    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error: any) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/cases/:id - Get case by ID
casesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const singleCase = await prisma.case.findUnique({
      where: { id },
      include: {
        user: true,
        actions: { include: { approvals: true } },
        events: { orderBy: { timestamp: 'asc' } },
        complaints: true,
      },
    });

    if (!singleCase) {
      return res.status(404).json({ success: false, error: `Case ${id} not found` });
    }

    res.json({ success: true, data: formatCaseFromDb(singleCase) });
  } catch (error: any) {
    console.error('Error fetching case by ID:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cases - Create a new case in state CREATED
casesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body: CreateCaseDto = req.body;

    if (!body.caseType || !body.location) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: caseType and location are required.',
      });
    }

    let userId = body.userId;

    // Auto-create or find user if userPhone provided
    if (!userId && body.userPhone) {
      const user = await prisma.user.upsert({
        where: { phone: body.userPhone },
        update: { name: body.userName || 'Emergency Caller' },
        create: {
          phone: body.userPhone,
          name: body.userName || 'Emergency Caller',
        },
      });
      userId = user.id;
    }

    const created = await prisma.case.create({
      data: {
        caseType: body.caseType,
        status: 'CREATED',
        riskLevel: body.riskLevel || 'MEDIUM',
        userId: userId || null,
        location: JSON.stringify(body.location),
        title: body.title || `${body.caseType} Incident Report`,
        description: body.description || '',
        metadata: JSON.stringify(body.metadata || {}),
        events: {
          create: [
            {
              eventType: 'CASE_CREATED',
              payload: JSON.stringify({
                source: 'API_DISPATCH',
                initialRisk: body.riskLevel || 'MEDIUM',
                timestamp: new Date().toISOString(),
              }),
            },
          ],
        },
        actions: body.initialAction
          ? {
              create: [
                {
                  actionType: body.initialAction.actionType,
                  riskLevel: body.initialAction.riskLevel || body.riskLevel || 'MEDIUM',
                  payload: JSON.stringify(body.initialAction.payload || {}),
                  requiresApproval: body.initialAction.requiresApproval ?? true,
                  status: 'PENDING',
                },
              ],
            }
          : undefined,
      },
      include: {
        user: true,
        actions: { include: { approvals: true } },
        events: true,
        complaints: true,
      },
    });

    // Create Audit Log
    const audit = await prisma.auditLog.create({
      data: {
        caseId: created.id,
        actor: userId ? 'USER' : 'AI_AGENT',
        action: 'CASE_CREATED',
        details: JSON.stringify({
          caseType: body.caseType,
          riskLevel: body.riskLevel,
          location: body.location,
        }),
      },
    });

    const formattedCase = formatCaseFromDb(created);
    const formattedAudit = formatAuditLogFromDb(audit);

    // Broadcast Real-Time Events
    eventBus.broadcastCaseCreated(formattedCase);
    eventBus.broadcastAuditLogged(formattedAudit);

    res.status(201).json({
      success: true,
      message: 'Case successfully created',
      data: formattedCase,
    });
  } catch (error: any) {
    console.error('Error creating case:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/cases/:id/status - Transition state of a case
casesRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body: UpdateCaseStatusDto = req.body;

    if (!body.status) {
      return res.status(400).json({ success: false, error: 'Status field is required.' });
    }

    const updatedCase = await transitionCaseStatus({
      caseId: id,
      nextStatus: body.status,
      actor: body.actor || 'SYSTEM',
      reason: body.reason,
      payload: body.payload,
    });

    res.json({
      success: true,
      message: `Case status transitioned to ${body.status}`,
      data: updatedCase,
    });
  } catch (error: any) {
    console.error(`Error transitioning case ${req.params.id}:`, error);
    const statusCode = error.name === 'StateMachineError' ? 400 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
});

// POST /api/cases/:id/actions - Attach action to case
casesRouter.post('/:id/actions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { actionType, riskLevel = 'MEDIUM', payload = {}, requiresApproval = true } = req.body;

    if (!actionType) {
      return res.status(400).json({ success: false, error: 'actionType is required' });
    }

    const newAction = await prisma.action.create({
      data: {
        caseId: id,
        actionType,
        riskLevel,
        payload: JSON.stringify(payload),
        requiresApproval,
        status: requiresApproval ? 'PENDING' : 'EXECUTING',
      },
      include: { approvals: true },
    });

    // Create Audit Log
    const audit = await prisma.auditLog.create({
      data: {
        caseId: id,
        actionId: newAction.id,
        actor: 'AI_AGENT',
        action: 'ACTION_RECOMMENDED',
        details: JSON.stringify({ actionType, riskLevel, requiresApproval }),
      },
    });

    const formattedAction = {
      id: newAction.id,
      caseId: newAction.caseId,
      actionType: newAction.actionType as any,
      riskLevel: newAction.riskLevel as any,
      payload: safeJsonParse(newAction.payload, {}),
      requiresApproval: newAction.requiresApproval,
      status: newAction.status as any,
      approvals: [],
      createdAt: newAction.createdAt,
      updatedAt: newAction.updatedAt,
    };

    eventBus.broadcastActionCreated(formattedAction, id);
    eventBus.broadcastAuditLogged(formatAuditLogFromDb(audit));

    res.status(201).json({ success: true, data: formattedAction });
  } catch (error: any) {
    console.error('Error attaching action:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
