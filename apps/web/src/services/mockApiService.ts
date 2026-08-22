import {
  IntentAssessment,
  TraceStep,
  WorkflowDomain
} from '../../../../packages/shared-types';
import { defaultAgentOrchestrator } from './agentOrchestrator';

export interface ProcessedInputResult {
  assessment: IntentAssessment;
  traceSteps: TraceStep[];
  voiceResponse: string;
  nearbyHospitals?: import('./locationService').NearbyHospital[];
  reasoningSource?: 'llm' | 'deterministic';
}

export const processUserInput = async (
  input: string,
  domainOverride?: WorkflowDomain
): Promise<ProcessedInputResult> => {
  // Try live AI Engine Backend (:8000) first
  try {
    const response = await fetch('http://localhost:8000/api/ai/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: input, domain: domainOverride }),
      signal: AbortSignal.timeout(1500)
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch {
    // Backend offline or compiling: fall back to local Agent Orchestrator Brain
  }

  // Execute through local Core Agent Orchestrator Brain
  return await defaultAgentOrchestrator.orchestrate(input, domainOverride);
};
