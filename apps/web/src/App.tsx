import React, { useState, useEffect } from 'react';
import './App.css';
import { VoiceHero } from './components/VoiceHero';
import { AITraceViewer } from './components/AITraceViewer';
import { CaseTimeline } from './components/CaseTimeline';
import { AuthorizationModal } from './components/AuthorizationModal';
import { VisionUpload } from './components/VisionUpload';
import { DisasterMap } from './components/DisasterMap';
import { processUserInput } from './services/mockApiService';
import { createConsentRecord } from './services/consentManager';
import { defaultFollowUpEngine } from './services/followUpEngine';
import { ActionPayload, CaseRecord, TraceStep, WorkflowDomain } from '../../../packages/shared-types';
import { ShieldCheck, Radio, Server, Layers } from 'lucide-react';

export const App: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const [currentCase, setCurrentCase] = useState<CaseRecord | null>(null);
  const [pendingAction, setPendingAction] = useState<ActionPayload | null>(null);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);

  const [showVisionModal, setShowVisionModal] = useState(false);
  const [showDisasterMap, setShowDisasterMap] = useState(false);

  const [aiEngineStatus, setAiEngineStatus] = useState<'Mock' | 'Connected'>('Mock');
  const [nodeApiStatus, setNodeApiStatus] = useState<'Mock' | 'Connected'>('Mock');

  // Auto-detect when Saif's AI Engine (:8000) or Shiva's Node API (:5000) come online
  useEffect(() => {
    // Prime the location service early (prompts user for permission)
    import('./services/locationService').then(m => m.getUserLocation());

    const checkServices = async () => {
      try {
        const aiRes = await fetch('http://localhost:8000/health', { signal: AbortSignal.timeout(1000) });
        if (aiRes.ok) setAiEngineStatus('Connected');
      } catch {
        setAiEngineStatus('Mock');
      }

      try {
        const apiRes = await fetch('http://localhost:5000/health', { signal: AbortSignal.timeout(1000) });
        if (apiRes.ok) setNodeApiStatus('Connected');
      } catch {
        setNodeApiStatus('Mock');
      }
    };

    checkServices();
    const interval = setInterval(checkServices, 5000);
    return () => clearInterval(interval);
  }, []);

  const speakVoice = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume(); // Fix Chrome silent pause bug

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Select natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('David')));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleProcessInput = async (input: string, domainOverride?: WorkflowDomain) => {
    setSystemMessage('Processing natural language input through Agent Orchestrator...');
    const result = await processUserInput(input, domainOverride);

    setTraceSteps(result.traceSteps);
    setSystemMessage(result.voiceResponse);
    speakVoice(result.voiceResponse);

    if (result.assessment.intent === 'disaster') {
      setShowDisasterMap(true);
    } else {
      setShowDisasterMap(false);
    }

    if (result.assessment.requiresAuthorization && result.assessment.recommendedAction) {
      setPendingAction(result.assessment.recommendedAction);
    }

    const newCase: CaseRecord = {
      id: `CASE-${Math.floor(100000 + Math.random() * 900000)}`,
      domain: result.assessment.intent,
      status: result.assessment.requiresAuthorization ? 'AWAITING_USER' : 'ACTION_EXECUTING',
      riskLevel: result.assessment.riskLevel,
      summary: result.assessment.summary,
      createdAt: new Date().toLocaleTimeString(),
      updatedAt: new Date().toLocaleTimeString(),
      actions: result.assessment.recommendedAction ? [result.assessment.recommendedAction] : [],
      trace: result.traceSteps,
      followUpMessage: 'SAATHI will monitor this case and check for resolution in 5 minutes.'
    };

    setCurrentCase(newCase);
  };

  const handleApproveAction = () => {
    if (!pendingAction || !currentCase) return;
    const approvalTimestamp = new Date().toISOString().substring(11, 19);

    const updatedSteps: TraceStep[] = [
      ...traceSteps.map((step) =>
        step.stage === 'TOOL_EXECUTION' ? { ...step, status: 'success' as const } : step
      ),
      {
        id: 'step-5',
        timestamp: approvalTimestamp,
        stage: 'APPROVAL',
        label: 'Human Authorization Explicitly Granted',
        details: `Consent Token Granted for ${pendingAction.actionType}`,
        status: 'success'
      },
      {
        id: 'step-6',
        timestamp: approvalTimestamp,
        stage: 'OUTCOME',
        label: 'Action Verified & Executed Successfully',
        details: `Result returned from ${pendingAction.targetProvider}`,
        status: 'success'
      }
    ];

    // Save consent record (PRD §37)
    createConsentRecord(
      'USER-9842',
      pendingAction.description,
      pendingAction.dataShared,
      pendingAction.targetProvider,
      currentCase.id
    );

    // Schedule Follow-Up (PRD §49)
    const followUpPlan = defaultFollowUpEngine.generateFollowUp(currentCase);
    setTimeout(() => {
      setSystemMessage(`Follow-up Check: ${followUpPlan.message}`);
      speakVoice(`Follow-up Check: ${followUpPlan.message}`);
      
      setTraceSteps(prev => [
        ...prev,
        {
          id: `step-followup-${Date.now()}`,
          timestamp: new Date().toISOString().substring(11, 19),
          stage: 'OUTCOME',
          label: 'Proactive Follow-up Executed',
          details: followUpPlan.message,
          status: 'pending'
        }
      ]);
    }, followUpPlan.checkInDelayMs > 60000 ? 5000 : followUpPlan.checkInDelayMs); // For demo purposes, shorten long delays to 5 seconds

    setTraceSteps(updatedSteps);
    setCurrentCase({
      ...currentCase,
      status: 'ACTION_COMPLETED',
      trace: updatedSteps,
      followUpMessage: followUpPlan.message
    });

    setPendingAction(null);
    const confirmMsg = 'Action authorized. SAATHI has verified transmission. Case is now being tracked.';
    setSystemMessage(confirmMsg);
    speakVoice(confirmMsg);
  };

  const handleDeclineAction = () => {
    setPendingAction(null);
    if (currentCase) {
      setCurrentCase({
        ...currentCase,
        status: 'ACTION_FAILED',
        followUpMessage: 'Action was declined by user. Conservative safety mode activated.'
      });
    }
    const declineMsg = 'Action declined. No data was shared with third parties.';
    setSystemMessage(declineMsg);
    speakVoice(declineMsg);
  };

  return (
    <div className="app-container">
      {/* App Top Navbar */}
      <header className="app-header">
        <div className="logo-brand">
          <ShieldCheck size={32} color="#6366f1" />
          <span>
            SAATHI <span className="logo-badge">AI</span>
          </span>
          <span className="team-tag">Meta Minds</span>
        </div>

        <div className="live-status">
          <div className="pulse-dot" />
          <span>Orchestrator: Ready</span>
          <span style={{ color: '#475569', margin: '0 0.5rem' }}>|</span>
          <Server size={16} color={aiEngineStatus === 'Connected' ? '#10b981' : '#f59e0b'} />
          <span>AI Engine ({aiEngineStatus})</span>
          <span style={{ color: '#475569', margin: '0 0.5rem' }}>|</span>
          <Layers size={16} color={nodeApiStatus === 'Connected' ? '#10b981' : '#f59e0b'} />
          <span>Node API ({nodeApiStatus})</span>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="main-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <VoiceHero
            onProcessInput={handleProcessInput}
            isListening={isListening}
            setIsListening={setIsListening}
            onOpenVisionModal={() => setShowVisionModal(true)}
          />

          {systemMessage && (
            <div className="glass-card" style={{ borderLeft: '4px solid var(--primary-accent)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--primary-accent)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Radio size={14} color="#6366f1" />
                SAATHI Voice Assistant Output
              </div>
              <div style={{ fontSize: '1.05rem', color: '#f8fafc', marginTop: '0.4rem', lineHeight: '1.5' }}>
                "{systemMessage}"
              </div>
            </div>
          )}

          {showDisasterMap && <DisasterMap />}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <CaseTimeline currentCase={currentCase} />
          <AITraceViewer steps={traceSteps} />
        </div>
      </div>

      {/* Security Authorization Modal */}
      {pendingAction && (
        <AuthorizationModal
          action={pendingAction}
          onApprove={handleApproveAction}
          onDecline={handleDeclineAction}
        />
      )}

      {/* Multimodal Vision & Document OCR Modal */}
      {showVisionModal && (
        <VisionUpload
          onAnalyze={(desc) => handleProcessInput(desc, 'vision')}
          onClose={() => setShowVisionModal(false)}
        />
      )}
    </div>
  );
};

export default App;
