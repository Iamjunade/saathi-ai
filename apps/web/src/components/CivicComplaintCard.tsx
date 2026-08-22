import React from 'react';
import { Building2, Clock, CheckCircle2, Ticket, ArrowRight, Bell } from 'lucide-react';
import type { CivicAssessment } from '../types';

interface CivicComplaintCardProps {
  assessment: CivicAssessment;
}

export const CivicComplaintCard: React.FC<CivicComplaintCardProps> = ({
  assessment
}) => {
  return (
    <div className="glass-panel fade-in" style={{ padding: '24px', marginBottom: '24px', borderLeft: '5px solid #f59e0b' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(245, 158, 11, 0.4)'
          }}>
            <Building2 size={24} color="#f59e0b" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-amber" style={{ fontSize: '0.75rem' }}>
                {assessment.category}
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                <Clock size={12} /> {assessment.urgency_sla_hours}H SLA RESOLUTION
              </span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>
              {assessment.department}
            </h3>
          </div>
        </div>

        {/* Reference Ticket ID */}
        <div style={{
          background: 'rgba(6, 182, 212, 0.12)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Ticket size={18} color="var(--accent-cyan)" />
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tracking Reference ID</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {assessment.case_reference_id}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Box */}
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', marginBottom: '16px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
          Structured Citizen Grievance Dossier
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          {assessment.structured_summary}
        </p>
      </div>

      {/* Recommended Municipal Actions */}
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '8px' }}>
          Automated Departmental Action Pipeline
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {assessment.recommended_actions.map((action, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>{action}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
