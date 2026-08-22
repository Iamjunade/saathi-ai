import { RiskLevel } from '../../../../packages/shared-types';

// PRD §38-39: Every tool must be typed with risk, permissions, data shared, audit requirements
export interface ToolDefinition {
  name: string;
  description: string;
  riskLevel: RiskLevel;
  requiresConfirmation: boolean;
  dataShared: string[];
  externalParty: string;
  reversible: boolean;
  auditRequired: boolean;
}

export interface ToolResult {
  success: boolean;
  toolName: string;
  data: Record<string, any>;
  timestamp: string;
  simulatedIntegration: boolean; // PRD §84: clearly label simulations
}

// PRD §38: Agent Tool Registry — every tool is typed, never arbitrary shell commands
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  find_nearby_hospitals: {
    name: 'find_nearby_hospitals',
    description: 'Search for hospitals within radius of user location',
    riskLevel: 'MEDIUM',
    requiresConfirmation: false,
    dataShared: ['Approximate Location (city-level)'],
    externalParty: 'OpenStreetMap / Overpass API',
    reversible: true,
    auditRequired: false
  },
  contact_hospital_emergency: {
    name: 'contact_hospital_emergency',
    description: 'Initiate emergency triage request to hospital ER',
    riskLevel: 'CRITICAL',
    requiresConfirmation: true,
    dataShared: ['Full Name', 'Precise GPS Location', 'Symptom Description', 'Emergency Contact Number'],
    externalParty: 'Hospital Emergency Triage System',
    reversible: false,
    auditRequired: true
  },
  get_weather_risk: {
    name: 'get_weather_risk',
    description: 'Retrieve local weather risk assessment for disaster prediction',
    riskLevel: 'LOW',
    requiresConfirmation: false,
    dataShared: ['City-level Location'],
    externalParty: 'Weather Data Provider',
    reversible: true,
    auditRequired: false
  },
  calculate_safe_route: {
    name: 'calculate_safe_route',
    description: 'Calculate evacuation route avoiding hazard zones',
    riskLevel: 'MEDIUM',
    requiresConfirmation: false,
    dataShared: ['Precise GPS Location'],
    externalParty: 'Routing Provider (OpenStreetMap)',
    reversible: true,
    auditRequired: false
  },
  share_location_with_responders: {
    name: 'share_location_with_responders',
    description: 'Transmit live GPS coordinates to emergency responders',
    riskLevel: 'HIGH',
    requiresConfirmation: true,
    dataShared: ['Precise GPS Location', 'Full Name', 'Household Size'],
    externalParty: 'Disaster Management Authority',
    reversible: false,
    auditRequired: true
  },
  create_civic_complaint: {
    name: 'create_civic_complaint',
    description: 'Generate and submit structured municipal grievance ticket',
    riskLevel: 'MEDIUM',
    requiresConfirmation: true,
    dataShared: ['Citizen Name', 'Phone Number', 'Location Address', 'Grievance Description'],
    externalParty: 'Municipal Corporation Portal',
    reversible: true,
    auditRequired: true
  },
  analyze_document_ocr: {
    name: 'analyze_document_ocr',
    description: 'Extract and simplify text from uploaded document image',
    riskLevel: 'LOW',
    requiresConfirmation: false,
    dataShared: [],
    externalParty: 'Local Vision Model',
    reversible: true,
    auditRequired: false
  },
  schedule_followup: {
    name: 'schedule_followup',
    description: 'Schedule a follow-up check-in for an active case',
    riskLevel: 'LOW',
    requiresConfirmation: false,
    dataShared: [],
    externalParty: 'Internal SAATHI Engine',
    reversible: true,
    auditRequired: false
  }
};

// PRD §40: Before tool execution: intent → policy check → permission check → data minimization → action preview → user approval → tool execution
export function checkToolPermission(toolName: string): {
  allowed: boolean;
  needsApproval: boolean;
  tool: ToolDefinition | null;
} {
  const tool = TOOL_REGISTRY[toolName];
  if (!tool) {
    return { allowed: false, needsApproval: false, tool: null };
  }

  return {
    allowed: true,
    needsApproval: tool.requiresConfirmation,
    tool
  };
}

// PRD §84: Simulated integrations are clearly labeled
export async function executeTool(
  toolName: string,
  params: Record<string, any>
): Promise<ToolResult> {
  const tool = TOOL_REGISTRY[toolName];
  if (!tool) {
    return {
      success: false,
      toolName,
      data: { error: `Unknown tool: ${toolName}` },
      timestamp: new Date().toISOString(),
      simulatedIntegration: false
    };
  }

  // For the hackathon, all external integrations are simulated
  // PRD §61: Never say "I contacted the hospital" unless the tool returned success
  return {
    success: true,
    toolName,
    data: {
      ...params,
      note: `[SIMULATED] ${tool.description}. In production, this would connect to ${tool.externalParty}.`
    },
    timestamp: new Date().toISOString(),
    simulatedIntegration: true
  };
}
