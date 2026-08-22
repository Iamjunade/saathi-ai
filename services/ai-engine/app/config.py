"""
SAATHI AI Engine Configuration
"""

import os
from typing import Dict, Any

class Settings:
    PROJECT_NAME: str = "SAATHI AI Engine"
    API_V1_PREFIX: str = "/api/ai"
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1")
    
    # AI / LLM Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "gemini-1.5-flash")
    
    # Risk Engine Thresholds
    RISK_THRESHOLD_CRITICAL: float = 0.80
    RISK_THRESHOLD_HIGH: float = 0.55
    RISK_THRESHOLD_MEDIUM: float = 0.25
    
    # Emergency Helplines
    MEDICAL_EMERGENCY_PHONE: str = "108"
    POLICE_EMERGENCY_PHONE: str = "112"
    CIVIC_HELPLINE: str = "1913"
    DISASTER_CONTROL_ROOM: str = "1070"

settings = Settings()
