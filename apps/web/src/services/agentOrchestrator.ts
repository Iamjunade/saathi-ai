// PRD §20, §91, §95: Agent Orchestrator — LLM reasoning + deterministic policy + typed tools + memory
// The LLM is the reasoning interface, not the entire system.

import {
  ActionPayload,
  IntentAssessment,
  TraceStep,
  WorkflowDomain
} from '../../../../packages/shared-types';
import { defaultContextEngine } from './contextEngine';
import { defaultRiskEngine } from './riskEngine';
import { classifyWithLLM } from './llmService';
import { getUserLocation, findNearbyHospitals, type NearbyHospital } from './locationService';
import { checkToolPermission, TOOL_REGISTRY } from './toolRegistry';

export interface OrchestrationResult {
  assessment: IntentAssessment;
  traceSteps: TraceStep[];
  voiceResponse: string;
  nearbyHospitals?: NearbyHospital[];
  reasoningSource: 'llm' | 'deterministic';
}

export class AgentOrchestrator {
  public async orchestrate(
    input: string,
    domainOverride?: WorkflowDomain
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().substring(11, 19);
    const sanitized = defaultContextEngine.sanitizeInput(input);

    // Step 1: Get real location
    const location = await getUserLocation();
    const locationStr = `${location.displayName} (${location.coordinates.lat.toFixed(4)}°N, ${location.coordinates.lng.toFixed(4)}°E)`;

    const traceSteps: TraceStep[] = [
      {
        id: 'step-1',
        timestamp,
        stage: 'INPUT',
        label: 'Natural Language Input Received',
        details: `"${sanitized}" | Location: ${location.source === 'browser' ? '📍 Live GPS' : '📍 Fallback'}: ${location.city}`,
        status: 'success'
      }
    ];

    // Step 2: Try LLM classification first, fall back to deterministic
    let domain: WorkflowDomain = domainOverride || 'medical';
    let riskScore = 0;
    let riskLevel: import('../../../../packages/shared-types').RiskLevel = 'MEDIUM';
    let voiceResponse = '';
    let confidence = 0.96;
    let reasoningSource: 'llm' | 'deterministic' = 'deterministic';
    let llmSummary = sanitized;

    const historyStr = defaultContextEngine.getHistory().slice(-5).map(t => `User: ${t.userInput}\nSAATHI: ${t.agentResponse}`).join('\n');

    if (!domainOverride) {
      const llmResult = await classifyWithLLM(sanitized, locationStr, historyStr);

      if (llmResult) {
        reasoningSource = 'llm';
        domain = llmResult.intent;
        confidence = llmResult.confidence;
        riskScore = llmResult.riskScore;
        riskLevel = llmResult.riskLevel;
        voiceResponse = llmResult.voiceResponse;
        llmSummary = llmResult.summary;

        traceSteps.push({
          id: 'step-2',
          timestamp,
          stage: 'INTENT_RISK',
          label: `🧠 LLM Classification: ${domain.toUpperCase()} (${(confidence * 100).toFixed(0)}% confidence)`,
          details: `Risk: ${riskScore.toFixed(2)} (${riskLevel}) | Reasoning: ${llmResult.reasoning}`,
          status: 'success'
        });
      }
    }

    // Deterministic fallback: keyword-based classification
    if (reasoningSource === 'deterministic') {
      if (!domainOverride) {
        domain = this.classifyByKeywords(sanitized);
      }
      const riskEval = defaultRiskEngine.evaluateInput(sanitized, domain);
      riskScore = riskEval.score;
      riskLevel = riskEval.level;

      traceSteps.push({
        id: 'step-2',
        timestamp,
        stage: 'INTENT_RISK',
        label: `⚙️ Deterministic Classification: ${domain.toUpperCase()}`,
        details: `Risk: ${riskScore.toFixed(2)} (${riskLevel}) | Policy: ${riskEval.policyReason}`,
        status: 'success'
      });
    }

    // PRD §18: Deterministic safety policy ALWAYS overrides LLM for life-critical patterns
    const safetyOverride = defaultRiskEngine.evaluateInput(sanitized, domain);
    if (safetyOverride.level === 'CRITICAL' && riskLevel !== 'CRITICAL') {
      riskLevel = 'CRITICAL';
      riskScore = Math.max(riskScore, safetyOverride.score);
      traceSteps.push({
        id: 'step-2b',
        timestamp,
        stage: 'INTENT_RISK',
        label: '🛡️ Safety Policy Override: Escalated to CRITICAL',
        details: `Deterministic safety layer detected life-threatening keywords: ${safetyOverride.flaggedKeywords.join(', ')}`,
        status: 'warning'
      });
    }

    // Step 3: Specialist Agent execution
    let recommendedAction: ActionPayload | undefined;
    const requiresAuth = safetyOverride.requiresAuthorization || riskLevel === 'CRITICAL' || riskLevel === 'HIGH';
    let nearbyHospitals: NearbyHospital[] | undefined;

    if (domain === 'medical') {
      // Discover real nearby hospitals
      nearbyHospitals = await findNearbyHospitals(location.coordinates);
      const closestHospital = nearbyHospitals[0];

      const toolCheck = checkToolPermission('contact_hospital_emergency');
      traceSteps.push({
        id: 'step-3',
        timestamp,
        stage: 'AGENT_ROUTING',
        label: 'Medical Triage Agent → Hospital Discovery',
        details: `Found ${nearbyHospitals.length} hospitals nearby. Closest: ${closestHospital.name} (${closestHospital.distanceKm} km)`,
        status: 'success'
      });

      recommendedAction = {
        actionId: `ACT-${Date.now()}`,
        actionType: 'EMERGENCY_TRIAGE_REQUEST',
        targetProvider: closestHospital.name,
        riskLevel,
        requiresConfirmation: true,
        dataShared: toolCheck.tool?.dataShared || [],
        description: `Initiate emergency triage request to ${closestHospital.name} (${closestHospital.distanceKm} km away). [SIMULATED INTEGRATION]`,
        details: {
          symptoms: sanitized,
          hospital: closestHospital.name,
          distance: `${closestHospital.distanceKm} km`,
          patientLocation: locationStr,
          allHospitals: nearbyHospitals.slice(0, 3).map(h => `${h.name} (${h.distanceKm} km)`)
        }
      };

      if (!voiceResponse) {
        voiceResponse = `I understand you are experiencing concerning symptoms. Based on what you've told me, urgent medical evaluation may be appropriate. I have found ${nearbyHospitals.length} hospitals near your location. The closest is ${closestHospital.name}, ${closestHospital.distanceKm} kilometers away. I need your authorization to share your location and initiate a triage request.`;
      }

      traceSteps.push({
        id: 'step-4',
        timestamp,
        stage: 'TOOL_EXECUTION',
        label: `Authorization Gate: ${closestHospital.name}`,
        details: `Data to share: ${recommendedAction.dataShared.join(', ')}`,
        status: 'pending'
      });

    } else if (domain === 'disaster') {
      const toolCheck = checkToolPermission('share_location_with_responders');
      traceSteps.push({
        id: 'step-3',
        timestamp,
        stage: 'AGENT_ROUTING',
        label: 'Disaster Response Agent → Risk Assessment & Safe Route',
        details: `Flood risk model: score ${riskScore.toFixed(2)} | Location: ${locationStr}`,
        status: 'success'
      });

      recommendedAction = {
        actionId: `ACT-${Date.now()}`,
        actionType: 'DISASTER_EVACUATION_SHARE',
        targetProvider: 'Telangana Disaster Management Authority',
        riskLevel,
        requiresConfirmation: true,
        dataShared: toolCheck.tool?.dataShared || [],
        description: `Share live GPS location with disaster responders and reserve shelter spot. [SIMULATED INTEGRATION]`,
        details: {
          hazardType: 'FLASH_FLOOD',
          userLocation: locationStr,
          riskScore: riskScore.toFixed(2),
          shelterTarget: 'Safe Shelter #4 (Public School Complex, High Ground)',
          estimatedEvacuationTime: '12 minutes via elevated route'
        }
      };

      if (!voiceResponse) {
        voiceResponse = `Disaster response agent activated. High flood risk detected in your area with a risk score of ${riskScore.toFixed(2)}. I have identified an elevated evacuation route to Safe Shelter Number 4, approximately 12 minutes away. Please authorize sharing your location with emergency responders.`;
      }

      traceSteps.push({
        id: 'step-4',
        timestamp,
        stage: 'TOOL_EXECUTION',
        label: 'Authorization Gate: Share Location with Responders',
        details: `Data to share: ${recommendedAction.dataShared.join(', ')}`,
        status: 'pending'
      });

    } else if (domain === 'civic') {
      const refId = `CIVIC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const toolCheck = checkToolPermission('create_civic_complaint');

      traceSteps.push({
        id: 'step-3',
        timestamp,
        stage: 'AGENT_ROUTING',
        label: 'Civic Assistance Agent → Complaint Classification',
        details: `Structured complaint generated | Ref: ${refId} | Location: ${location.city}`,
        status: 'success'
      });

      recommendedAction = {
        actionId: `ACT-${Date.now()}`,
        actionType: 'CIVIC_TICKET_SUBMISSION',
        targetProvider: 'Greater Hyderabad Municipal Corporation (GHMC)',
        riskLevel,
        requiresConfirmation: true,
        dataShared: toolCheck.tool?.dataShared || [],
        description: `Submit municipal grievance ticket #${refId} to GHMC. [SIMULATED INTEGRATION]`,
        details: {
          category: 'SANITATION',
          description: sanitized,
          location: locationStr,
          referenceId: refId
        }
      };

      if (!voiceResponse) {
        voiceResponse = `Civic assistance agent activated. I have structured your complaint into Municipal Ticket Number ${refId} for the Greater Hyderabad Municipal Corporation Sanitation Department. Please authorize the submission.`;
      }

      traceSteps.push({
        id: 'step-4',
        timestamp,
        stage: 'TOOL_EXECUTION',
        label: `Authorization Gate: Submit Ticket #${refId}`,
        details: `Data to share: ${recommendedAction.dataShared.join(', ')}`,
        status: 'pending'
      });

    } else {
      // Vision / Accessibility Agent
      traceSteps.push({
        id: 'step-3',
        timestamp,
        stage: 'AGENT_ROUTING',
        label: 'Vision & Accessibility Agent → Document OCR',
        details: 'Extracting and simplifying document text for spoken explanation',
        status: 'success'
      });

      traceSteps.push({
        id: 'step-4',
        timestamp,
        stage: 'OUTCOME',
        label: 'Text Simplified & Voice Response Rendered',
        details: 'Document content translated into simple conversational language',
        status: 'success'
      });

      if (!voiceResponse) {
        voiceResponse = 'Document analyzed. Your hospital discharge summary states: Take the prescribed medication twice daily after food, and schedule a follow-up visit in 7 days. Would you like me to explain anything in more detail?';
      }
    }

    // Save turn into memory
    defaultContextEngine.addTurn(sanitized, voiceResponse, domain);

    const latencyMs = Date.now() - startTime;
    traceSteps.push({
      id: `step-latency`,
      timestamp: new Date().toISOString().substring(11, 19),
      stage: 'OUTCOME',
      label: `Pipeline Complete (${latencyMs}ms)`,
      details: `Source: ${reasoningSource === 'llm' ? '🧠 Gemini LLM' : '⚙️ Deterministic'} | Location: ${location.source}`,
      status: 'success'
    });

    const assessment: IntentAssessment = {
      intent: domain,
      confidence,
      riskScore,
      riskLevel,
      requiresAuthorization: requiresAuth,
      recommendedAction,
      summary: llmSummary
    };

    return {
      assessment,
      traceSteps,
      voiceResponse,
      nearbyHospitals,
      reasoningSource
    };
  }

  private classifyByKeywords(input: string): WorkflowDomain {
    const lower = input.toLowerCase();
    if (lower.includes('chest') || lower.includes('pain') || lower.includes('breath') || lower.includes('bleed') ||
        lower.includes('doctor') || lower.includes('hospital') || lower.includes('headache') || lower.includes('fever') ||
        lower.includes('unconscious') || lower.includes('stroke') || lower.includes('heart')) {
      return 'medical';
    }
    if (lower.includes('flood') || lower.includes('water') || lower.includes('rising') || lower.includes('earthquake') ||
        lower.includes('fire') || lower.includes('cyclone') || lower.includes('evacuat') || lower.includes('trapped')) {
      return 'disaster';
    }
    if (lower.includes('garbage') || lower.includes('pothole') || lower.includes('street light') || lower.includes('sanitation') ||
        lower.includes('drainage') || lower.includes('water supply') || lower.includes('complaint') || lower.includes('collected')) {
      return 'civic';
    }
    if (lower.includes('document') || lower.includes('read') || lower.includes('explain') || lower.includes('summary') ||
        lower.includes('image') || lower.includes('photo') || lower.includes('camera') || lower.includes('ocr')) {
      return 'vision';
    }
    return 'medical'; // safe default
  }
}

export const defaultAgentOrchestrator = new AgentOrchestrator();
