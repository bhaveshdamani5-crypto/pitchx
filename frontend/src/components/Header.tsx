import { Zap } from 'lucide-react';
import type { AppView } from '../types';

interface HeaderProps {
  onLogoClick: () => void;
  currentView: AppView;
  companyName?: string;
  isDebating: boolean;
}

export default function Header({ onLogoClick, currentView, companyName, isDebating }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-logo" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
        <div className="logo-icon">
          <Zap size={18} />
        </div>
        <span>PitchX</span>
      </div>

      <div className="header-nav">
        {currentView === 'boardroom' && companyName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Analyzing:
            </span>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {companyName}
            </span>
            {isDebating && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#ef4444',
                    animation: 'pulse 2s infinite',
                  }}
                />
                LIVE
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
