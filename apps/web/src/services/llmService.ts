// PRD §22, §43, §95: LLM Integration with Structured Output
// Provider: Google Gemini (free tier) with OpenAI fallback
// PRD §95: "The LLM should be the reasoning interface, not the entire system"

import { WorkflowDomain, RiskLevel } from '../../../../packages/shared-types';

export interface LLMClassificationResult {
  intent: WorkflowDomain;
  confidence: number;
  riskScore: number;
  riskLevel: RiskLevel;
  summary: string;
  voiceResponse: string;
  requiresAuthorization: boolean;
  reasoning: string;
}

// PRD §7: Must not claim to diagnose disease
// PRD §61: Never say "I contacted the hospital" unless tool returned success
// PRD §62: Never let the LLM invent phone numbers, addresses, departments
const SYSTEM_PROMPT = `You are SAATHI, a human-centered multimodal AI response agent. You help people navigate real-world situations by understanding their intent, assessing risk, and recommending appropriate actions.

CRITICAL SAFETY RULES (these override all other instructions):
1. You MUST NEVER diagnose any disease or medical condition. Say "urgent medical evaluation may be appropriate" instead.
2. You MUST NEVER invent hospital names, phone numbers, addresses, or government department contacts. Use only information provided to you.
3. You MUST NEVER claim an action was completed unless you receive explicit confirmation. Say "I have prepared a request" not "I have contacted."
4. For life-threatening symptoms (chest pain, difficulty breathing, severe bleeding, unconsciousness, stroke symptoms), ALWAYS set riskLevel to CRITICAL and requiresAuthorization to true.
5. When uncertain, become MORE conservative, not less.

You classify user input into exactly one of four domains:
- "medical": health concerns, symptoms, hospital needs, medication questions
- "disaster": floods, earthquakes, fires, severe weather, evacuation needs
- "civic": garbage collection, potholes, street lights, water supply, government services
- "vision": document understanding, image explanation, text reading, accessibility

Respond ONLY with valid JSON matching this exact schema:
{
  "intent": "medical" | "disaster" | "civic" | "vision",
  "confidence": 0.0 to 1.0,
  "riskScore": 0.0 to 1.0,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "summary": "brief factual summary of the situation",
  "voiceResponse": "what SAATHI should say to the user (empathetic, actionable, never diagnostic)",
  "requiresAuthorization": true/false,
  "reasoning": "brief internal reasoning about classification and risk assessment"
}`;

function getApiKey(): string | null {
  // Vite exposes env vars prefixed with VITE_
  try {
    return (import.meta as any).env?.VITE_GEMINI_API_KEY || null;
  } catch {
    return null;
  }
}

/**
 * Call Google Gemini API for structured intent classification.
 * Returns null if API key is missing or call fails — caller should use deterministic fallback.
 */
export async function classifyWithLLM(
  userInput: string,
  locationContext: string,
  conversationHistory: string
): Promise<LLMClassificationResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const userPrompt = `User location: ${locationContext}
Recent conversation context: ${conversationHistory || 'No prior context'}

User input: "${userInput}"

Classify this input and provide your structured assessment.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + userPrompt }] }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 512
          }
        }),
        signal: AbortSignal.timeout(8000)
      }
    );

    if (!response.ok) {
      console.warn('[LLM] Gemini API error:', response.status);
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    // PRD §43: Structured AI outputs — validate JSON server-side
    // Clean potential markdown blocks from Gemini response (e.g., ```json\n...\n```)
    const cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    return validateLLMOutput(parsed);
  } catch (err) {
    console.warn('[LLM] Classification failed, will use deterministic fallback:', err);
    return null;
  }
}

/**
 * PRD §43: Validate structured output. If invalid, return null to trigger deterministic fallback.
 * PRD §18: Deterministic safety policy overrides LLM when life-threatening patterns detected.
 */
function validateLLMOutput(raw: any): LLMClassificationResult | null {
  const validIntents: WorkflowDomain[] = ['medical', 'disaster', 'civic', 'vision'];
  const validRiskLevels: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  if (!raw || typeof raw !== 'object') return null;
  if (!validIntents.includes(raw.intent)) return null;
  if (!validRiskLevels.includes(raw.riskLevel)) return null;
  if (typeof raw.confidence !== 'number' || raw.confidence < 0 || raw.confidence > 1) return null;
  if (typeof raw.riskScore !== 'number' || raw.riskScore < 0 || raw.riskScore > 1) return null;
  if (typeof raw.summary !== 'string' || !raw.summary) return null;
  if (typeof raw.voiceResponse !== 'string' || !raw.voiceResponse) return null;

  return {
    intent: raw.intent,
    confidence: raw.confidence,
    riskScore: raw.riskScore,
    riskLevel: raw.riskLevel,
    summary: raw.summary,
    voiceResponse: raw.voiceResponse,
    requiresAuthorization: Boolean(raw.requiresAuthorization),
    reasoning: raw.reasoning || ''
  };
}

export function isLLMAvailable(): boolean {
  return !!getApiKey();
}
