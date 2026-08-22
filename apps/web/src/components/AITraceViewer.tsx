import React from 'react';
import { Cpu, CheckCircle2, Clock, Terminal, ChevronRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import type { AITraceStep } from '../types';

interface AITraceViewerProps {
  steps: AITraceStep[];
  totalLatencyMs?: number;
}

export const AITraceViewer: React.FC<AITraceViewerProps> = ({
  steps,
  totalLatencyMs = 0
}) => {
  if (!steps || steps.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Cpu size={32} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
        <p style={{ fontSize: '0.85rem' }}>No AI trace steps available yet. Trigger an interaction above to see transparent agent reasoning.</p>
      </div>
    );
  }

  const getStageBadgeColor = (stage: string) => {
    switch (stage) {
      case 'GUARDRAIL_CHECK': return 'badge-emerald';
      case 'INTENT_CLASSIFICATION': return 'badge-cyan';
      case 'SPECIALIST_ROUTING': return 'badge-violet';
      case 'RISK_ASSESSMENT': return 'badge-rose';
      case 'ACTION_SYNTHESIS': return 'badge-amber';
      default: return 'badge-cyan';
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', margin: '0 auto 24px auto', maxWidth: '1380px', width: '95%' }}>
      
      {/* Title & Latency Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(6, 182, 212, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(6, 182, 212, 0.3)'
          }}>
            <Cpu size={20} color="#06b6d4" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#ffffff' }}>
                AI Agent Trace & Multi-Modal Execution Inspector
              </h2>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                LIVE TRANSPARENT AUDIT
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Step-by-step reasoning log across safety guardrails, specialized sub-agents, and risk engines
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            fontSize: '0.8rem',
            fontWeight: '600',
            color: '#60a5fa'
          }}>
            <Zap size={14} /> Total Latency: {totalLatencyMs.toFixed(1)} ms
          </div>
        </div>
      </div>

      {/* Steps Timeline Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {steps.map((step, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              border: '1px solid var(--border-glass)',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gap: '16px',
              alignItems: 'center'
            }}
          >
            {/* Step Number & Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '0.85rem'
              }}>
                {step.step_number}
              </div>
            </div>

            {/* Content Details */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span className={`badge ${getStageBadgeColor(step.stage)}`} style={{ fontSize: '0.7rem' }}>
                  {step.stage}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  [{step.agent_name}]
                </span>
              </div>

              <div style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: '500', marginBottom: '4px' }}>
                💭 {step.thought}
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Action: </span>
                  <span style={{ color: 'var(--accent-cyan)' }}>{step.action_taken}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Verdict: </span>
                  <span style={{ color: '#34d399' }}>{step.result}</span>
                </div>
              </div>
            </div>

            {/* Latency Badge */}
            <div style={{
              fontSize: '0.78rem',
              fontWeight: '600',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.04)'
            }}>
              {step.latency_ms} ms
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
