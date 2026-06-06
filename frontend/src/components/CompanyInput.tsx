import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search } from 'lucide-react';
import { createCompany, startResearch, startPitch, createSSEStream, streamPostSSE } from '../api';
import type { CompanyBrief, ResearchQuery } from '../types';

interface CompanyInputProps {
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

const RESEARCH_LABELS: Record<string, string> = {
  company_overview: 'Company Overview',
  glassdoor_reviews: 'Glassdoor Reviews',
  customer_reviews: 'Customer Reviews',
  competitors: 'Competitor Analysis',
  funding_news: 'Funding Intelligence',
  recent_news: 'Recent News',
  market_landscape: 'Market Landscape',
  founder_background: 'Founder Background',
};

export default function CompanyInput({ onBack, onStartDebate, onDebateEvent }: CompanyInputProps) {
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [stage, setStage] = useState('seed');
  const [challenge, setChallenge] = useState('');
  const [monthlyRevenue, setMonthlyRevenue] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [researchQueries, setResearchQueries] = useState<ResearchQuery[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    setIsResearching(true);
    setError('');

    // Init research queries as pending
    const queryKeys = Object.keys(RESEARCH_LABELS);
    setResearchQueries(
      queryKeys.map((key) => ({ key, status: 'pending' as const }))
    );

    try {
      // Create company
      const companyRes = await createCompany({
        name: companyName.trim(),
        website: website || undefined,
        mode: 'existing',
        industry: industry || undefined,
        stage: stage || undefined,
        monthly_revenue: monthlyRevenue ? parseFloat(monthlyRevenue) : undefined,
        team_size: teamSize ? parseInt(teamSize) : undefined,
      });

      // Start research ingestion
      const researchResponse = await startResearch({
        company_id: companyRes.company_id,
        company_name: companyName.trim(),
        website_url: website || undefined,
        industry: industry || undefined,
      });

      let companyBrief: CompanyBrief | undefined;

      // Stream research events
      await streamPostSSE(
        researchResponse,
        (event) => {
          if (event.type === 'query_done') {
            setResearchQueries((prev) =>
              prev.map((q) =>
                q.key === event.key
                  ? {
                      ...q,
                      status: event.found ? 'done' : 'error',
                      found: event.found,
                      answer_preview: event.answer_preview,
                    }
                  : q
              )
            );
          } else if (event.type === 'brief_ready') {
            companyBrief = event.brief;
          }
        },
      );

      setIsResearching(false);
      setIsStarting(true);

      // Now start the debate
      const pitchRes = await startPitch({
        company_id: companyRes.company_id,
        mode: 'existing',
        idea: companyName.trim(),
        challenge: challenge || undefined,
      });

      // Navigate to boardroom
      onStartDebate({
        companyId: companyRes.company_id,
        companyName: companyName.trim(),
        sessionId: pitchRes.session_id,
        isReturning: companyRes.is_returning,
        memoryCount: companyRes.sessions_count || 0,
        companyBrief,
      });

      // Start debate SSE stream
      createSSEStream(pitchRes.stream_url, onDebateEvent);
    } catch (err: any) {
      setError(err.message || 'Failed to start. Check if the backend is running on port 8000.');
      setIsResearching(false);
      setIsStarting(false);
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
        <h2>🏢 Analyze an Existing Company</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Enter your company details. PitchX will pull real data before the boardroom debates.
        </p>
      </div>

      {/* Research Progress Panel */}
      {(isResearching || isStarting) && researchQueries.length > 0 && (
        <motion.div
          className="glass-card research-panel"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ marginBottom: 24 }}
        >
          <h3
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--text-accent)',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {isStarting ? '✅ Research Complete — Launching Boardroom...' : '🔍 Live Research Ingestion'}
          </h3>
          {researchQueries.map((q) => (
            <div key={q.key} className="research-item">
              <div className={`research-status ${q.status}`}>
                {q.status === 'done' && '✓'}
                {q.status === 'pending' && '⏳'}
                {q.status === 'error' && '✗'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {RESEARCH_LABELS[q.key] || q.key}
                </div>
                {q.answer_preview && (
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      marginTop: 2,
                    }}
                  >
                    {q.answer_preview}
                  </div>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Company Name *</label>
          <input
            className="form-input"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., Swiggy, BrowserWire, Authsome..."
            required
            disabled={isResearching || isStarting}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Website URL</label>
            <input
              className="form-input"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              disabled={isResearching || isStarting}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Industry</label>
            <input
              className="form-input"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., SaaS, Fintech, D2C..."
              disabled={isResearching || isStarting}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Stage</label>
            <select
              className="form-select"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              disabled={isResearching || isStarting}
            >
              <option value="pre-seed">Pre-Seed</option>
              <option value="seed">Seed</option>
              <option value="series_a">Series A</option>
              <option value="series_b">Series B</option>
              <option value="growth">Growth</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Monthly Revenue (₹)</label>
            <input
              className="form-input"
              type="number"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(e.target.value)}
              placeholder="e.g., 4500000"
              disabled={isResearching || isStarting}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Team Size</label>
          <input
            className="form-input"
            type="number"
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
            placeholder="e.g., 28"
            disabled={isResearching || isStarting}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Key Challenge / Question</label>
          <textarea
            className="form-textarea"
            value={challenge}
            onChange={(e) => setChallenge(e.target.value)}
            placeholder="e.g., Should we pivot to B2B? Are our unit economics sustainable at scale?"
            disabled={isResearching || isStarting}
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
          disabled={!companyName.trim() || isResearching || isStarting}
          style={{ width: '100%', marginTop: 8 }}
        >
          {isResearching ? (
            <>
              <span className="spinner" /> Researching {companyName}...
            </>
          ) : isStarting ? (
            <>
              <span className="spinner" /> Launching Boardroom...
            </>
          ) : (
            <>
              <Search size={18} /> Research & Enter Boardroom
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
