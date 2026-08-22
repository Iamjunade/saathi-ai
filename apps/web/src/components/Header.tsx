import React from 'react';
import { Shield, Activity, Cpu, Sparkles, Wifi, Radio } from 'lucide-react';

interface HeaderProps {
  isBackendOnline: boolean;
  backendLatency: number;
  activeIntent?: string;
  onOpenTrace: () => void;
  isTraceOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isBackendOnline,
  backendLatency,
  activeIntent,
  onOpenTrace,
  isTraceOpen
}) => {
  return (
    <header className="glass-panel" style={{ padding: '14px 24px', margin: '16px auto', maxWidth: '1380px', width: '95%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)'
          }}>
            <Shield size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                SAATHI
              </h1>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '2px 7px' }}>
                v1.0 AGENTIC
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Multimodal Emergency Triage, Disaster ML & Civic AI Agent
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* AI Backend Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: isBackendOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(6, 182, 212, 0.12)',
            border: `1px solid ${isBackendOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isBackendOnline ? '#10b981' : '#06b6d4',
              boxShadow: isBackendOnline ? '0 0 10px #10b981' : '0 0 10px #06b6d4'
            }} />
            <span style={{ fontSize: '0.78rem', fontWeight: '600', color: isBackendOnline ? '#10b981' : '#06b6d4' }}>
              {isBackendOnline ? `FastAPI Engine: Online (${backendLatency}ms)` : 'AI Engine: Standby Mode'}
            </span>
          </div>

          {/* Active Intent Badge if any */}
          {activeIntent && (
            <div className="badge badge-violet" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
              <Radio size={14} className="animate-pulse" />
              Active: {activeIntent.toUpperCase()}
            </div>
          )}

          {/* Toggle AI Trace Button */}
          <button
            onClick={onOpenTrace}
            className={`btn ${isTraceOpen ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '7px 14px' }}
          >
            <Cpu size={16} />
            {isTraceOpen ? 'Hide AI Trace' : 'Inspect AI Trace'}
          </button>
        </div>

      </div>
    </header>
  );
};
