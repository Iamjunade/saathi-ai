import { Router, Request, Response } from 'express';
import { prisma, formatAuditLogFromDb } from '../db';
import { eventBus } from '../events/eventBus';

export const auditRouter = Router();

// GET /api/audit-logs - List audit trail logs
auditRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { caseId, actionId, actor, limit = '50' } = req.query;

    const where: any = {};
    if (caseId) where.caseId = String(caseId);
    if (actionId) where.actionId = String(actionId);
    if (actor) where.actor = String(actor);

    const logs = await prisma.auditLog.findMany({
      where,
      take: Math.min(100, parseInt(limit as string, 10) || 50),
      orderBy: { timestamp: 'desc' },
    });

    res.json({
      success: true,
      count: logs.length,
      data: logs.map(formatAuditLogFromDb),
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/audit-logs - Record custom audit log
auditRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { actor = 'SYSTEM', action, caseId, actionId, details = {} } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, error: 'action name is required' });
    }

    const log = await prisma.auditLog.create({
      data: {
        actor,
        action,
        caseId: caseId || null,
        actionId: actionId || null,
        details: JSON.stringify(details),
      },
    });

    const formatted = formatAuditLogFromDb(log);
    eventBus.broadcastAuditLogged(formatted);

    res.status(201).json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
