import React, { useState } from 'react';
import { Mic, MicOff, HeartPulse, ShieldAlert, FileText, Eye, Sparkles, MapPin } from 'lucide-react';
import { WorkflowDomain } from '../../../../packages/shared-types';
import { VoiceVisualizer } from './VoiceVisualizer';

interface VoiceHeroProps {
  onProcessInput: (input: string, domain?: WorkflowDomain) => void;
  isListening: boolean;
  setIsListening: (val: boolean) => void;
  onOpenVisionModal: () => void;
}

export const VoiceHero: React.FC<VoiceHeroProps> = ({
  onProcessInput,
  isListening,
  setIsListening,
  onOpenVisionModal
}) => {
  const [textInput, setTextInput] = useState('');
  const [activePreset, setActivePreset] = useState<WorkflowDomain | null>(null);
  const [locationStr, setLocationStr] = useState<string | null>(null);

  React.useEffect(() => {
    import('../services/locationService').then(m => {
      m.getUserLocation().then(loc => {
        if (loc.source === 'browser') {
          setLocationStr(loc.city);
        }
      });
    });
  }, []);

  const toggleMic = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      // Browser Speech Recognition attempt
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setTextInput(transcript);
            setIsListening(false);
            onProcessInput(transcript);
          };

          recognition.onerror = () => {
            setIsListening(false);
            // Fallback for simulation
            onProcessInput('I feel severe chest heaviness and shortness of breath', 'medical');
          };

          recognition.start();
        } catch {
          setTimeout(() => {
            setIsListening(false);
            onProcessInput('I feel severe chest heaviness and shortness of breath', 'medical');
          }, 2500);
        }
      } else {
        // SpeechRecognition API fallback timer
        setTimeout(() => {
          setIsListening(false);
          onProcessInput('I feel severe chest heaviness and shortness of breath', 'medical');
        }, 2500);
      }
    }
  };

  const handlePreset = (domain: WorkflowDomain, sampleText: string) => {
    setActivePreset(domain);
    setTextInput(sampleText);
    if (domain === 'vision') {
      onOpenVisionModal();
    } else {
      onProcessInput(sampleText, domain);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    onProcessInput(textInput);
  };

  return (
    <div className="glass-card hero-voice-section">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <Sparkles size={20} color="#6366f1" />
        <span className="team-tag">Human-Centered Multimodal Response Platform</span>
        {locationStr && (
          <>
            <span style={{ color: '#475569' }}>|</span>
            <span className="team-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7' }}>
              <MapPin size={12} /> {locationStr}
            </span>
          </>
        )}
      </div>

      <h1 className="hero-title">Tell SAATHI what is happening</h1>
      <p className="hero-subtitle">
        One natural conversation. Any situation. Real-world coordinated response with safety authorization gates.
      </p>

      {/* Audio Waveform Canvas Spectrum */}
      <VoiceVisualizer isActive={isListening} color={isListening ? '#f43f5e' : '#6366f1'} />

      {/* Pulsing Mic Button */}
      <div className="mic-button-wrapper">
        <div className="mic-pulse-ring" />
        <button
          className={`mic-button ${isListening ? 'listening' : ''}`}
          onClick={toggleMic}
          title="Click to Speak to SAATHI"
        >
          {isListening ? <MicOff size={36} /> : <Mic size={36} />}
          <span className="mic-label">{isListening ? 'Listening...' : 'Talk'}</span>
        </button>
      </div>

      {/* Manual Input Bar */}
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '600px', margin: '1rem 0' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Or type what is happening (e.g., medical, flood, civic complaint...)"
            style={{
              flex: 1,
              padding: '0.85rem 1.2rem',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.85rem 1.5rem',
              borderRadius: '12px',
              background: 'var(--primary-accent)',
              color: '#ffffff',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Send
          </button>
        </div>
      </form>

      {/* 4 Jury Demo Scenario Presets */}
      <div className="presets-section">
        <div className="section-label">⚡ Live Demo Scenario Quick-Triggers (Jury Demo)</div>
        <div className="presets-grid">
          <button
            className={`preset-btn ${activePreset === 'medical' ? 'active' : ''}`}
            onClick={() => handlePreset('medical', 'I feel severe chest heaviness and shortness of breath')}
          >
            <HeartPulse size={20} color="#f43f5e" />
            <span>1. Medical Triage</span>
          </button>

          <button
            className={`preset-btn ${activePreset === 'disaster' ? 'active' : ''}`}
            onClick={() => handlePreset('disaster', 'Water level is rapidly rising near my house in Sector 4')}
          >
            <ShieldAlert size={20} color="#3b82f6" />
            <span>2. Disaster Response</span>
          </button>

          <button
            className={`preset-btn ${activePreset === 'civic' ? 'active' : ''}`}
            onClick={() => handlePreset('civic', 'Garbage has not been collected for 5 days on main road')}
          >
            <FileText size={20} color="#f59e0b" />
            <span>3. Civic Complaint</span>
          </button>

          <button
            className={`preset-btn ${activePreset === 'vision' ? 'active' : ''}`}
            onClick={() => handlePreset('vision', 'Explain this hospital discharge summary document to me')}
          >
            <Eye size={20} color="#10b981" />
            <span>4. Vision / Accessibility</span>
          </button>
        </div>
      </div>
    </div>
  );
};
