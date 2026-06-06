import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { RealityGap } from '../types';

interface RealityGapBannerProps {
  gap: RealityGap;
}

export default function RealityGapBanner({ gap }: RealityGapBannerProps) {
  if (!gap || gap.score < 15) return null;

  const severityColor =
    gap.severity === 'High'
      ? '#ef4444'
      : gap.severity === 'Moderate'
      ? '#f59e0b'
      : '#10b981';

  return (
    <motion.div
      className="reality-gap-banner"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderColor: `${severityColor}40`,
        background: `${severityColor}10`,
      }}
    >
      <div className="reality-gap-header">
        <AlertTriangle size={18} color={severityColor} />
        <div>
          <div className="reality-gap-title" style={{ color: severityColor }}>
            Reality Gap: {gap.score}/100 ({gap.severity})
          </div>
          {gap.summary && (
            <div className="reality-gap-summary">{gap.summary}</div>
          )}
        </div>
      </div>

      {gap.gaps.length > 0 && (
        <div className="reality-gap-list">
          {gap.gaps.slice(0, 3).map((g, i) => (
            <div key={i} className="reality-gap-item">
              <span className="gap-claim">You said: {g.claim}</span>
              <span className="gap-reality">Reality: {g.reality}</span>
              <span className="gap-source">via {g.source.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}