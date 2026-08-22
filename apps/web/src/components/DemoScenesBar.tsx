import React from 'react';
import { HeartPulse, Waves, Building2, FileSearch, Sparkles } from 'lucide-react';

interface DemoScenesBarProps {
  onSelectScene: (sceneId: number, promptText: string, inputType?: 'voice' | 'text' | 'vision') => void;
  activeSceneId: number | null;
  disabled?: boolean;
}

export const DemoScenesBar: React.FC<DemoScenesBarProps> = ({
  onSelectScene,
  activeSceneId,
  disabled = false
}) => {
  const scenes = [
    {
      id: 1,
      name: 'Scene 1: Medical Triage',
      badge: 'CRITICAL TRIAGE',
      badgeClass: 'badge-rose',
      icon: HeartPulse,
      iconColor: '#f43f5e',
      prompt: "I feel a severe heaviness in my chest and can't breathe properly",
      desc: 'Urgent chest symptoms → Triage evaluation → Hospital dispatch',
      inputType: 'voice' as const
    },
    {
      id: 2,
      name: 'Scene 2: Flood Disaster',
      badge: 'ML RISK MODEL',
      badgeClass: 'badge-cyan',
      icon: Waves,
      iconColor: '#06b6d4',
      prompt: 'Water is rising rapidly outside my house, flood is entering ground floor',
      desc: 'Gradient Boosting Flood ML → Safe route & shelter mapping',
      inputType: 'voice' as const
    },
    {
      id: 3,
      name: 'Scene 3: Civic Grievance',
      badge: 'NLP ROUTER',
      badgeClass: 'badge-amber',
      icon: Building2,
      iconColor: '#f59e0b',
      prompt: "The municipal garbage truck hasn't come for a week and trash is overflowing near the main market on Station Road",
      desc: 'Sanitation routing → SLA estimate → Ticket CIVIC-2026-8941',
      inputType: 'voice' as const
    },
    {
      id: 4,
      name: 'Scene 4: Vision & OCR',
      badge: 'ACCESSIBILITY',
      badgeClass: 'badge-violet',
      icon: FileSearch,
      iconColor: '#8b5cf6',
      prompt: 'Doctor prescription for Amoxicillin 500mg tablets twice daily',
      desc: 'Medical/Notice OCR → Plain audio explanation & checklist',
      inputType: 'vision' as const
    }
  ];

  return (
    <div style={{ maxWidth: '1380px', width: '95%', margin: '0 auto 24px auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#06b6d4" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            TechFusion 2026 Live Jury Demonstration Presets
          </h2>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Click any preset to trigger instantaneous multimodal agentic execution
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '14px'
      }}>
        {scenes.map((scene) => {
          const Icon = scene.icon;
          const isActive = activeSceneId === scene.id;

          return (
            <button
              key={scene.id}
              onClick={() => onSelectScene(scene.id, scene.prompt, scene.inputType)}
              disabled={disabled}
              className="glass-panel"
              style={{
                padding: '16px',
                textAlign: 'left',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                background: isActive ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-card)',
                borderColor: isActive ? 'var(--accent-cyan)' : 'var(--border-glass)',
                boxShadow: isActive ? '0 0 25px rgba(6, 182, 212, 0.25)' : 'none',
                opacity: disabled ? 0.6 : 1,
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={20} color={scene.iconColor} />
                </div>
                <span className={`badge ${scene.badgeClass}`} style={{ fontSize: '0.65rem' }}>
                  {scene.badge}
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {scene.name}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {scene.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
