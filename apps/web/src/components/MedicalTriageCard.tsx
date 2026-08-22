import React from 'react';
import { HeartPulse, PhoneCall, MapPin, Clock, ShieldAlert, CheckCircle2, Hospital } from 'lucide-react';
import type { MedicalAssessment } from '../types';

interface MedicalTriageCardProps {
  assessment: MedicalAssessment;
  onRequestDispatch: () => void;
}

export const MedicalTriageCard: React.FC<MedicalTriageCardProps> = ({
  assessment,
  onRequestDispatch
}) => {
  const isImmediate = assessment.triage_category === 'IMMEDIATE';

  return (
    <div className="glass-panel fade-in" style={{ padding: '24px', marginBottom: '24px', borderLeft: `5px solid ${isImmediate ? '#f43f5e' : '#f59e0b'}` }}>
      
      {/* Triage Urgency Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: isImmediate ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${isImmediate ? 'rgba(244, 63, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
          }}>
            <HeartPulse size={24} color={isImmediate ? '#f43f5e' : '#f59e0b'} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`badge ${isImmediate ? 'badge-rose' : 'badge-amber'}`} style={{ fontSize: '0.75rem' }}>
                TRIAGE CATEGORY: {assessment.triage_category}
              </span>
              <span className="badge badge-rose" style={{ fontSize: '0.75rem' }}>
                {assessment.pre_arrival_handover.urgency_code}
              </span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>
              {assessment.suspected_condition}
            </h3>
          </div>
        </div>

        <button
          onClick={onRequestDispatch}
          className="btn btn-danger"
          style={{ padding: '10px 20px', fontWeight: '700' }}
        >
          <PhoneCall size={18} />
          <span>Authorize Hospital Handover</span>
        </button>
      </div>

      {/* Grid: First Aid & Nearby Hospitals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Recommended First-Aid Box */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <CheckCircle2 size={16} /> Vital First-Aid & Patient Stabilization
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', padding: 0 }}>
            {assessment.recommended_first_aid.map((aid, idx) => (
              <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>•</span>
                <span>{aid}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Nearby Hospitals List */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Hospital size={16} /> Geocoded Trauma Centers (Nearest to GPS)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {assessment.nearest_facilities.map((hosp) => (
              <div
                key={hosp.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#ffffff' }}>
                    {hosp.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {hosp.type} • ICU Available: {hosp.icu_available ? 'Yes' : 'No'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#34d399' }}>
                    {hosp.distance_km} km ({hosp.eta_minutes} min)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                    {hosp.contact_phone}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
