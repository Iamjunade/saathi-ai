# 🚀 SAATHI — Meta Minds Team Development Plan & Architecture Guidelines

> **Event:** TechFusion 2026 (24-Hour AI/ML Hackathon)  
> **Team Name:** Meta Minds  
> **Project Name:** SAATHI — Human-Centered Multimodal AI Response Agent  
> **Repository:** [https://github.com/Iamjunade/saathi-ai](https://github.com/Iamjunade/saathi-ai)

---

## 📌 Executive Overview

SAATHI is a multimodal, agentic response platform designed to turn human intent into verified, safe, real-world action. Rather than operating as a standard conversational chatbot, SAATHI handles emergency triage, medical coordination, disaster response, civic complaint processing, and accessibility document understanding through natural voice and vision interaction.

This document serves as the **single source of truth** for all team members (human & AI agents) to ensure parallel development, zero code duplication, zero file collisions, and strict API contracts across the 24-hour hackathon.

---

## 👥 Team Roles & Area Ownership

| Member | GitHub Username | Role | Exclusive Ownership & Directory Boundaries |
| :--- | :--- | :--- | :--- |
| **Mohd Junaid Pasha** | `@Iamjunade` | **Team Leader & Lead Architect** | `apps/web/`, Root Monorepo Config, Multimodal Gateway, Agent Orchestrator UI, AI Trace Viewer, Pitch Deck & Live Demo Script |
| **Muhammad Saif Patel** | `@saifpatel` | **AI / ML Lead** | `services/ai-engine/`, `models/`, Risk Engine, Specialist Agent Prompts, Scikit-Learn/XGBoost Disaster Model, Prompt Guardrails |
| **Mustyala Shiva Sai Tej** | `@saitej0000` | **Full-Stack & Systems Lead** | `services/api/`, `apps/hospital-portal/`, `apps/operations-dash/`, PostgreSQL Schema, WebSockets, Case State Machine |

---

## 📂 Monorepo Folder Architecture & Boundaries

To prevent file collisions and merge conflicts, each team member works **exclusively** within their designated directories:

```
saathi-ai/
├── apps/
│   ├── web/                 # [OWNER: Junaid Pasha] Next.js Main Voice UI & AI Trace Viewer
│   ├── hospital-portal/     # [OWNER: Shiva Sai Tej] Next.js Hospital Emergency Intake App
│   └── operations-dash/     # [OWNER: Shiva Sai Tej] Next.js Live Incident Map & Ops Dashboard
├── services/
│   ├── api/                 # [OWNER: Shiva Sai Tej] Express/NestJS Backend, PostgreSQL & WebSockets
│   └── ai-engine/           # [OWNER: Saif Patel] Python FastAPI AI Engine, Risk Engine & ML Models
├── packages/
│   └── shared-types/        # [SHARED] TypeScript types, JSON Schemas & API Data Contracts
├── models/                  # [OWNER: Saif Patel] Trained ML Models & Datasets
├── TEAM_DEVELOPMENT_PLAN.md # Team Workflow & Master Guide (This document)
└── README.md
```

---

## 🌿 Git Branching Strategy & Workflow Rules

### Branch Naming Scheme
- `main` — **Protected Demo Branch**. Only merge fully tested PRs.
- `feat/orchestrator` — **Junaid's Branch** (Voice UI, Gateway, Agent Routing)
- `feat/ml-risk-agents` — **Saif's Branch** (Python FastAPI AI Engine, ML Models, Risk Policies)
- `feat/backend-cases-db` — **Shiva's Branch** (Node API, DB Migrations, WebSockets, Dashboards)

### Strict Workflow Rules for Human & AI Agents:
1. **Never commit directly to `main`**. Always work inside your assigned feature branch.
2. **Do NOT modify files outside your directory ownership** without prior team lead approval.
3. Shared API types or schemas must be edited inside `packages/shared-types/` and communicated to the team.
4. Test endpoints locally before opening a Pull Request to `main`.

---

## ⏱️ 24-Hour Master Development Timeline

```
[00:00 - 02:00] Phase 1: Environment Setup, DB Schema & API Contracts Baseline
[02:00 - 05:00] Phase 2: Core Platform Loop (First End-to-End Voice Flow Working)
[05:00 - 08:00] Phase 3: Medical Coordination Emergency Workflow
[08:00 - 12:00] Phase 4: Disaster ML Model & Safe Route Mapping Workflow
[12:00 - 15:00] Phase 5: Civic Complaint NLP & Accessibility Vision Workflows
[15:00 - 18:00] Phase 6: Dashboards (Emergency Ops Map, Hospital Intake & AI Trace)
[18:00 - 21:00] Phase 7: Full System Integration, WebSockets & Follow-up Agent Loop
[21:00 - 22:00] Phase 8: Failure Mode Testing, Latency Optimization & Demo Rehearsal
[22:00 - 23:00] Phase 9: Feature Freeze (UI Styling & Copy Polish Only)
[23:00 - 24:00] Phase 10: Pitch Presentation & Live Demo Execution
```

---

## 🔌 Service Communication & API Data Contracts

### 1. AI Orchestrator API (`services/ai-engine/`)
`POST /api/ai/orchestrate`
```json
// Input Payload
{
  "user_id": "usr_1029",
  "input_type": "voice" | "text" | "vision",
  "input_content": "I feel a severe heaviness in my chest and can't breathe properly",
  "user_location": { "lat": 17.3850, "lng": 78.4867 }
}

// Response Payload
{
  "intent": "medical",
  "risk_score": 0.92,
  "risk_level": "CRITICAL",
  "requires_authorization": true,
  "action_payload": {
    "action_type": "contact_hospital",
    "target": "Apollo Emergency Triage",
    "data_shared": ["name", "symptoms", "location"]
  },
  "response_voice_text": "I understand you are experiencing severe chest heaviness. I have identified nearby emergency triage. I need your permission to share your location and contact Apollo Emergency Triage immediately."
}
```

### 2. Case Management API (`services/api/`)
`POST /api/cases`
```json
// State Machine Flow
CREATED -> ASSESSING -> AWAITING_USER -> AUTHORIZED -> ACTION_EXECUTING -> ACTION_COMPLETED -> FOLLOW_UP -> RESOLVED
```

---

## 🤖 Context & Prompts for AI Agents Working on This Repository

If an AI Agent is initialized by any team member, provide the corresponding instruction block below:

### 1️⃣ Prompt for Junaid's AI Agent (`Team Lead / Frontend Orchestrator`):
```markdown
You are working on branch `feat/orchestrator` in `apps/web/`. Your task is to build the primary voice-first user interface with the "Talk to SAATHI" trigger, Action Authorization Modal, and AI Trace Viewer widget. You consume APIs from `services/ai-engine/` and `services/api/`. Do not modify backend or python files directly.
```

### 2️⃣ Prompt for Saif's AI Agent (`AI / ML Lead`):
```markdown
You are working on branch `feat/ml-risk-agents` inside `services/ai-engine/` and `models/`. Your task is to build the Python FastAPI AI services, Risk Engine (`risk_engine.py`), Scikit-Learn/XGBoost Disaster Risk Model (`models/disaster_model.py`), specialist agent prompts (Medical, Disaster, Civic, Vision), and prompt guardrails.
```

### 3️⃣ Prompt for Sai Tej's AI Agent (`Full-Stack & Systems Lead`):
```markdown
You are working on branch `feat/backend-cases-db` inside `services/api/`, `apps/hospital-portal/`, and `apps/operations-dash/`. Your task is to build the PostgreSQL database schema/migrations, Node.js/Express REST & WebSocket APIs, Case State Machine engine, Hospital Intake Web App, and Emergency Operations Dashboard with live incident map.
```

---

## 🎬 Live Jury Demo Script (4 Core Scenes)

1. **Scene 1 (Medical Triage)**: User speaks urgent chest symptoms → SAATHI assesses high risk → identifies nearby hospital → requests user authorization → triggers simulated hospital intake on **Hospital Portal**.
2. **Scene 2 (Disaster Flood Risk)**: User reports rising flood water → SAATHI queries ML disaster risk model using location → renders safe route & shelter map on **Operations Dashboard**.
3. **Scene 3 (Civic Complaint)**: User speaks about uncollected garbage → SAATHI classifies department → drafts structured case → outputs reference tracking ID (`CIVIC-2026-8941`).
4. **Scene 4 (Accessibility / Vision)**: User uploads document image → SAATHI OCR simplifies text → speaks natural summary to user.
5. **The Grand Reveal**: Show the **AI Trace Viewer** & **Emergency Operations Map**, proving all 4 scenes run on one single Agentic Platform.