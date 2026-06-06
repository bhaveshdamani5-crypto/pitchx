import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ScoreGaugesProps {
  investorScore?: number;
  killProbability?: number;
  isDebating: boolean;
}

function GaugeRing({
  value,
  max,
  label,
  subLabel,
  color,
  isDebating,
}: {
  value: number;
  max: number;
  label: string;
  subLabel: string;
  color: string;
  isDebating: boolean;
}) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const pct = isDebating ? 0 : (value / max) * 100;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="gauge-item">
      <div className="score-ring" style={{ width: 120, height: 120 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle className="score-bg" cx="60" cy="60" r={radius} />
          <motion.circle
            className="score-fill"
            cx="60"
            cy="60"
            r={radius}
            stroke={color}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="score-value" style={{ transform: 'translate(-50%, -50%) scale(0.85)' }}>
          <div className="number" style={{ color: isDebating ? 'var(--text-muted)' : color }}>
            {isDebating ? '—' : value}
          </div>
          <div className="label">/{max}</div>
        </div>
      </div>
      <div className="gauge-label" style={{ color: isDebating ? 'var(--text-muted)' : color }}>
        {label}
      </div>
      <div className="gauge-sublabel">{isDebating ? 'Analyzing...' : subLabel}</div>
    </div>
  );
}

export default function ScoreGauges({
  investorScore,
  killProbability,
  isDebating,
}: ScoreGaugesProps) {
  const displayScore = investorScore ?? 0;
  const kill = killProbability ?? 0;

  const investorColor = useMemo(() => {
    if (displayScore >= 75) return '#10b981';
    if (displayScore >= 50) return '#f59e0b';
    return '#ef4444';
  }, [displayScore]);

  const killColor = useMemo(() => {
    if (kill <= 3) return '#10b981';
    if (kill <= 6) return '#f59e0b';
    return '#ef4444';
  }, [kill]);

  const investorLabel = useMemo(() => {
    if (displayScore >= 80) return 'Investor Ready';
    if (displayScore >= 60) return 'Promising';
    if (displayScore >= 40) return 'Needs Work';
    return 'High Risk';
  }, [displayScore]);

  const killLabel = useMemo(() => {
    if (kill <= 3) return 'Low Failure Risk';
    if (kill <= 6) return 'Moderate Risk';
    return 'High Failure Risk';
  }, [kill]);

  return (
    <div className="dual-gauges">
      <GaugeRing
        value={displayScore}
        max={100}
        label="Investor Readiness"
        subLabel={investorLabel}
        color={investorColor}
        isDebating={isDebating}
      />
      <GaugeRing
        value={kill}
        max={10}
        label="Kill Probability"
        subLabel={killLabel}
        color={killColor}
        isDebating={isDebating && kill === 0}
      />
    </div>
  );
}