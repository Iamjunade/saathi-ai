# Pull Request: SAATHI AI Engine, Deterministic Risk Engine & Multi-Modal Routing

**PR Title**: `feat(ai-engine): add FastAPI orchestrator, deterministic risk engine, vision-explain, and Rule 1 medical safety guardrails`  
**Base Branch**: `main`  
**Compare Branch**: `feat/ml-risk-agents`  
**Author**: Muhammad Saif Patel (AI/ML Lead)  
**Reviewer**: Junaid (`@Iamjunade`)  
**GitHub PR URL**: [Create Pull Request on GitHub](https://github.com/Iamjunade/saathi-ai/compare/main...feat/ml-risk-agents?expand=1)

---

## 🎯 Overview & Objectives
This PR delivers the complete AI Intelligence and Machine Learning subsystem for Project SAATHI (24-hour hackathon, TechFusion 2026). It sets up the high-performance Python FastAPI service, the deterministic emergency risk calculation engine, Scikit-Learn flood ML models, OCR document simplification, and strict medical ethics guardrails.

---

## 🚀 What's Included in this PR

### 1. Python FastAPI AI Service (`services/ai-engine/`)
- **`POST /api/ai/orchestrate`**: Primary multimodal gateway (voice / text / vision). Handles intent routing, input safety checks, domain specialist execution, multi-factor risk computation, authorization gating, and step-by-step transparent AI trace generation.
- **`POST /api/ai/risk-eval`**: Standalone deterministic emergency risk evaluation endpoint.
- **`POST /api/ai/vision-explain`**: OCR parsing and plain-language voice explanation synthesis for documents/prescriptions.
- **`POST /api/ai/disaster-risk`**: Scikit-Learn flood model inference with safe evacuation corridors and relief shelter routing.
- **`POST /api/ai/medical-triage`**: Urgent clinical symptom triage and hospital pre-arrival handover packet generator.
- **`POST /api/ai/civic-classify`**: Municipal grievance NLP classifier, SLA calculator, and tracking reference generator (`CIVIC-2026-XXXX`).
- **`GET /api/ai/health`**: Comprehensive health check and model loading verification.

### 2. Deterministic Emergency Risk Engine (`app/risk_engine.py`)
- **Safety Rule 1 (Mandatory Medical Guardrail)**: LLMs and AI models are strictly blocked from diagnosing medical diseases or prescribing treatments. Scope is strictly restricted to clinical symptom severity scoring, urgency triage classification (`IMMEDIATE`, `URGENT`, `STANDARD`, `NON_URGENT`), first-aid instructions, and hospital dispatch handovers.
- **Standardized Response Contract**:
  ```json
  {
    "intent": "medical",
    "risk_score": 0.94,
    "risk_level": "CRITICAL",
    "requires_authorization": true,
    "recommended_action": "search_and_contact_hospital",
    "confidence": 0.94
  }
  ```

### 3. ML Disaster Model & Saved Binaries (`models/`)
- **Trained Model**: `models/disaster_risk_model.joblib` (Gradient Boosting Regressor + Random Forest Classifier, 1.4 MB).
- **Inference Engine**: `models/disaster_model.py` with dynamic evacuation waypoints, relief shelter database, and physics-based fallback heuristics.
- **Training & Evaluation**: `models/train_disaster_model.py`, `models/evaluate_disaster_model.py`.

### 4. Shared Types & Data Contracts (`packages/shared-types/`)
- TypeScript interfaces in `index.ts`: `RiskEvalRequest`, `RiskEvalResponse`, `VisionExplainRequest`, `VisionExplainResponse`, `OrchestratorResponse`, `DisasterAssessment`, `MedicalAssessment`, `CivicAssessment`, `VisionAssessment`.
- JSON schema in `schemas/ai-contract.json`.

---

## 🧪 Automated Test Verification

All 12 test suites in `services/ai-engine/tests/test_orchestrator.py` pass with 100% success:

```bash
tests/test_orchestrator.py::test_root_health PASSED                      [  8%]
tests/test_orchestrator.py::test_scene_1_medical_triage PASSED           [ 16%]
tests/test_orchestrator.py::test_scene_2_disaster_flood_risk PASSED      [ 25%]
tests/test_orchestrator.py::test_scene_3_civic_complaint PASSED          [ 33%]
tests/test_orchestrator.py::test_scene_4_vision_accessibility PASSED     [ 41%]
tests/test_orchestrator.py::test_prompt_guardrails_injection_defense PASSED [ 50%]
tests/test_orchestrator.py::test_dedicated_disaster_risk_endpoint PASSED [ 58%]
tests/test_orchestrator.py::test_endpoint_risk_eval_medical PASSED       [ 66%]
tests/test_orchestrator.py::test_endpoint_risk_eval_disaster PASSED      [ 75%]
tests/test_orchestrator.py::test_endpoint_risk_eval_civic PASSED         [ 83%]
tests/test_orchestrator.py::test_endpoint_vision_explain PASSED          [ 91%]
tests/test_orchestrator.py::test_safety_rule_1_medical_non_diagnosis PASSED [100%]

======================= 12 passed, 17 warnings in 4.74s =======================
```

---

## 🔌 Integration Instructions for Team

### How to Run FastAPI Service Locally
```bash
cd services/ai-engine
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Interactive Swagger API Docs: `http://localhost:8000/docs`
- Redoc Documentation: `http://localhost:8000/redoc`

### Monorepo Boundaries Maintained
- Only modified files inside `services/ai-engine/`, `models/`, and `packages/shared-types/`.
- Zero changes to `apps/web/`, `apps/hospital-portal/`, `apps/operations-dash/`, or `services/api/`.
