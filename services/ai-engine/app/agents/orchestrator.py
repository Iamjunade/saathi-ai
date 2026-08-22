"""
SAATHI Master Orchestrator Agent
Coordinates multi-modal input processing, prompt guardrails, intent routing,
multi-factor risk evaluation, specialist agent execution, and AI trace logging.
"""

import time
from typing import Dict, Any, List, Optional
from app.agents.base_agent import BaseAgent, AITraceStep
from app.agents.medical_agent import medical_agent
from app.agents.disaster_agent import disaster_agent
from app.agents.civic_agent import civic_agent
from app.agents.vision_agent import vision_agent
from app.guardrails import guardrails
from app.risk_engine import risk_engine

class MasterOrchestrator(BaseAgent):
    def __init__(self):
        super().__init__(name="SAATHI_MasterOrchestrator")

    def classify_intent(self, input_content: str, input_type: str) -> str:
        """
        Determines the intent domain based on multi-modal modality and semantic keywords.
        """
        if input_type == "vision":
            return "vision"
            
        text_lower = input_content.lower()
        
        # Medical triggers
        medical_keywords = [
            "chest", "pain", "breathe", "breathing", "heart", "doctor", "hospital",
            "blood", "bleeding", "unconscious", "fever", "injury", "fracture", "ambulance",
            "stroke", "seizure", "choking", "dizziness", "heaviness"
        ]
        if any(w in text_lower for w in medical_keywords):
            return "medical"
            
        # Disaster triggers
        disaster_keywords = [
            "flood", "rising water", "submerged", "evacuation", "evacuate", "trapped",
            "rain", "storm", "cyclone", "landslide", "tsunami", "water logging", "dam"
        ]
        if any(w in text_lower for w in disaster_keywords):
            return "disaster"
            
        # Civic triggers
        civic_keywords = [
            "garbage", "trash", "waste", "pothole", "road", "street light", "manhole",
            "drainage", "water supply", "pipe leak", "sanitation", "electricity", "wire", "municipal"
        ]
        if any(w in text_lower for w in civic_keywords):
            return "civic"
            
        # Vision triggers
        vision_keywords = ["prescription", "document", "notice", "paper", "ocr", "bill", "certificate"]
        if any(w in text_lower for w in vision_keywords):
            return "vision"
            
        return "general"

    async def orchestrate(
        self,
        user_id: str,
        input_type: str,
        input_content: str,
        user_location: Optional[Dict[str, float]] = None,
        image_base64: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Full orchestration pipeline producing verified action payloads and transparent AI traces.
        """
        overall_start_time = time.perf_counter()
        trace_steps: List[AITraceStep] = []
        step_idx = 1
        
        # ----------------------------------------------------
        # 1. Guardrail & Injection Defense Check
        # ----------------------------------------------------
        t0 = time.perf_counter()
        guard_eval = guardrails.evaluate_input_safety(input_content)
        sanitized_input = guard_eval["sanitized_input"]
        
        trace_steps.append(self.create_trace_step(
            step_number=step_idx,
            stage="GUARDRAIL_CHECK",
            thought="Inspecting input payload for prompt injection, adversarial bypasses, and sensitive PII.",
            action_taken="guardrails.evaluate_input_safety()",
            result="Passed" if guard_eval["passed"] else f"Violations: {', '.join(guard_eval['flagged_reasons'])}",
            start_time=t0
        ))
        step_idx += 1

        # ----------------------------------------------------
        # 2. Intent Classification
        # ----------------------------------------------------
        t0 = time.perf_counter()
        intent = self.classify_intent(sanitized_input, input_type)
        
        trace_steps.append(self.create_trace_step(
            step_number=step_idx,
            stage="INTENT_CLASSIFICATION",
            thought=f"Classifying user intent from input modality '{input_type}' and semantic tokens.",
            action_taken=f"classify_intent('{sanitized_input[:30]}...')",
            result=f"Identified domain: {intent.upper()}",
            start_time=t0
        ))
        step_idx += 1

        # ----------------------------------------------------
        # 3. Specialist Agent Execution
        # ----------------------------------------------------
        t0 = time.perf_counter()
        specialist_result = {}
        medical_assessment = None
        disaster_assessment = None
        civic_assessment = None
        vision_assessment = None
        ml_model_score = None
        
        if intent == "medical":
            res = medical_agent.assess_emergency(sanitized_input, user_location)
            medical_assessment = res["medical_assessment"]
            action_payload = res["action_payload"]
            raw_voice_text = res["response_voice_text"]
            trace_thought = "Routing to Medical Specialist. Analyzing triage urgency and locating nearby trauma facilities."
            trace_action = "medical_agent.assess_emergency()"
            trace_res = f"Triage: {medical_assessment['triage_category']} | Target: {action_payload['target']}"
            
        elif intent == "disaster":
            res = disaster_agent.assess_disaster(sanitized_input, user_location)
            disaster_assessment = res["disaster_assessment"]
            action_payload = res["action_payload"]
            raw_voice_text = res["response_voice_text"]
            ml_model_score = res["risk_score"]
            trace_thought = "Invoking Gradient Boosting Disaster Model to evaluate flood elevation and compute safe evacuation corridors."
            trace_action = "disaster_agent.assess_disaster()"
            trace_res = f"Flood Risk: {disaster_assessment['flood_risk_score']} ({disaster_assessment['risk_level']}) | Shelter: {action_payload['metadata']['target_shelter']}"
            
        elif intent == "civic":
            res = civic_agent.process_complaint(sanitized_input, user_location)
            civic_assessment = res["civic_assessment"]
            action_payload = res["action_payload"]
            raw_voice_text = res["response_voice_text"]
            trace_thought = "Routing to Civic Grievance Specialist. Mapping issue to municipal department and assigning SLA tracking ID."
            trace_action = "civic_agent.process_complaint()"
            trace_res = f"Category: {civic_assessment['category']} | Ref ID: {civic_assessment['case_reference_id']}"
            
        elif intent == "vision":
            res = vision_agent.process_document(sanitized_input, image_base64)
            vision_assessment = res["vision_assessment"]
            action_payload = res["action_payload"]
            raw_voice_text = res["response_voice_text"]
            trace_thought = "Routing to Vision Accessibility Specialist. Parsing document structure and extracting plain-audio instructions."
            trace_action = "vision_agent.process_document()"
            trace_res = f"Doc Type: {vision_assessment['document_type']} | Actions Extracted: {len(vision_assessment['action_items_for_user'])}"
            
        else: # general
            action_payload = {
                "action_type": "none",
                "target": "Voice Assistant",
                "data_shared": []
            }
            raw_voice_text = "I am SAATHI, your multimodal response agent. How can I assist you with emergency triage, flood safety, or civic grievances?"
            trace_thought = "General conversational inquiry detected."
            trace_action = "general_handler"
            trace_res = "Provided assistance guidelines."

        trace_steps.append(self.create_trace_step(
            step_number=step_idx,
            stage="SPECIALIST_ROUTING",
            thought=trace_thought,
            action_taken=trace_action,
            result=trace_res,
            start_time=t0
        ))
        step_idx += 1

        # ----------------------------------------------------
        # 4. Multi-Factor Risk Assessment & Authorization Gating
        # ----------------------------------------------------
        t0 = time.perf_counter()
        risk_eval = risk_engine.calculate_risk(
            intent=intent,
            input_text=sanitized_input,
            ml_model_score=ml_model_score
        )
        
        trace_steps.append(self.create_trace_step(
            step_number=step_idx,
            stage="RISK_ASSESSMENT",
            thought=f"Evaluating multi-factor risk: Clinical NLP + Environmental ML Model. Gating authorization policy.",
            action_taken=f"risk_engine.calculate_risk(intent='{intent}')",
            result=f"Score: {risk_eval['risk_score']} | Level: {risk_eval['risk_level']} | Auth Required: {risk_eval['requires_authorization']}",
            start_time=t0
        ))
        step_idx += 1

        # ----------------------------------------------------
        # 5. Output Guardrails & Action Synthesis
        # ----------------------------------------------------
        t0 = time.perf_counter()
        output_guard = guardrails.apply_output_guardrails(
            intent=intent,
            response_voice_text=raw_voice_text,
            risk_level=risk_eval["risk_level"]
        )
        
        final_voice_text = output_guard["cleaned_voice_text"]
        
        trace_steps.append(self.create_trace_step(
            step_number=step_idx,
            stage="ACTION_SYNTHESIS",
            thought="Synthesizing final voice prompt, verifying natural audio phonetics, and packaging data contract.",
            action_taken="guardrails.apply_output_guardrails()",
            result=f"Verified response ready. Length: {len(final_voice_text)} chars",
            start_time=t0
        ))

        total_latency_ms = round((time.perf_counter() - overall_start_time) * 1000, 2)

        return {
            "intent": intent,
            "risk_score": risk_eval["risk_score"],
            "risk_level": risk_eval["risk_level"],
            "requires_authorization": risk_eval["requires_authorization"],
            "action_payload": action_payload,
            "response_voice_text": final_voice_text,
            "ai_trace": [step.model_dump() for step in trace_steps],
            "disaster_assessment": disaster_assessment,
            "medical_assessment": medical_assessment,
            "civic_assessment": civic_assessment,
            "vision_assessment": vision_assessment,
            "guardrail_verdict": {
                "passed": guard_eval["passed"] and output_guard["passed"],
                "safe_for_voice": output_guard["safe_for_voice"],
                "disclaimers": output_guard["disclaimers"]
            },
            "latency_total_ms": total_latency_ms
        }

orchestrator = MasterOrchestrator()
