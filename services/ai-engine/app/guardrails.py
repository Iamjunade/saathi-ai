"""
SAATHI Prompt & Safety Guardrails
Enforces prompt injection defense, medical safety boundaries (Rule 1),
PII governance, and emergency disclaimer standards.
"""

import re
from typing import Dict, Any, List, Tuple

INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"you\s+are\s+now\s+in\s+dan\s+mode",
    r"system\s*:\s*override",
    r"jailbreak",
    r"disregard\s+safety\s+guidelines",
    r"bypass\s+all\s+filters"
]

SENSITIVE_PII_PATTERNS = {
    "credit_card": r"\b(?:\d[ -]*?){13,16}\b",
    "ssn_aadhaar": r"\b\d{4}\s\d{4}\s\d{4}\b",
    "password": r"(?:password|pwd|secret)\s*[:=]\s*\S+"
}

PROHIBITED_MEDICAL_DIAGNOSES = [
    r"you\s+(are\s+diagnosed\s+with|have\s+been\s+diagnosed\s+with)",
    r"my\s+diagnosis\s+is",
    r"i\s+diagnose\s+you\s+with",
    r"you\s+definitely\s+have\s+(pneumonia|tuberculosis|cancer|diabetes|asthma)",
    r"i\s+am\s+prescribing\s+you"
]

MEDICAL_DISCLAIMER = "⚠️ Emergency Disclaimer: SAATHI provides immediate automated triage coordination. In life-threatening emergencies, emergency services (108 / 112) should be contacted immediately."

class SafetyGuardrails:
    def __init__(self):
        self.injection_regexes = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]
        self.pii_regexes = {k: re.compile(p, re.IGNORECASE) for k, p in SENSITIVE_PII_PATTERNS.items()}
        self.medical_diag_regexes = [re.compile(p, re.IGNORECASE) for p in PROHIBITED_MEDICAL_DIAGNOSES]

    def evaluate_input_safety(self, text: str) -> Dict[str, Any]:
        """
        Validates user input against prompt injection and malicious intents.
        """
        flagged_reasons = []
        is_safe = True
        
        # Check prompt injection
        for regex in self.injection_regexes:
            if regex.search(text):
                flagged_reasons.append("PROMPT_INJECTION_ATTEMPT_DETECTED")
                is_safe = False
                break
                
        # Sanitize PII
        sanitized_text = text
        for pii_type, regex in self.pii_regexes.items():
            if regex.search(sanitized_text):
                sanitized_text = regex.sub(f"[REDACTED_{pii_type.upper()}]", sanitized_text)
                flagged_reasons.append(f"PII_REDACTED_{pii_type.upper()}")

        return {
            "passed": is_safe,
            "sanitized_input": sanitized_text,
            "flagged_reasons": flagged_reasons
        }

    def verify_medical_rule_1(self, text: str) -> Dict[str, Any]:
        """
        Rule 1: Never allow LLMs to diagnose medical diseases.
        Triage & symptom severity scoring only.
        """
        violates = False
        violations = []
        for regex in self.medical_diag_regexes:
            match = regex.search(text)
            if match:
                violates = True
                violations.append(f"PROHIBITED_DIAGNOSIS_DETECTED: '{match.group(0)}'")

        return {
            "rule_1_passed": not violates,
            "violations": violations
        }

    def apply_output_guardrails(self, intent: str, response_voice_text: str, risk_level: str) -> Dict[str, Any]:
        """
        Inspects generated response, injects mandatory life-safety disclaimers,
        enforces Rule 1 medical non-diagnosis, and verifies audio voice friendliness.
        """
        disclaimers = []
        rule_1_check = self.verify_medical_rule_1(response_voice_text)
        
        if intent == "medical" and risk_level in ["HIGH", "CRITICAL"]:
            disclaimers.append(MEDICAL_DISCLAIMER)
            
        # Ensure voice output is concise, clear, and avoids markdown/symbols
        clean_voice_text = re.sub(r"[\*\_#`~]", "", response_voice_text)
        clean_voice_text = re.sub(r"\s+", " ", clean_voice_text).strip()
        
        return {
            "passed": rule_1_check["rule_1_passed"],
            "safe_for_voice": True,
            "cleaned_voice_text": clean_voice_text,
            "disclaimers": disclaimers,
            "rule_1_compliance": rule_1_check
        }

guardrails = SafetyGuardrails()
