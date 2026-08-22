"""
SAATHI AI Engine - FastAPI Application Entry Point
"""

import sys
import os

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.router import router as api_router

app = FastAPI(
    title="SAATHI AI Engine",
    description="Multimodal Agentic Response Platform - Emergency Triage, Disaster ML, Civic NLP, & Vision OCR",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for all frontend apps and backend microservices
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_PREFIX, tags=["AI Engine"])

@app.get("/health", tags=["System"])
async def root_health():
    return {
        "status": "online",
        "service": "SAATHI AI Engine",
        "version": "1.0.0",
        "endpoints": [
            "/api/ai/orchestrate",
            "/api/ai/disaster-risk",
            "/api/ai/medical-triage",
            "/api/ai/civic-classify",
            "/api/ai/vision-ocr",
            "/api/ai/health"
        ]
    }

@app.get("/", tags=["System"])
async def root():
    return {
        "message": "SAATHI Multimodal AI Response Engine is running.",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
