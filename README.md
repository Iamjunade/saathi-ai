# 🤖 SAATHI — Human-Centered Multimodal AI Response Agent

> **Team Meta Minds** | TechFusion 2026 Hackathon  
> *"Tell us what is happening. We'll help with what happens next."*

---

## 📑 Quick Navigation & AI Agent Guide

If you are a human developer or an AI assistant joining this project, please consult our master architecture and team workflow document first:

👉 **[Read TEAM_DEVELOPMENT_PLAN.md](./TEAM_DEVELOPMENT_PLAN.md)**

---

## 👥 Team & Role Distribution

- **Mohd Junaid Pasha** (`@Iamjunade`) — Team Leader & Lead Architect (`apps/web/`, Voice Gateway, Agent Orchestrator, AI Trace Viewer)
- **Muhammad Saif Patel** — AI / ML Lead (`services/ai-engine/`, ML Risk Engine, Specialist Agents, Disaster Models)
- **Mustyala Shiva Sai Tej** — Full-Stack / Systems Lead (`services/api/`, `apps/hospital-portal/`, `apps/operations-dash/`, Postgres DB, State Machine)

---

## 📁 Repository Structure

```
saathi-ai/
├── apps/
│   ├── web/                 # Main Voice UI & AI Trace Viewer (Junaid Pasha)
│   ├── hospital-portal/     # Hospital Triage & Intake Dashboard (Shiva Sai Tej)
│   └── operations-dash/     # Emergency Ops & Incident Map Dashboard (Shiva Sai Tej)
├── services/
│   ├── api/                 # Node.js/Express Backend API & Database (Shiva Sai Tej)
│   └── ai-engine/           # Python FastAPI AI Engine & ML Models (Saif Patel)
├── packages/
│   └── shared-types/        # Shared TypeScript interfaces & API Contracts
├── models/                  # ML Models & Dataset Training Scripts (Saif Patel)
└── TEAM_DEVELOPMENT_PLAN.md # Master 24-Hour Plan & AI Agent Instructions
```
