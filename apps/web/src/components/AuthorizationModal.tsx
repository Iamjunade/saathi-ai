import React from 'react';
import { ShieldAlert, CheckCircle, XCircle, Lock } from 'lucide-react';
import { ActionPayload } from '../../../../packages/shared-types';

interface AuthorizationModalProps {
  action: ActionPayload;
  onApprove: () => void;
  onDecline: () => void;
}

export const AuthorizationModal: React.FC<AuthorizationModalProps> = ({
  action,
  onApprove,
  onDecline
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <ShieldAlert size={28} />
          <span>Security Authorization Required</span>
        </div>

        <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
          SAATHI requires explicit human authorization before executing this consequential action.
        </p>

        <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Action Target
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f8fafc', margin: '0.2rem 0 0.8rem' }}>
            {action.targetProvider}
          </div>

          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Description
          </div>
          <div style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: '0.2rem 0 0.8rem' }}>
            {action.description}
          </div>

          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Data Shared to Third Party
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
            {action.dataShared.map((item, idx) => (
              <span
                key={idx}
                style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fda4af',
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px'
                }}
              >
                <Lock size={10} style={{ display: 'inline', marginRight: '4px' }} />
                {item}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Consent Expiry</div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Single Transaction</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Audit Record</div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Recorded (v1.0)</div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-decline" onClick={onDecline}>
            <XCircle size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Decline Action
          </button>
          <button className="btn-authorize" onClick={onApprove}>
            <CheckCircle size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Authorize Action
          </button>
        </div>
      </div>
    </div>
  );
};
