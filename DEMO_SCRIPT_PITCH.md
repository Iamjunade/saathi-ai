# 🎤 SAATHI — 24-Hour Hackathon Live Jury Demo & Pitch Script

> **Event:** TechFusion 2026  
> **Team:** Meta Minds  
> **Presenter:** Mohd Junaid Pasha (Team Leader) & Muhammad Saif Patel (AI/ML Lead)  
> **Live Demo URL:** `http://localhost:3000`  
> **API Docs URL:** `http://localhost:8000/docs`  

---

## 🌟 60-Second Opening Hook

> *"Distinguished Jury Members, when a citizen faces a sudden heart attack, an unexpected flash flood, or a municipal hazard, they don't have time to navigate 10 different apps, fill out complex bureaucratic forms, or chat with a generic LLM chatbot that hallucinates dangerous medical advice.*
> 
> *Today, we introduce **SAATHI** — India's first Multimodal Agentic Response Platform that turns natural human voice and vision intent into **verified, safe, real-world action** in under 50 milliseconds."*

---

## 🎬 4-Part Live Demo Walkthrough

### 🔴 Scene 1: Critical Medical Emergency & Human-in-the-Loop Triage (2 mins)
1. **User Action**: Click the glowing Voice Orb or Scene 1 Preset:  
   *"I feel a severe heaviness in my chest and can't breathe properly."*
2. **SAATHI Response**:
   - **Voice Output**: Speaks immediate stabilization first aid.
   - **Safety Rule 1 Guardrail**: Demonstrates that SAATHI **does not diagnose disease**, but computes clinical symptom severity (`IMMEDIATE / CODE_RED_CARDIAC`).
   - **Action Authorization Modal**: Shows target (`Apollo Emergency Triage`), data to be transmitted (`GPS Location, Symptoms`), and prompts citizen authorization before dispatching.
   - **Hospital Handover**: Generates geocoded pre-arrival emergency packet with ETA (6 mins) and ICU availability.

---

### 🌊 Scene 2: Disaster Flood Alert & Safe Evacuation Mapping (2 mins)
1. **User Action**: Click Scene 2 Preset:  
   *"Water is rising rapidly outside my house, flood is entering the ground floor."*
2. **SAATHI Response**:
   - **Machine Learning**: Executes trained Gradient Boosting flood risk model with rainfall, elevation, and canal proximity indicators.
   - **Risk Gauge**: Outputs `0.88 (CRITICAL RISK)`.
   - **Safe Route Corridor**: Maps step-by-step elevated waypoints avoiding submerged canals.
   - **High-Ground Shelters**: Displays nearby relief shelters (e.g., *Banjara Hills Community Center, 542m elevation, 320 capacity*).

---

### 🏛️ Scene 3: Civic Grievance & SLA Tracking (90 secs)
1. **User Action**: Click Scene 3 Preset:  
   *"The municipal garbage truck hasn't come for a week and trash is overflowing near the main market on Station Road."*
2. **SAATHI Response**:
   - **NLP Routing**: Classifies department to `Solid Waste & Sanitation Department`.
   - **SLA Commitment**: Assigns `24-Hour SLA`.
   - **Official Ticket**: Issues reference ID (`CIVIC-2026-8941`) and prepares departmental compactor dispatch.

---

### 📄 Scene 4: Vision & Accessibility Document Simplifier (90 secs)
1. **User Action**: Click Scene 4 Preset or upload a medical prescription / tax notice.
2. **SAATHI Response**:
   - **OCR Extraction**: Parses complex prescription structures (`Amoxicillin 500mg`).
   - **Audio Explanation**: Speaks plain-language dosage instructions in natural audio.
   - **Action Checklist**: Generates clear reminders for citizen convenience.

---

### 🔍 The Grand Reveal: The AI Trace Viewer
- Open the **AI Agent Trace & Multi-Modal Execution Inspector**:
  - Show the 5 discrete agentic stages:
    1. `GUARDRAIL_CHECK` (Injection defense, PII redaction)
    2. `INTENT_CLASSIFICATION` (Voice acoustics & NLP intent)
    3. `SPECIALIST_ROUTING` (Sub-agent delegation)
    4. `RISK_ASSESSMENT` (Clinical NLP + ML model calculation)
    5. `ACTION_SYNTHESIS` (Phonetic voice script synthesis)
  - Show the lightning-fast sub-50ms execution speed, proving this is a production-grade multi-agent platform, not a sluggish chatbot wrapper!

---

## 🏆 Key Differentiators & Jury Winning Points
1. **Zero Hallucination / Rule 1 Guardrail**: Ethical, legally compliant clinical safety.
2. **Human-in-the-Loop Gating**: Explicit authorization modal before external dispatch.
3. **True Multimodal**: Voice (Speech-to-Text & Text-to-Speech) + Vision (Document OCR).
4. **Scikit-Learn ML Integration**: Real mathematical models for environmental flood prediction.
5. **Full Transparency**: Step-by-step AI trace logging for enterprise audits.
