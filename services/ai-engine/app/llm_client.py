"""
SAATHI Resilient LLM Client
Provides intelligent multimodal reasoning with zero-latency deterministic fallbacks
for rock-solid hackathon demonstrations.
"""

import os
import json
import httpx
from typing import Dict, Any, Optional
from app.config import settings

class ResilientLLMClient:
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY

    async def generate_response(self, system_prompt: str, user_prompt: str, model: Optional[str] = None) -> Optional[str]:
        """
        Attempts to call live LLM if key is present, otherwise returns None to trigger specialist heuristics.
        """
        if self.gemini_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_key}"
                payload = {
                    "contents": [{"parts": [{"text": f"{system_prompt}\n\nUser: {user_prompt}"}]}],
                    "generationConfig": {"temperature": 0.2, "maxOutputTokens": 800}
                }
                async with httpx.AsyncClient(timeout=4.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["candidates"][0]["content"]["parts"][0]["text"]
            except Exception as e:
                print(f"[LLM Client] Live Gemini error ({e}), switching to local specialist agent.")
                
        return None

llm_client = ResilientLLMClient()
