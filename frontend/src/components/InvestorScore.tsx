import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface InvestorScoreProps {
  score?: number;
  isDebating: boolean;
}

export default function InvestorScore({ score, isDebating }: InvestorScoreProps) {
  const displayScore = score ?? 0;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  const scoreColor = useMemo(() => {
    if (displayScore >= 75) return '#10b981';
    if (displayScore >= 50) return '#f59e0b';
    if (displayScore >= 25) return '#f97316';
    return '#ef4444';
  }, [displayScore]);

  const scoreLabel = useMemo(() => {
    if (isDebating) return 'In Progress';
    if (displayScore >= 80) return 'Investor Ready';
    if (displayScore >= 60) return 'Promising';
    if (displayScore >= 40) return 'Needs Work';
    if (displayScore >= 20) return 'High Risk';
    return 'Critical Issues';
  }, [displayScore, isDebating]);

  return (
    <div className="investor-score">
      <div className="score-ring">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle
            className="score-bg"
            cx="70"
            cy="70"
            r={radius}
          />
          <motion.circle
            className="score-fill"
            cx="70"
            cy="70"
            r={radius}
            stroke={scoreColor}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="score-value">
          <motion.div
            className="number"
            style={{ color: isDebating ? 'var(--text-muted)' : scoreColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {isDebating ? '—' : displayScore}
          </motion.div>
          <div className="label">{isDebating ? 'Analyzing' : 'Score'}</div>
        </div>
      </div>
      <div className="score-label" style={{ color: isDebating ? 'var(--text-muted)' : scoreColor }}>
        {scoreLabel}
      </div>
    </div>
  );
}
