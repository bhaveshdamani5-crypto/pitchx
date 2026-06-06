import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Rocket } from 'lucide-react';
import { createCompany, startPitch, createSSEStream } from '../api';
import type { CompanyBrief } from '../types';

interface IdeaInputProps {
  onBack: () => void;
  onStartDebate: (params: {
    companyId: string;
    companyName: string;
    sessionId: string;
    isReturning: boolean;
    memoryCount: number;
    companyBrief?: CompanyBrief;
  }) => void;
  onDebateEvent: (event: any) => void;
}

export default function IdeaInput({ onBack, onStartDebate, onDebateEvent }: IdeaInputProps) {
  const [idea, setIdea] = useState('');
  const [budget, setBudget] = useState('');
  const [market, setMarket] = useState('India');
  const [timeline, setTimeline] = useState('18');
  const [founderBg, setFounderBg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // Create company in memory
      const companyRes = await createCompany({
        name: idea.trim().slice(0, 50),
        mode: 'new_idea',
      });

      // Start pitch session
      const pitchRes = await startPitch({
        company_id: companyRes.company_id,
        mode: 'new_idea',
        idea: idea.trim(),
        founder_background: founderBg || undefined,
        budget: budget ? parseFloat(budget) : undefined,
        market: market || undefined,
        timeline_months: timeline ? parseInt(timeline) : undefined,
      });

      // Navigate to boardroom
      onStartDebate({
        companyId: companyRes.company_id,
        companyName: idea.trim().slice(0, 50),
        sessionId: pitchRes.session_id,
        isReturning: companyRes.is_returning,
        memoryCount: 0,
      });

      // Start SSE stream
      createSSEStream(
        pitchRes.stream_url,
        onDebateEvent,
      );
    } catch (err: any) {
      setError(err.message || 'Failed to start debate. Check if the backend is running on port 8000.');
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="form-container"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="back-row">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back to modes
        </button>
      </div>

      <div className="form-header">
        <h2>💡 Pitch Your Startup Idea</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Describe your idea and the AI boardroom will debate it with real adversarial pressure.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Startup Idea *</label>
          <textarea
            className="form-textarea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g., AI-powered dark kitchen for college campuses that uses predictive ordering to reduce food waste by 60%..."
            style={{ minHeight: 120 }}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Budget (₹)</label>
            <input
              className="form-input"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g., 5000000"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Timeline (months)</label>
            <input
              className="form-input"
              type="number"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              placeholder="18"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Target Market</label>
          <input
            className="form-input"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            placeholder="India, US, Global..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Founder Background</label>
          <input
            className="form-input"
            value={founderBg}
            onChange={(e) => setFounderBg(e.target.value)}
            placeholder="e.g., 2 ex-Swiggy engineers, 5 years in food-tech"
          />
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={!idea.trim() || isLoading}
          style={{ width: '100%', marginTop: 8 }}
        >
          {isLoading ? (
            <>
              <span className="spinner" /> Initializing Boardroom...
            </>
          ) : (
            <>
              <Rocket size={18} /> Enter the Boardroom
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
