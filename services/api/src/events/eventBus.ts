import { Server as SocketIOServer } from 'socket.io';
import type {
  Case,
  CaseStatus,
  CaseAction,
  Hospital,
  AuditLog,
  CivicComplaint,
  ServerToClientEvents,
  ClientToServerEvents,
} from '@saathi/shared-types';

class EventBus {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;

  public init(io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;

    this.io.on('connection', (socket) => {
      console.log(`⚡ [WebSocket] Client connected: ${socket.id}`);

      socket.on('join:room', (room) => {
        socket.join(room);
        console.log(`🔌 [WebSocket] ${socket.id} joined room: ${room}`);
      });

      socket.on('leave:room', (room) => {
        socket.leave(room);
        console.log(`🔌 [WebSocket] ${socket.id} left room: ${room}`);
      });

      socket.on('disconnect', () => {
        console.log(`⚡ [WebSocket] Client disconnected: ${socket.id}`);
      });
    });
  }

  public getIO(): SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null {
    return this.io;
  }

  public broadcastCaseCreated(caseData: Case) {
    if (!this.io) return;
    this.io.emit('case:created', { case: caseData });
    if (caseData.caseType === 'MEDICAL') {
      this.io.to('hospital-intake').emit('hospital:incoming_case', {
        case: caseData,
        hospitalId: caseData.metadata?.targetHospitalId,
        etaMins: caseData.metadata?.estimatedEtaMins || 8,
      });
    }
  }

  public broadcastCaseUpdated(caseData: Case) {
    if (!this.io) return;
    this.io.emit('case:updated', { case: caseData });
  }

  public broadcastCaseStatusChanged(
    caseId: string,
    previousStatus: CaseStatus,
    newStatus: CaseStatus,
    caseData: Case,
    actor: string
  ) {
    if (!this.io) return;
    this.io.emit('case:status_changed', {
      caseId,
      previousStatus,
      newStatus,
      case: caseData,
      actor,
    });
  }

  public broadcastActionCreated(action: CaseAction, caseId: string) {
    if (!this.io) return;
    this.io.emit('action:created', { action, caseId });
  }

  public broadcastActionApproved(actionId: string, caseId: string, action: CaseAction, actor: string) {
    if (!this.io) return;
    this.io.emit('action:approved', { actionId, caseId, action, actor });
  }

  public broadcastActionRejected(
    actionId: string,
    caseId: string,
    action: CaseAction,
    actor: string,
    reason: string
  ) {
    if (!this.io) return;
    this.io.emit('action:rejected', { actionId, caseId, action, actor, reason });
  }

  public broadcastHospitalIncomingCase(caseData: Case, hospitalId?: string, etaMins?: number) {
    if (!this.io) return;
    this.io.to('hospital-intake').emit('hospital:incoming_case', {
      case: caseData,
      hospitalId,
      etaMins,
    });
  }

  public broadcastHospitalCapacityUpdated(hospital: Hospital) {
    if (!this.io) return;
    this.io.emit('hospital:capacity_updated', { hospital });
  }

  public broadcastAuditLogged(log: AuditLog) {
    if (!this.io) return;
    this.io.emit('audit:logged', { log });
  }

  public broadcastCivicComplaint(complaint: CivicComplaint) {
    if (!this.io) return;
    this.io.emit('civic:complaint_created', { complaint });
  }
}

export const eventBus = new EventBus();
