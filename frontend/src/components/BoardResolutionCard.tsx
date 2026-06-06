import { motion } from 'framer-motion';
import type { BoardResolution } from '../types';

interface BoardResolutionCardProps {
  resolution: BoardResolution;
}

const VOTE_COLORS: Record<string, string> = {
  APPROVE: '#10b981',
  CONDITIONAL: '#f59e0b',
  REJECT: '#ef4444',
};

const VERDICT_LABELS: Record<string, string> = {
  GO: 'Board Approves',
  CONDITIONAL_GO: 'Conditional Go',
  NO_GO: 'No Go',
};

export default function BoardResolutionCard({ resolution }: BoardResolutionCardProps) {
  const verdictColor =
    resolution.board_verdict === 'GO'
      ? '#10b981'
      : resolution.board_verdict === 'CONDITIONAL_GO'
      ? '#f59e0b'
      : '#ef4444';

  return (
    <motion.div
      className="board-resolution-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="board-verdict" style={{ color: verdictColor }}>
        {VERDICT_LABELS[resolution.board_verdict] || resolution.board_verdict}
      </div>

      <div className="vote-chips">
        {Object.entries(resolution.votes).map(([agent, vote]) => (
          <span
            key={agent}
            className="vote-chip"
            style={{
              borderColor: `${VOTE_COLORS[vote]}50`,
              color: VOTE_COLORS[vote],
              background: `${VOTE_COLORS[vote]}12`,
            }}
          >
            {agent}: {vote}
          </span>
        ))}
      </div>

      {resolution.conditions.length > 0 && (
        <div className="board-conditions">
          <div className="board-section-label">Conditions</div>
          {resolution.conditions.map((c, i) => (
            <div key={i} className="board-condition-item">• {c}</div>
          ))}
        </div>
      )}

      {resolution.dissent && (
        <div className="board-dissent">
          <div className="board-section-label">Dissent</div>
          <div>{resolution.dissent}</div>
        </div>
      )}
    </motion.div>
  );
}