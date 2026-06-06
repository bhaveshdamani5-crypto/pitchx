import { motion } from 'framer-motion';
import { Lightbulb, Building2, Users } from 'lucide-react';

interface ModeSelectorProps {
  onSelect: (mode: 'new_idea' | 'existing' | 'hr_only') => void;
}

const modes = [
  {
    id: 'new_idea' as const,
    icon: <Lightbulb size={28} />,
    emoji: '💡',
    title: 'New Startup Idea',
    description:
      'Pitch a brand-new idea to the AI boardroom. Get a battle-tested business plan, financial model, and risk assessment before talking to real investors.',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
  },
  {
    id: 'existing' as const,
    icon: <Building2 size={28} />,
    emoji: '🏢',
    title: 'Existing Company',
    description:
      'Enter your company name and watch PitchX pull real Glassdoor reviews, competitor data, and funding intel. The boardroom argues from real data, not guesses.',
    gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  },
  {
    id: 'hr_only' as const,
    icon: <Users size={28} />,
    emoji: '👥',
    title: 'HR Evaluation',
    description:
      'Paste candidate resumes and interview transcripts. The AI HR panel evaluates each candidate against your business plan and team needs.',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
  },
];

export default function ModeSelector({ onSelect }: ModeSelectorProps) {
  return (
    <div className="mode-selector">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>The Boardroom That Never Pulls Punches</h1>
      </motion.div>

      <motion.p
        className="subtitle"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        5 AI executives with persistent memory stress-test your startup using real market intelligence. 
        They remember. They research. They disagree. They build your plan.
      </motion.p>

      <div className="mode-cards">
        {modes.map((mode, i) => (
          <motion.div
            key={mode.id}
            className="mode-card"
            onClick={() => onSelect(mode.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ '--card-gradient': mode.gradient } as any}
          >
            <span
              className="card-icon"
              style={{ filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))' }}
            >
              {mode.emoji}
            </span>
            <h3>{mode.title}</h3>
            <p>{mode.description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{
          display: 'flex',
          gap: 24,
          marginTop: 8,
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
        }}
      >
        <span>🧠 Persistent Agent Memory</span>
        <span>🔍 Live Research Intelligence</span>
        <span>⚔️ Adversarial Debate Protocol</span>
      </motion.div>
    </div>
  );
}
