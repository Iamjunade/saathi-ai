import React from 'react';
import { FileSearch, Volume2, CheckCircle2, ListChecks, ArrowRight, Sparkles } from 'lucide-react';
import type { VisionAssessment } from '../types';

interface VisionOCRCardProps {
  assessment: VisionAssessment;
  onPlayAudio: () => void;
  isSpeaking: boolean;
}

export const VisionOCRCard: React.FC<VisionOCRCardProps> = ({
  assessment,
  onPlayAudio,
  isSpeaking
}) => {
  return (
    <div className="glass-panel fade-in" style={{ padding: '24px', marginBottom: '24px', borderLeft: '5px solid #8b5cf6' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(139, 92, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(139, 92, 246, 0.4)'
          }}>
            <FileSearch size={24} color="#8b5cf6" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-violet" style={{ fontSize: '0.75rem' }}>
                DOCUMENT OCR SIMPLIFIER
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>
                {assessment.document_type}
              </span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>
              Accessibility Voice Narration & Action Items
            </h3>
          </div>
        </div>

        <button
          onClick={onPlayAudio}
          className={`btn ${isSpeaking ? 'btn-danger' : 'btn-primary'}`}
          style={{ padding: '10px 20px', fontWeight: '700' }}
        >
          <Volume2 size={18} className={isSpeaking ? 'animate-pulse' : ''} />
          <span>{isSpeaking ? 'Stop Audio' : 'Play Spoken Summary'}</span>
        </button>
      </div>

      {/* Simplified Voice Narration Box */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
        padding: '18px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} /> Plain-Language Spoken Explanation
        </div>
        <p style={{ fontSize: '0.95rem', color: '#ffffff', lineHeight: '1.6', fontWeight: '500' }}>
          "{assessment.simplified_explanation}"
        </p>
      </div>

      {/* Grid: Extracted Key Info & User Action Checklist */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Extracted Key Info */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#38bdf8', marginBottom: '12px' }}>
            Structured OCR Fields Extracted
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(assessment.extracted_key_info).map(([k, v], idx) => (
              <div key={idx} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}:</span>
                <span style={{ color: '#ffffff', fontWeight: '600', textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items Checklist */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <ListChecks size={16} /> Action Items for Citizen
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {assessment.action_items_for_user.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
