import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getUserLocation, ResolvedLocation } from '../services/locationService';

export const DisasterMap: React.FC = () => {
  const [location, setLocation] = useState<ResolvedLocation | null>(null);

  useEffect(() => {
    getUserLocation().then(setLocation);
  }, []);

  return (
    <div className="glass-card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Navigation size={20} color="#3b82f6" />
          Disaster Evacuation Safe Route
        </h3>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
          Risk Score: 0.88 (HIGH)
        </span>
      </div>

      {/* Simulated Map Visualizer */}
      <div
        style={{
          position: 'relative',
          height: '220px',
          borderRadius: '14px',
          background: '#0f172a',
          backgroundImage: `
            radial-gradient(circle at 30% 40%, rgba(239, 68, 68, 0.35) 0%, transparent 45%),
            radial-gradient(circle at 75% 70%, rgba(16, 185, 129, 0.35) 0%, transparent 40%),
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 20px 20px, 20px 20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          padding: '1rem'
        }}
      >
        <div style={{ position: 'absolute', top: '35%', left: '28%', textAlign: 'center' }}>
          <div className="pulse-dot" style={{ backgroundColor: '#ef4444', width: '12px', height: '12px', margin: '0 auto' }} />
          <span style={{ fontSize: '0.7rem', color: '#fca5a5', fontWeight: 700, background: 'rgba(0,0,0,0.7)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
            {location ? `${location.city} (Flood Zone)` : 'User Location (Flood Zone)'}
          </span>
        </div>

        {/* Shelter Safe Pin */}
        <div style={{ position: 'absolute', top: '65%', left: '72%', textAlign: 'center' }}>
          <ShieldCheck size={24} color="#10b981" style={{ margin: '0 auto' }} />
          <span style={{ fontSize: '0.7rem', color: '#6ee7b7', fontWeight: 700, background: 'rgba(0,0,0,0.7)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
            Safe Shelter #4 (Evacuation Target)
          </span>
        </div>

        {/* Route Dotted Line SVG */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <path
            d="M 120 80 Q 200 140 280 150"
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeDasharray="6 6"
          />
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: '10px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Est. Evacuation Time</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>12 Mins (Elevated Route)</div>
        </div>
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: '10px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Shelter Capacity</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#34d399' }}>Available (240 spots)</div>
        </div>
      </div>
    </div>
  );
};
