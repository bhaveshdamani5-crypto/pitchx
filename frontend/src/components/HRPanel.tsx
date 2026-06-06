import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, UserPlus, Trash2, Play } from 'lucide-react';
import { startHR, createSSEStream } from '../api';
import type { BusinessPlan, CandidateInput, CandidateEvaluation, HRResult } from '../types';

interface HRPanelProps {
  companyId?: string;
  sessionId?: string;
  businessPlan?: BusinessPlan;
  onBack: () => void;
}

export default function HRPanel({ companyId, sessionId, businessPlan, onBack }: HRPanelProps) {
  const [position, setPosition] = useState({
    title: '',
    level: 'Senior',
    team: 'Engineering',
    budget: '',
  });
  const [candidates, setCandidates] = useState<CandidateInput[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluations, setEvaluations] = useState<CandidateEvaluation[]>([]);
  const [hrResult, setHrResult] = useState<HRResult | null>(null);
  const [error, setError] = useState('');

  const addCandidate = () => {
    setCandidates((prev) => [
      ...prev,
      {
        id: `c${prev.length + 1}`,
        name: '',
        resume_text: '',
        interview_transcript: '',
      },
    ]);
  };

  const updateCandidate = (index: number, updates: Partial<CandidateInput>) => {
    setCandidates((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...updates } : c))
    );
  };

  const removeCandidate = (index: number) => {
    setCandidates((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEvaluate = async () => {
    if (!companyId || !position.title || candidates.length === 0) return;

    setIsEvaluating(true);
    setError('');
    setEvaluations([]);
    setHrResult(null);

    try {
      const res = await startHR({
        company_id: companyId,
        session_id: sessionId,
        position: {
          title: position.title,
          level: position.level,
          team: position.team,
          budget: position.budget,
        },
        candidates: candidates.filter((c) => c.name && c.resume_text),
        business_plan_context: businessPlan
          ? JSON.stringify(businessPlan).slice(0, 2000)
          : undefined,
      });

      createSSEStream(
        res.stream_url,
        (event) => {
          if (event.type === 'candidate_done') {
            setEvaluations((prev) => [...prev, event.evaluation]);
          } else if (event.type === 'hr_done') {
            setHrResult({
              ranked_list: event.ranked_list,
              evaluations: event.evaluations,
              team_gap_analysis: event.team_gap_analysis,
            });
            setIsEvaluating(false);
          } else if (event.type === 'error') {
            setError(event.message);
            setIsEvaluating(false);
          }
        },
        () => setIsEvaluating(false),
      );
    } catch (err: any) {
      setError(err.message || 'Failed to start HR evaluation');
      setIsEvaluating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      style={{ maxWidth: 900, margin: '0 auto' }}
    >
      <div className="back-row">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="form-header">
        <h2>👥 HR Agent — Talent Evaluation</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          The HR agent reads the business plan first, then evaluates candidates against what the team actually needs.
        </p>
      </div>

      {/* Position Definition */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <h3
          style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-accent)',
            marginBottom: 16,
          }}
        >
          📋 Position Details
        </h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Position Title *</label>
            <input
              className="form-input"
              value={position.title}
              onChange={(e) => setPosition({ ...position, title: e.target.value })}
              placeholder="e.g., Senior Backend Engineer"
              disabled={isEvaluating}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Level</label>
            <select
              className="form-select"
              value={position.level}
              onChange={(e) => setPosition({ ...position, level: e.target.value })}
              disabled={isEvaluating}
            >
              <option value="Junior">Junior</option>
              <option value="Mid">Mid</option>
              <option value="Senior">Senior</option>
              <option value="Staff">Staff</option>
              <option value="Lead">Lead</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Team</label>
            <input
              className="form-input"
              value={position.team}
              onChange={(e) => setPosition({ ...position, team: e.target.value })}
              placeholder="e.g., Engineering, Marketing..."
              disabled={isEvaluating}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Budget</label>
            <input
              className="form-input"
              value={position.budget}
              onChange={(e) => setPosition({ ...position, budget: e.target.value })}
              placeholder="e.g., ₹15L/year"
              disabled={isEvaluating}
            />
          </div>
        </div>
      </div>

      {/* Candidate List */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h3
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-accent)',
            }}
          >
            👤 Candidates ({candidates.length})
          </h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={addCandidate}
            disabled={isEvaluating}
          >
            <Plus size={14} /> Add Candidate
          </button>
        </div>

        <AnimatePresence>
          {candidates.map((candidate, index) => (
            <motion.div
              key={candidate.id}
              className="glass-card"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ padding: 20, marginBottom: 12 }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  Candidate {index + 1}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => removeCandidate(index)}
                  disabled={isEvaluating}
                  style={{ color: 'var(--devil-color)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  className="form-input"
                  value={candidate.name}
                  onChange={(e) => updateCandidate(index, { name: e.target.value })}
                  placeholder="Candidate name"
                  disabled={isEvaluating}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resume (Paste Text) *</label>
                <textarea
                  className="form-textarea"
                  value={candidate.resume_text}
                  onChange={(e) => updateCandidate(index, { resume_text: e.target.value })}
                  placeholder="Paste resume text here..."
                  disabled={isEvaluating}
                  style={{ minHeight: 80 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Interview Transcript (Optional)</label>
                <textarea
                  className="form-textarea"
                  value={candidate.interview_transcript}
                  onChange={(e) =>
                    updateCandidate(index, { interview_transcript: e.target.value })
                  }
                  placeholder="Paste interview transcript here..."
                  disabled={isEvaluating}
                  style={{ minHeight: 60 }}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {candidates.length === 0 && (
          <div className="empty-state" style={{ padding: 40 }}>
            <UserPlus size={32} style={{ opacity: 0.4 }} />
            <p>Add candidates to evaluate. The HR agent will score them against the business plan.</p>
            <button className="btn btn-secondary" onClick={addCandidate}>
              <Plus size={16} /> Add First Candidate
            </button>
          </div>
        )}
      </div>

      {/* Error */}
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

      {/* Evaluate Button */}
      {candidates.length > 0 && (
        <button
          className="btn btn-primary btn-lg"
          onClick={handleEvaluate}
          disabled={
            isEvaluating ||
            !position.title ||
            !candidates.some((c) => c.name && c.resume_text)
          }
          style={{ width: '100%', marginBottom: 32 }}
        >
          {isEvaluating ? (
            <>
              <span className="spinner" /> Evaluating Candidates...
            </>
          ) : (
            <>
              <Play size={18} /> Evaluate All Candidates
            </>
          )}
        </button>
      )}

      {/* Results */}
      {evaluations.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-accent)',
              marginBottom: 16,
            }}
          >
            📊 Evaluation Results
          </h3>

          {evaluations
            .sort((a, b) => (b.composite_fit_score || 0) - (a.composite_fit_score || 0))
            .map((evaluation, i) => (
              <CandidateResult key={i} evaluation={evaluation} rank={i + 1} />
            ))}

          {/* Team Gap Analysis */}
          {hrResult?.team_gap_analysis && (
            <div className="glass-card" style={{ padding: 20, marginTop: 20 }}>
              <h4
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 12,
                }}
              >
                🧩 Team Gap Analysis
              </h4>
              {hrResult.team_gap_analysis.filled_by_hiring.length > 0 && (
                <p style={{ fontSize: '0.85rem', color: '#34d399', marginBottom: 6 }}>
                  ✅ Filled: {hrResult.team_gap_analysis.filled_by_hiring.join(', ')}
                </p>
              )}
              {hrResult.team_gap_analysis.still_missing.length > 0 && (
                <p style={{ fontSize: '0.85rem', color: '#f87171', marginBottom: 6 }}>
                  ⚠️ Still Missing: {hrResult.team_gap_analysis.still_missing.join(', ')}
                </p>
              )}
              {hrResult.team_gap_analysis.critical_gap && (
                <p style={{ fontSize: '0.85rem', color: '#fbbf24' }}>
                  🔴 Critical: {hrResult.team_gap_analysis.critical_gap}
                </p>
              )}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

function CandidateResult({
  evaluation,
  rank,
}: {
  evaluation: CandidateEvaluation;
  rank: number;
}) {
  const score = evaluation.composite_fit_score || 0;
  const verdictClass =
    evaluation.verdict === 'HIRE'
      ? 'hire'
      : evaluation.verdict === 'REJECT'
      ? 'reject'
      : 'next_round';

  const scoreColor =
    score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';

  return (
    <motion.div
      className="candidate-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
    >
      <div className="candidate-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
            }}
          >
            #{rank}
          </span>
          <span className="candidate-name">{evaluation.candidate_name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: '1.5rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: scoreColor,
            }}
          >
            {score}
          </span>
          <span className={`verdict-badge ${verdictClass}`}>
            {evaluation.verdict === 'HIRE' && '✅ '}
            {evaluation.verdict === 'REJECT' && '❌ '}
            {evaluation.verdict === 'NEXT_ROUND' && '🔄 '}
            {evaluation.verdict}
          </span>
        </div>
      </div>

      <div className="score-bar">
        <motion.div
          className="score-bar-fill"
          style={{ background: scoreColor }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: 0.2 }}
        />
      </div>

      {/* Score Dimensions */}
      {evaluation.scores && (
        <div className="score-dimensions">
          {Object.entries(evaluation.scores).map(([key, value]) => (
            <div key={key} className="dimension">
              <div className="dim-label">{formatDimensionLabel(key)}</div>
              <div
                className="dim-value"
                style={{
                  color:
                    (value as number) >= 7 ? '#10b981' : (value as number) >= 4 ? '#f59e0b' : '#ef4444',
                }}
              >
                {value as number}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Strengths & Concerns */}
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {evaluation.strengths && evaluation.strengths.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#34d399',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Strengths
            </div>
            {evaluation.strengths.map((s, i) => (
              <div
                key={i}
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  marginBottom: 4,
                  paddingLeft: 8,
                  borderLeft: '2px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                {s}
              </div>
            ))}
          </div>
        )}
        {evaluation.concerns && evaluation.concerns.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#f87171',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Concerns
            </div>
            {evaluation.concerns.map((c, i) => (
              <div
                key={i}
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  marginBottom: 4,
                  paddingLeft: 8,
                  borderLeft: '2px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                {c}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function formatDimensionLabel(key: string): string {
  const labels: Record<string, string> = {
    technical_fit: 'Tech Fit',
    culture_fit: 'Culture',
    growth_potential: 'Growth',
    execution_evidence: 'Execution',
    risk_flags: 'Risk',
    communication: 'Comm',
  };
  return labels[key] || key.replace(/_/g, ' ');
}
