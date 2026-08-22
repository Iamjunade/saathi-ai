import { Router, Request, Response } from 'express';
import { prisma, formatComplaintFromDb, formatAuditLogFromDb } from '../db';
import { eventBus } from '../events/eventBus';
import type { CreateComplaintDto } from '@saathi/shared-types';

export const civicRouter = Router();

function generateCivicReferenceId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `CIVIC-${year}-${randomNum}`;
}

// POST /api/civic/complaints - Generates reference ID e.g. CIVIC-2026-9042
civicRouter.post('/complaints', async (req: Request, res: Response) => {
  try {
    const body: CreateComplaintDto = req.body;

    if (!body.department || !body.description) {
      return res.status(400).json({
        success: false,
        error: 'Department and description are required fields.',
      });
    }

    const referenceId = generateCivicReferenceId();

    const createdComplaint = await prisma.complaint.create({
      data: {
        caseId: body.caseId || null,
        department: body.department,
        description: body.description,
        status: 'SUBMITTED',
        referenceId,
        location: body.location ? JSON.stringify(body.location) : undefined,
      },
    });

    // If attached to a case, log a case event
    if (body.caseId) {
      await prisma.caseEvent.create({
        data: {
          caseId: body.caseId,
          eventType: 'CIVIC_COMPLAINT_FILED',
          payload: JSON.stringify({
            referenceId,
            department: body.department,
            status: 'SUBMITTED',
          }),
        },
      });
    }

    // Log to audit table
    const audit = await prisma.auditLog.create({
      data: {
        caseId: body.caseId || null,
        actor: 'CIVIC_AI_AGENT',
        action: 'CIVIC_COMPLAINT_FILED',
        details: JSON.stringify({
          referenceId,
          department: body.department,
          description: body.description,
        }),
      },
    });

    const formattedComplaint = formatComplaintFromDb(createdComplaint);
    const formattedAudit = formatAuditLogFromDb(audit);

    // Broadcast WebSocket events
    eventBus.broadcastCivicComplaint(formattedComplaint);
    eventBus.broadcastAuditLogged(formattedAudit);

    res.status(201).json({
      success: true,
      message: `Civic complaint successfully registered with reference ID ${referenceId}`,
      data: formattedComplaint,
    });
  } catch (error: any) {
    console.error('Error creating civic complaint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/civic/complaints - List complaints
civicRouter.get('/complaints', async (req: Request, res: Response) => {
  try {
    const { department, status } = req.query;
    const where: any = {};
    if (department) where.department = String(department);
    if (status) where.status = String(status);

    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: complaints.length, data: complaints.map(formatComplaintFromDb) });
  } catch (error: any) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/civic/complaints/:referenceId
civicRouter.get('/complaints/:referenceId', async (req: Request, res: Response) => {
  try {
    const { referenceId } = req.params;
    const complaint = await prisma.complaint.findUnique({
      where: { referenceId },
      include: { case: true },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, error: `Complaint with reference ${referenceId} not found` });
    }

    res.json({ success: true, data: formatComplaintFromDb(complaint) });
  } catch (error: any) {
    console.error('Error fetching complaint by reference:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
