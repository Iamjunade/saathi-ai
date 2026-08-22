import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Image as ImageIcon, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import type { InputType } from '../types';

interface HeroVoiceOrbProps {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string;
  onTranscriptChange: (text: string) => void;
  onToggleListening: () => void;
  onSubmit: (content: string, type: InputType) => void;
  onStopSpeaking: () => void;
  inputType: InputType;
  onInputTypeChange: (type: InputType) => void;
}

export const HeroVoiceOrb: React.FC<HeroVoiceOrbProps> = ({
  isListening,
  isProcessing,
  isSpeaking,
  transcript,
  onTranscriptChange,
  onToggleListening,
  onSubmit,
  onStopSpeaking,
  inputType,
  onInputTypeChange
}) => {
  const [typedInput, setTypedInput] = useState('');

  useEffect(() => {
    if (transcript) {
      setTypedInput(transcript);
    }
  }, [transcript]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = typedInput.trim() || transcript.trim();
    if (!content) return;
    onSubmit(content, inputType);
  };

  const getStatusText = () => {
    if (isProcessing) return 'ANALYZING & REASONING (AGENT PIPELINE)...';
    if (isListening) return 'LISTENING... (SPEAK CLEARLY)';
    if (isSpeaking) return 'SAATHI IS SPEAKING...';
    return 'CLICK THE ORB OR TYPE TO ACTIVATE SAATHI';
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '1380px', width: '95%', margin: '0 auto 24px auto', padding: '32px 24px', textAlign: 'center' }}>
      
      {/* Mode Switcher Tabs */}
      <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.06)', padding: '4px', borderRadius: 'var(--radius-full)', marginBottom: '28px' }}>
        <button
          onClick={() => onInputTypeChange('voice')}
          className="btn"
          style={{
            padding: '6px 16px',
            fontSize: '0.82rem',
            background: inputType === 'voice' ? 'var(--accent-cyan)' : 'transparent',
            color: inputType === 'voice' ? '#000000' : 'var(--text-secondary)',
            fontWeight: '700',
            borderRadius: 'var(--radius-full)'
          }}
        >
          <Mic size={15} /> Natural Voice
        </button>
        <button
          onClick={() => onInputTypeChange('text')}
          className="btn"
          style={{
            padding: '6px 16px',
            fontSize: '0.82rem',
            background: inputType === 'text' ? 'var(--accent-blue)' : 'transparent',
            color: inputType === 'text' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: '700',
            borderRadius: 'var(--radius-full)'
          }}
        >
          <Send size={15} /> Text Prompt
        </button>
        <button
          onClick={() => onInputTypeChange('vision')}
          className="btn"
          style={{
            padding: '6px 16px',
            fontSize: '0.82rem',
            background: inputType === 'vision' ? 'var(--accent-violet)' : 'transparent',
            color: inputType === 'vision' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: '700',
            borderRadius: 'var(--radius-full)'
          }}
        >
          <ImageIcon size={15} /> Vision / OCR
        </button>
      </div>

      {/* Center Interactive Orb */}
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: '24px' }}>
        
        {/* Animated Glow Ring */}
        {(isListening || isProcessing || isSpeaking) && (
          <div
            className="animate-pulse-ring"
            style={{
              position: 'absolute',
              top: '-16px',
              left: '-16px',
              right: '-16px',
              bottom: '-16px',
              borderRadius: '50%',
              border: `2px solid ${isListening ? '#06b6d4' : isSpeaking ? '#10b981' : '#8b5cf6'}`,
              boxShadow: `0 0 40px ${isListening ? 'rgba(6, 182, 212, 0.4)' : isSpeaking ? 'rgba(16, 185, 129, 0.4)' : 'rgba(139, 92, 246, 0.4)'}`
            }}
          />
        )}

        {/* Main Microphone Button */}
        <button
          onClick={isSpeaking ? onStopSpeaking : onToggleListening}
          disabled={isProcessing}
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: isListening
              ? 'radial-gradient(circle, #06b6d4 0%, #0284c7 100%)'
              : isSpeaking
              ? 'radial-gradient(circle, #10b981 0%, #059669 100%)'
              : 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)',
            border: `3px solid ${isListening ? '#38bdf8' : isSpeaking ? '#34d399' : 'rgba(255, 255, 255, 0.15)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isProcessing ? 'wait' : 'pointer',
            boxShadow: isListening
              ? '0 0 50px rgba(6, 182, 212, 0.6)'
              : isSpeaking
              ? '0 0 50px rgba(16, 185, 129, 0.6)'
              : '0 8px 25px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            outline: 'none'
          }}
        >
          {isProcessing ? (
            <Loader2 size={46} color="#ffffff" className="animate-spin" />
          ) : isSpeaking ? (
            <Volume2 size={46} color="#ffffff" className="animate-pulse" />
          ) : isListening ? (
            <Mic size={46} color="#ffffff" className="animate-pulse" />
          ) : (
            <Mic size={46} color="var(--accent-cyan)" />
          )}
        </button>
      </div>

      {/* Live Equalizer Waveform when speaking or listening */}
      {(isListening || isSpeaking) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '32px', marginBottom: '16px' }}>
          {[12, 24, 38, 20, 44, 28, 16, 36, 48, 22, 14, 30].map((h, i) => (
            <div
              key={i}
              style={{
                width: '4px',
                height: `${h}px`,
                backgroundColor: isListening ? '#06b6d4' : '#10b981',
                borderRadius: '4px',
                animation: `wave-bar 0.8s ease-in-out infinite alternate ${i * 0.08}s`
              }}
            />
          ))}
        </div>
      )}

      {/* State Status Text */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{
          fontSize: '0.85rem',
          fontWeight: '700',
          letterSpacing: '0.08em',
          color: isListening ? '#06b6d4' : isSpeaking ? '#10b981' : isProcessing ? '#8b5cf6' : 'var(--text-muted)'
        }}>
          {getStatusText()}
        </p>
      </div>

      {/* Interactive Transcript Input Form */}
      <form onSubmit={handleSend} style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={typedInput}
          onChange={(e) => {
            setTypedInput(e.target.value);
            onTranscriptChange(e.target.value);
          }}
          placeholder={
            inputType === 'vision'
              ? 'Describe document or prescription (e.g., Doctor Rx for Amoxicillin 500mg)...'
              : 'Speak into microphone or type emergency query...'
          }
          style={{
            flex: 1,
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-glass)',
            color: '#ffffff',
            fontSize: '0.95rem',
            fontFamily: 'var(--font-body)',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={isProcessing || !typedInput.trim()}
          className="btn btn-primary"
          style={{ padding: '0 24px' }}
        >
          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          <span>Send</span>
        </button>
      </form>

    </div>
  );
};
