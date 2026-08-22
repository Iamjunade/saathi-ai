import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { TraceStep } from '../../../../packages/shared-types';

interface AITraceViewerProps {
  steps: TraceStep[];
}

export const AITraceViewer: React.FC<AITraceViewerProps> = ({ steps }) => {
  return (
    <div className="glass-card trace-viewer">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} color="#6366f1" />
          AI Trace Viewer (Observability)
        </h3>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
          Live Decision Pipeline
        </span>
      </div>

      {steps.length === 0 ? (
        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
          No agent execution steps recorded yet. Speak or trigger a scenario to view real-time AI reasoning.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          {steps.map((step) => (
            <div key={step.id} className={`trace-step ${step.status}`}>
              <div className="trace-icon">
                {step.status === 'success' && <CheckCircle2 size={18} color="#10b981" />}
                {step.status === 'warning' && <AlertTriangle size={18} color="#f59e0b" />}
                {step.status === 'pending' && <Clock size={18} color="#6366f1" />}
              </div>
              <div className="trace-content">
                <div className="trace-title">
                  <span>{step.label}</span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>{step.timestamp}</span>
                </div>
                <div className="trace-details">
                  <ArrowRight size={12} style={{ display: 'inline', marginRight: '4px', color: '#6366f1' }} />
                  {step.details}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
