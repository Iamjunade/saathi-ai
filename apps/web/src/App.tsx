import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DemoScenesBar } from './components/DemoScenesBar';
import { HeroVoiceOrb } from './components/HeroVoiceOrb';
import { ActionAuthModal } from './components/ActionAuthModal';
import { AITraceViewer } from './components/AITraceViewer';
import { MedicalTriageCard } from './components/MedicalTriageCard';
import { DisasterEvacuationCard } from './components/DisasterEvacuationCard';
import { CivicComplaintCard } from './components/CivicComplaintCard';
import { VisionOCRCard } from './components/VisionOCRCard';
import { DispatchConfirmation } from './components/DispatchConfirmation';
import { checkBackendHealth, sendOrchestrationRequest } from './services/api';
import type { OrchestratorResponse, InputType } from './types';
import { Volume2, Sparkles, Activity, Shield, AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  const [activeSceneId, setActiveSceneId] = useState<number | null>(null);
  const [inputType, setInputType] = useState<InputType>('voice');
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [orchestrationResult, setOrchestrationResult] = useState<OrchestratorResponse | null>(null);
  const [isTraceOpen, setIsTraceOpen] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDispatched, setIsDispatched] = useState(false);
  const [dispatchedCaseId, setDispatchedCaseId] = useState('');
  const [backendStatus, setBackendStatus] = useState({ online: false, latencyMs: 0 });

  const recognitionRef = useRef<any>(null);

  // Check FastAPI backend health on mount and periodically
  useEffect(() => {
    const checkHealth = async () => {
      const status = await checkBackendHealth();
      setBackendStatus(status);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Web Speech API for voice recognition if available
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Voice synthesis speaker
  const speakVoiceText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Choose natural sounding English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(true);
        // Fallback simulation if mic permissions are blocked
        setTimeout(() => {
          setTranscript("I feel severe chest heaviness and can't breathe");
          setIsListening(false);
        }, 2500);
      }
    }
  };

  const handleOrchestrate = async (content: string, type: InputType = inputType) => {
    if (!content.trim()) return;

    setIsProcessing(true);
    handleStopSpeaking();
    setIsDispatched(false);

    try {
      const result = await sendOrchestrationRequest(content, type);
      setOrchestrationResult(result);

      // Auto-trigger voice narration
      if (result.response_voice_text) {
        speakVoiceText(result.response_voice_text);
      }

      // Check if human-in-the-loop authorization is required
      if (result.requires_authorization) {
        setTimeout(() => {
          setIsAuthModalOpen(true);
        }, 1200);
      }
    } catch (err) {
      console.error('[SAATHI] Orchestration error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectScene = (sceneId: number, promptText: string, type: InputType = 'voice') => {
    setActiveSceneId(sceneId);
    setInputType(type);
    setTranscript(promptText);
    handleOrchestrate(promptText, type);
  };

  const handleAuthorizeAction = () => {
    setIsAuthModalOpen(false);
    setIsDispatched(true);
    const newCaseId = `CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setDispatchedCaseId(newCaseId);

    // Speak authorization confirmation
    speakVoiceText(`Authorization confirmed. Emergency dispatch initiated with reference ID ${newCaseId}.`);
  };

  const handleDeclineAction = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      
      {/* Top Header */}
      <Header
        isBackendOnline={backendStatus.online}
        backendLatency={backendStatus.latencyMs}
        activeIntent={orchestrationResult?.intent}
        onOpenTrace={() => setIsTraceOpen(!isTraceOpen)}
        isTraceOpen={isTraceOpen}
      />

      {/* 4 Jury Demo Scenes Bar */}
      <DemoScenesBar
        onSelectScene={handleSelectScene}
        activeSceneId={activeSceneId}
        disabled={isProcessing}
      />

      {/* Hero Voice Orb Section */}
      <HeroVoiceOrb
        isListening={isListening}
        isProcessing={isProcessing}
        isSpeaking={isSpeaking}
        transcript={transcript}
        onTranscriptChange={setTranscript}
        onToggleListening={handleToggleListening}
        onSubmit={handleOrchestrate}
        onStopSpeaking={handleStopSpeaking}
        inputType={inputType}
        onInputTypeChange={setInputType}
      />

      {/* Dispatch Confirmation Toast if Authorized */}
      {isDispatched && orchestrationResult?.action_payload && (
        <div style={{ maxWidth: '1380px', width: '95%', margin: '0 auto' }}>
          <DispatchConfirmation
            actionPayload={orchestrationResult.action_payload}
            caseId={dispatchedCaseId}
            onClose={() => setIsDispatched(false)}
          />
        </div>
      )}

      {/* Dynamic Intent Result Cards */}
      {orchestrationResult && (
        <main style={{ maxWidth: '1380px', width: '95%', margin: '0 auto' }}>
          
          {/* Medical Triage Result */}
          {orchestrationResult.intent === 'medical' && orchestrationResult.medical_assessment && (
            <MedicalTriageCard
              assessment={orchestrationResult.medical_assessment}
              onRequestDispatch={() => setIsAuthModalOpen(true)}
            />
          )}

          {/* Disaster Evacuation Result */}
          {orchestrationResult.intent === 'disaster' && orchestrationResult.disaster_assessment && (
            <DisasterEvacuationCard
              assessment={orchestrationResult.disaster_assessment}
              onRequestEvacuationAlert={() => setIsAuthModalOpen(true)}
            />
          )}

          {/* Civic Complaint Result */}
          {orchestrationResult.intent === 'civic' && orchestrationResult.civic_assessment && (
            <CivicComplaintCard
              assessment={orchestrationResult.civic_assessment}
            />
          )}

          {/* Vision OCR Result */}
          {orchestrationResult.intent === 'vision' && orchestrationResult.vision_assessment && (
            <VisionOCRCard
              assessment={orchestrationResult.vision_assessment}
              onPlayAudio={() => {
                if (isSpeaking) {
                  handleStopSpeaking();
                } else {
                  speakVoiceText(orchestrationResult.response_voice_text);
                }
              }}
              isSpeaking={isSpeaking}
            />
          )}

        </main>
      )}

      {/* AI Trace Viewer Widget (Grand Reveal) */}
      {isTraceOpen && orchestrationResult?.ai_trace && (
        <AITraceViewer
          steps={orchestrationResult.ai_trace}
          totalLatencyMs={orchestrationResult.latency_total_ms}
        />
      )}

      {/* Action Authorization Modal (Human-in-the-Loop) */}
      <ActionAuthModal
        isOpen={isAuthModalOpen}
        actionPayload={orchestrationResult?.action_payload || null}
        riskLevel={orchestrationResult?.risk_level || 'HIGH'}
        riskScore={orchestrationResult?.risk_score || 0.85}
        onAuthorize={handleAuthorizeAction}
        onDecline={handleDeclineAction}
      />

    </div>
  );
};

export default App;
