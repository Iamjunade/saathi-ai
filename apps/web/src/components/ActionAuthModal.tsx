import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Clock, MapPin, AlertTriangle, ArrowRight } from 'lucide-react';
import type { ActionPayload, RiskLevel } from '../types';

interface ActionAuthModalProps {
  isOpen: boolean;
  actionPayload: ActionPayload | null;
  riskLevel: RiskLevel;
  riskScore: number;
  onAuthorize: () => void;
  onDecline: () => void;
}

export const ActionAuthModal: React.FC<ActionAuthModalProps> = ({
  isOpen,
  actionPayload,
  riskLevel,
  riskScore,
  onAuthorize,
  onDecline
}) => {
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(15);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || !actionPayload) return null;

  const isCritical = riskLevel === 'CRITICAL';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div
        className="glass-panel fade-in"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: '28px',
          borderRadius: 'var(--radius-xl)',
          border: `2px solid ${isCritical ? 'var(--accent-rose)' : 'var(--accent-amber)'}`,
          boxShadow: isCritical ? '0 0 60px rgba(244, 63, 94, 0.35)' : '0 0 50px rgba(245, 158, 11, 0.25)',
          background: 'linear-gradient(180deg, #101626 0%, #0c101c 100%)'
        }}
      >
        {/* Header Alert */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            background: isCritical ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${isCritical ? 'rgba(244, 63, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
          }}>
            <ShieldAlert size={28} color={isCritical ? '#f43f5e' : '#f59e0b'} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>
                Human Authorization Required
              </h2>
              <span className={`badge ${isCritical ? 'badge-rose' : 'badge-amber'}`}>
                {riskLevel} RISK ({Math.round(riskScore * 100)}%)
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              SAATHI Policy: High-urgency dispatch requires explicit user authorization
            </p>
          </div>
        </div>

        {/* Target Action Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid var(--border-glass)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            Action Target & Dispatch Routing
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <MapPin size={18} />
            {actionPayload.target}
          </div>

          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            Data to be shared securely:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {actionPayload.data_shared.map((item, idx) => (
              <span key={idx} className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>
                ✓ {item}
              </span>
            ))}
          </div>
        </div>

        {/* Medical / Disaster metadata preview */}
        {actionPayload.metadata && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            marginBottom: '20px',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)'
          }}>
            {actionPayload.metadata.chief_complaint && (
              <div style={{ marginBottom: '6px' }}>
                <strong>Reported Condition:</strong> {actionPayload.metadata.chief_complaint}
              </div>
            )}
            {actionPayload.metadata.urgency_code && (
              <div style={{ marginBottom: '6px' }}>
                <strong>Protocol Code:</strong> <span style={{ color: '#f43f5e', fontWeight: '700' }}>{actionPayload.metadata.urgency_code}</span>
              </div>
            )}
            {actionPayload.metadata.target_shelter && (
              <div style={{ marginBottom: '6px' }}>
                <strong>Evacuation Center:</strong> {actionPayload.metadata.target_shelter}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer Alert */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '24px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            By authorizing, SAATHI will securely transmit your emergency packet and GPS coordinates to the designated emergency desk.
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          <button
            onClick={onDecline}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '12px' }}
          >
            <XCircle size={18} />
            <span>Decline / Edit</span>
          </button>

          <button
            onClick={onAuthorize}
            className={`btn ${isCritical ? 'btn-danger' : 'btn-primary'}`}
            style={{ flex: 2, padding: '12px', fontWeight: '700' }}
          >
            <CheckCircle2 size={18} />
            <span>Authorize & Dispatch Now</span>
          </button>
        </div>

      </div>
    </div>
  );
};
