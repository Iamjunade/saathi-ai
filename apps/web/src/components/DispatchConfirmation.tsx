import React from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight, Radio, ExternalLink, X } from 'lucide-react';
import type { ActionPayload } from '../types';

interface DispatchConfirmationProps {
  actionPayload: ActionPayload;
  caseId: string;
  onClose: () => void;
}

export const DispatchConfirmation: React.FC<DispatchConfirmationProps> = ({
  actionPayload,
  caseId,
  onClose
}) => {
  return (
    <div
      className="glass-panel fade-in"
      style={{
        padding: '20px 24px',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
        }}>
          <CheckCircle2 size={24} color="#10b981" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#ffffff' }}>
              Action Authorized & Successfully Dispatched
            </h3>
            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
              STATE: ACTION_EXECUTING
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Secure emergency handshake established with <strong>{actionPayload.target}</strong> (Ref #{caseId})
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-glass)',
          fontSize: '0.8rem',
          color: 'var(--accent-cyan)',
          fontFamily: 'var(--font-mono)'
        }}>
          CASE ID: {caseId}
        </div>

        <button
          onClick={onClose}
          className="btn btn-secondary"
          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
