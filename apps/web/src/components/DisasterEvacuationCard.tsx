import React from 'react';
import { Waves, Navigation, MapPin, ShieldAlert, Home, AlertCircle, Compass } from 'lucide-react';
import type { DisasterAssessment } from '../types';

interface DisasterEvacuationCardProps {
  assessment: DisasterAssessment;
  onRequestEvacuationAlert: () => void;
}

export const DisasterEvacuationCard: React.FC<DisasterEvacuationCardProps> = ({
  assessment,
  onRequestEvacuationAlert
}) => {
  return (
    <div className="glass-panel fade-in" style={{ padding: '24px', marginBottom: '24px', borderLeft: '5px solid #06b6d4' }}>
      
      {/* Flood Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(6, 182, 212, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(6, 182, 212, 0.4)'
          }}>
            <Waves size={24} color="#06b6d4" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>
                GRADIENT BOOSTING ML: {Math.round(assessment.flood_risk_score * 100)}% RISK
              </span>
              <span className="badge badge-rose" style={{ fontSize: '0.75rem' }}>
                {assessment.risk_level} SEVERITY
              </span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>
              Severe Urban Flood Inundation & Evacuation Plan
            </h3>
          </div>
        </div>

        <button
          onClick={onRequestEvacuationAlert}
          className="btn btn-danger"
          style={{ padding: '10px 20px', fontWeight: '700' }}
        >
          <ShieldAlert size={18} />
          <span>Broadcast Evacuation Dispatch</span>
        </button>
      </div>

      {/* Environmental Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Water Depth</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#38bdf8' }}>{assessment.water_depth_cm} cm</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rainfall Intensity</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#06b6d4' }}>{assessment.rainfall_intensity_mm_hr} mm/hr</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Safe Relief Shelters</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#34d399' }}>{assessment.safe_shelters.length} Available</div>
        </div>
      </div>

      {/* Grid: Evacuation Corridor & Safe Shelters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Safe Evacuation Waypoints */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Compass size={16} /> Safe Elevated Evacuation Corridor
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {assessment.evacuation_corridor.map((step) => (
              <div key={step.step} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {step.step}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {step.step_instruction}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safe Relief Hubs */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Home size={16} /> High-Ground Shelters & Amenities
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {assessment.safe_shelters.map((shelter) => (
              <div
                key={shelter.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-glass)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#ffffff' }}>
                    {shelter.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#34d399' }}>
                    {shelter.distance_km} km
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Elevation: {shelter.elevation_meters}m • Available Capacity: {shelter.capacity_available} citizens
                </div>

                {shelter.amenities && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {shelter.amenities.map((am, idx) => (
                      <span key={idx} className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                        ✓ {am}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
