import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { AgentMessage } from '../types';

interface AgentCardProps {
  message: AgentMessage;
}

const AGENT_STYLES: Record<string, { emoji: string; color: string; bgAlpha: string }> = {
  CEO: { emoji: '👔', color: '#3b82f6', bgAlpha: 'rgba(59, 130, 246, 0.08)' },
  CFO: { emoji: '💰', color: '#10b981', bgAlpha: 'rgba(16, 185, 129, 0.08)' },
  CTO: { emoji: '⚙️', color: '#8b5cf6', bgAlpha: 'rgba(139, 92, 246, 0.08)' },
  CMO: { emoji: '📣', color: '#f59e0b', bgAlpha: 'rgba(245, 158, 11, 0.08)' },
  Devil: { emoji: '😈', color: '#ef4444', bgAlpha: 'rgba(239, 68, 68, 0.08)' },
  "Devil's Advocate": { emoji: '😈', color: '#ef4444', bgAlpha: 'rgba(239, 68, 68, 0.08)' },
  HR: { emoji: '👥', color: '#ec4899', bgAlpha: 'rgba(236, 72, 153, 0.08)' },
};

const AGENT_TITLES: Record<string, string> = {
  CEO: 'Chief Executive Officer',
  CFO: 'Chief Financial Officer',
  CTO: 'Chief Technology Officer',
  CMO: 'Chief Marketing Officer',
  Devil: "Devil's Advocate",
  "Devil's Advocate": "Devil's Advocate",
  HR: 'Chief People Officer',
};

function AgentCard({ message }: AgentCardProps) {
  const style = AGENT_STYLES[message.agent] || {
    emoji: '🤖',
    color: '#6b7280',
    bgAlpha: 'rgba(107, 114, 128, 0.08)',
  };

  const emoji = message.emoji || style.emoji;
  const color = message.color || style.color;
  const title = message.title || AGENT_TITLES[message.agent] || message.agent;

  const confidenceBadge = useMemo(() => {
    if (message.confidence === undefined || message.confidence === null) return null;
    const isDevil = message.agent === 'Devil' || message.agent === "Devil's Advocate";
    const label = isDevil ? 'KILL' : 'CONF';
    const value = message.confidence;
    const badgeColor =
      value >= 7 ? (isDevil ? '#ef4444' : '#10b981') :
      value >= 4 ? '#f59e0b' :
      (isDevil ? '#10b981' : '#ef4444');
    return (
      <span
        className="agent-confidence"
        style={{
          background: `${badgeColor}18`,
          color: badgeColor,
          border: `1px solid ${badgeColor}40`,
        }}
      >
        {label}: {value}/10
      </span>
    );
  }, [message.confidence, message.agent]);

  // Format content with basic markdown-like rendering
  const formattedContent = useMemo(() => {
    if (!message.content) return '';
    return message.content;
  }, [message.content]);

  return (
    <motion.div
      className={`agent-card ${!message.isComplete ? 'streaming' : ''}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        borderLeftColor: color,
        borderLeftWidth: 3,
      }}
    >
      <div className="agent-card-header">
        <div
          className="agent-avatar"
          style={{
            background: style.bgAlpha,
            border: `1px solid ${color}30`,
          }}
        >
          {emoji}
        </div>
        <div className="agent-info">
          <div className="agent-name">{message.agent}</div>
          <div className="agent-title">{title}</div>
        </div>
        {message.isComplete && confidenceBadge}
        {!message.isComplete && (
          <span
            style={{
              fontSize: '0.7rem',
              padding: '3px 8px',
              borderRadius: 10,
              background: `${color}15`,
              color: color,
              fontWeight: 600,
            }}
          >
            Speaking...
          </span>
        )}
      </div>

      <div className="agent-card-body">
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.88rem',
            lineHeight: 1.75,
            margin: 0,
          }}
        >
          {formattedContent}
          {!message.isComplete && <span className="typing-cursor" />}
        </pre>
      </div>
    </motion.div>
  );
}

export default memo(AgentCard);
