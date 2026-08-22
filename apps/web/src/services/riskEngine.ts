import { RiskLevel, WorkflowDomain } from '../../../../packages/shared-types';

export interface RiskEvaluationResult {
  score: number;
  level: RiskLevel;
  requiresAuthorization: boolean;
  policyReason: string;
  flaggedKeywords: string[];
}

export class RiskEngine {
  private criticalMedicalKeywords = [
    'chest pain', 'chest heaviness', 'shortness of breath', 'unconscious',
    'heart attack', 'severe bleeding', 'stroke', 'not breathing'
  ];

  private disasterKeywords = [
    'flood', 'rising water', 'earthquake', 'trapped', 'evacuation',
    'cyclone', 'landslide', 'fire emergency'
  ];

  private civicKeywords = [
    'garbage', 'pothole', 'street light', 'water supply', 'sanitation', 'drainage'
  ];

  public evaluateInput(input: string, domain: WorkflowDomain): RiskEvaluationResult {
    const lower = input.toLowerCase();
    const flaggedKeywords: string[] = [];

    if (domain === 'medical') {
      for (const kw of this.criticalMedicalKeywords) {
        if (lower.includes(kw)) flaggedKeywords.push(kw);
      }

      if (flaggedKeywords.length > 0) {
        return {
          score: 0.95,
          level: 'CRITICAL',
          requiresAuthorization: true,
          policyReason: 'Life-critical medical symptoms detected. Escalated to Emergency Triage.',
          flaggedKeywords
        };
      }

      return {
        score: 0.4,
        level: 'MEDIUM',
        requiresAuthorization: false,
        policyReason: 'General health query. Standard medical guidance provided.',
        flaggedKeywords: []
      };
    }

    if (domain === 'disaster') {
      for (const kw of this.disasterKeywords) {
        if (lower.includes(kw)) flaggedKeywords.push(kw);
      }

      const isHighRisk = flaggedKeywords.length > 0 || lower.includes('sector') || lower.includes('water');
      return {
        score: isHighRisk ? 0.88 : 0.6,
        level: isHighRisk ? 'HIGH' : 'MEDIUM',
        requiresAuthorization: isHighRisk,
        policyReason: isHighRisk
          ? 'Active natural hazard area identified. Safe evacuation route calculation requested.'
          : 'General weather advisory.',
        flaggedKeywords
      };
    }

    if (domain === 'civic') {
      for (const kw of this.civicKeywords) {
        if (lower.includes(kw)) flaggedKeywords.push(kw);
      }

      return {
        score: 0.3,
        level: 'MEDIUM',
        requiresAuthorization: true,
        policyReason: 'Municipal ticket dispatch requires human authorization for official submission.',
        flaggedKeywords
      };
    }

    // Vision / Accessibility Domain
    return {
      score: 0.1,
      level: 'LOW',
      requiresAuthorization: false,
      policyReason: 'Read-only document analysis and text-to-speech rendering.',
      flaggedKeywords: []
    };
  }
}

export const defaultRiskEngine = new RiskEngine();
