# 🚀 SAATHI — Human-Centered Multimodal AI Response Agent

> **TechFusion 2026 Hackathon | Team Meta Minds**  
> Turning Human Intent into Verified, Safe, Real-World Action.

---

## 🌟 Overview

**SAATHI** is an autonomous, multimodal agentic emergency and civic triage platform. Unlike typical conversational chatbots, SAATHI combines real-time voice, vision OCR, automated risk assessment, specialist agent coordination, and explicit human-in-the-loop authorization gates to handle critical real-world situations:

1. 🚑 **Medical Emergency Triage** — Real-time symptom severity analysis, instant first-aid guidance, and automated pre-arrival hospital handover.
2. 🌊 **Disaster & Flood Evacuation** — ML-driven geospatial risk prediction with live safe-corridor evacuation and shelter routing.
3. 🏛️ **Civic Grievance Intelligence** — Natural voice-to-structured complaint classification, department routing, priority SLAs, and reference tracking IDs.
4. 📄 **Multimodal Vision & Accessibility** — Bureaucratic document / medical prescription OCR simplification into crystal-clear natural audio.
5. 🔍 **AI Trace Viewer** — 100% transparent live execution trace showing Agent thoughts, tool calls, risk computations, and guardrail verdicts.

---

## 📁 Repository Structure

```
saathi-ai/
├── apps/
│   ├── web/                 # [Junaid] Next.js Main Voice UI & AI Trace Viewer
│   ├── hospital-portal/     # [Shiva] Next.js Hospital Emergency Intake App
│   └── operations-dash/     # [Shiva] Next.js Live Incident Map & Ops Dashboard
├── services/
│   ├── api/                 # [Shiva] Express/NestJS Backend, PostgreSQL & WebSockets
│   └── ai-engine/           # [Saif] Python FastAPI AI Engine, Risk Engine & ML Models
├── packages/
│   └── shared-types/        # [SHARED] TypeScript types, JSON Schemas & API Contracts
├── models/                  # [Saif] Trained ML Models, Training & Evaluation Pipelines
├── TEAM_DEVELOPMENT_PLAN.md # Master Architecture & Collaboration Guidelines
└── README.md
```

---

## ⚡ Quick Start — AI Engine (`services/ai-engine/`)

### 1. Requirements
- Python 3.10+
- Dependencies listed in `services/ai-engine/requirements.txt`

### 2. Install & Run
```bash
# Navigate to ai-engine
cd services/ai-engine

# Install dependencies
pip install -r requirements.txt

# Start FastAPI AI Engine (Runs on http://localhost:8000)
python run_server.py
```

### 3. Interactive API Docs
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- OpenAPI JSON: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

---

## 🔬 Disaster Risk ML Model (`models/`)

To train or evaluate the disaster flood risk prediction model:
```bash
# Train the model
python models/train_disaster_model.py

# Evaluate model metrics and accuracy
python models/evaluate_disaster_model.py
```

---

## 🛡️ Key ML & AI Components

- **Multi-Factor Risk Engine (`risk_engine.py`)**: Computes real-time risk scores ($0.0 - 1.0$) and categorizes them into `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- **Specialist Agent Supervisors (`app/agents/`)**: Medical, Disaster, Civic, and Vision specialist agents coordinated by the master Orchestrator.
- **Prompt & Safety Guardrails (`guardrails.py`)**: Anti-jailbreak defenses, PII masking, safety bounds, and emergency medical disclaimers.
- **Explainable AI Trace**: Transparent step-by-step reasoning outputs streamed to the UI trace visualizer.
