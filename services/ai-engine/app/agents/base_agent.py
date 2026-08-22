"""
SAATHI Base Agent & AI Trace Builder
Standardizes reasoning step generation for the frontend AI Trace Viewer.
"""

import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class AITraceStep(BaseModel):
    step_number: int
    stage: str # INTENT_CLASSIFICATION, GUARDRAIL_CHECK, RISK_ASSESSMENT, SPECIALIST_ROUTING, ACTION_SYNTHESIS
    agent_name: str
    thought: str
    action_taken: str
    result: str
    latency_ms: float
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BaseAgent:
    def __init__(self, name: str):
        self.name = name

    def create_trace_step(
        self,
        step_number: int,
        stage: str,
        thought: str,
        action_taken: str,
        result: str,
        start_time: float
    ) -> AITraceStep:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return AITraceStep(
            step_number=step_number,
            stage=stage,
            agent_name=self.name,
            thought=thought,
            action_taken=action_taken,
            result=result,
            latency_ms=latency_ms,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
