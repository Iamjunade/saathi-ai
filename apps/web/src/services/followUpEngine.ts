import { CaseRecord } from '../../../../packages/shared-types';

export interface FollowUpSchedule {
  caseId: string;
  checkInDelayMs: number;
  message: string;
}

export class FollowUpEngine {
  public generateFollowUp(caseRecord: CaseRecord): FollowUpSchedule {
    switch (caseRecord.domain) {
      case 'medical':
        return {
          caseId: caseRecord.id,
          checkInDelayMs: 300000, // 5 minutes
          message: 'SAATHI will check in with Apollo Emergency Triage in 5 minutes to confirm ambulance dispatch status.'
        };
      case 'disaster':
        return {
          caseId: caseRecord.id,
          checkInDelayMs: 600000, // 10 minutes
          message: 'SAATHI is actively monitoring rainfall & water level telemetry along your evacuation path.'
        };
      case 'civic':
        return {
          caseId: caseRecord.id,
          checkInDelayMs: 14400000, // 4 hours
          message: 'Municipal ticket tracking active. SAATHI will verify resolution with GHMC Sanitation Dept.'
        };
      case 'vision':
      default:
        return {
          caseId: caseRecord.id,
          checkInDelayMs: 0,
          message: 'Document OCR processing completed out loud.'
        };
    }
  }
}

export const defaultFollowUpEngine = new FollowUpEngine();
