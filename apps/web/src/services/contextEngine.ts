import { CaseRecord, WorkflowDomain } from '../../../../packages/shared-types';

export interface UserContext {
  userId: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    addressName: string;
  };
  preferredLanguage: 'en' | 'hi' | 'te';
  emergencyContacts: Array<{ name: string; relation: string; phone: string }>;
}

export interface ConversationTurn {
  id: string;
  timestamp: string;
  userInput: string;
  agentResponse: string;
  domain: WorkflowDomain;
}

export class ContextEngine {
  private userContext: UserContext;
  private conversationHistory: ConversationTurn[] = [];
  private activeCase: CaseRecord | null = null;

  constructor() {
    this.userContext = {
      userId: 'USER-9842',
      name: 'Junaid Pasha',
      location: {
        lat: 17.3850,
        lng: 78.4867,
        addressName: 'Hyderabad, Telangana'
      },
      preferredLanguage: 'en',
      emergencyContacts: [
        { name: 'Family Contact', relation: 'Relative', phone: '+91 98765 43210' }
      ]
    };
  }

  public getUserContext(): UserContext {
    return this.userContext;
  }

  public addTurn(userInput: string, agentResponse: string, domain: WorkflowDomain) {
    const turn: ConversationTurn = {
      id: `TURN-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userInput,
      agentResponse,
      domain
    };
    this.conversationHistory.push(turn);
  }

  public getHistory(): ConversationTurn[] {
    return this.conversationHistory;
  }

  public setActiveCase(caseRecord: CaseRecord) {
    this.activeCase = caseRecord;
  }

  public getActiveCase(): CaseRecord | null {
    return this.activeCase;
  }

  public sanitizeInput(input: string): string {
    // PRD §35: Data Classification — Remove potential sensitive tokens or sanitize text before processing
    // Hackathon simple sanitization: remove obvious credit card patterns and SSN-like patterns
    let sanitized = input;
    sanitized = sanitized.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[REDACTED_FINANCIAL]');
    sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_ID]');
    
    return sanitized.trim();
  }
}

export const defaultContextEngine = new ContextEngine();
