import React from 'react';
import { Shield, RefreshCw, CheckCircle, Clock, MapPin } from 'lucide-react';
import { CaseRecord } from '../../../../packages/shared-types';

interface CaseTimelineProps {
  currentCase: CaseRecord | null;
}

export const CaseTimeline: React.FC<CaseTimelineProps> = ({ currentCase }) => {
  if (!currentCase) {
    return (
      <div className="glass-card">
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Shield size={20} color="#10b981" />
          Active Case Management
        </h3>
        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
          No active case initiated. Interact with SAATHI to create a trackable case.
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={20} color="#10b981" />
          Active Case #{currentCase.id.substring(0, 8)}
        </h3>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            background:
              currentCase.status === 'RESOLVED' || currentCase.status === 'ACTION_COMPLETED'
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(99, 102, 241, 0.2)',
            color:
              currentCase.status === 'RESOLVED' || currentCase.status === 'ACTION_COMPLETED'
                ? '#34d399'
                : '#818cf8',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {currentCase.status}
        </span>
      </div>

      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Domain</div>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', margin: '0.2rem 0 0.5rem' }}>
          {currentCase.domain.toUpperCase()} WORKFLOW
        </div>

        <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Case Summary</div>
        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
          {currentCase.summary}
        </div>

        {currentCase.referenceId && (
          <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
            Reference ID: {currentCase.referenceId}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.6rem', fontSize: '0.75rem', color: '#94a3b8' }}>
          <MapPin size={12} color="#10b981" />
          <span>Location: Hyderabad (17.3850 N, 78.4867 E)</span>
        </div>
      </div>

      {currentCase.followUpMessage && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '0.85rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={14} className="spin" />
            Follow-Up Engine Active
          </div>
          <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: '0.3rem' }}>
            "{currentCase.followUpMessage}"
          </div>
        </div>
      )}
    </div>
  );
};
