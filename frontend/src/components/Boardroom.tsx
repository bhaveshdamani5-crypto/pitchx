import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Download, Brain } from 'lucide-react';
import type { AppState } from '../types';
import AgentCard from './AgentCard';
import ScoreGauges from './ScoreGauges';
import BusinessPlanView from './BusinessPlanView';
import RealityGapBanner from './RealityGapBanner';
import BoardResolutionCard from './BoardResolutionCard';
import TrustOpsPanel from './TrustOpsPanel';
import ChatPanel from './ChatPanel';

interface BoardroomProps {
  state: AppState;
  onBack: () => void;
  onDebateEvent: (event: any) => void;
  onGoToHR: () => void;
  onGoToVoiceArena?: () => void;
}

export default function Boardroom({ state, onBack, onGoToHR, onGoToVoiceArena }: BoardroomProps) {
  const debateEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'debate' | 'plan' | 'memory' | 'chat'>('debate');

  // Auto-scroll to latest agent message
  useEffect(() => {
    if (state.isDebating && debateEndRef.current) {
      debateEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [state.agentMessages, state.isDebating]);

  // Switch to plan tab when debate ends
  useEffect(() => {
    if (!state.isDebating && state.businessPlan) {
      setActiveTab('plan');
    }
  }, [state.isDebating, state.businessPlan]);

  const currentRoundMessages = state.agentMessages;
  const groupedByRound: Record<number, typeof currentRoundMessages> = {};
  currentRoundMessages.forEach((msg) => {
    if (!groupedByRound[msg.round]) groupedByRound[msg.round] = [];
    groupedByRound[msg.round].push(msg);
  });

  const roundLabels: Record<number, string> = {
    1: 'First Impressions',
    2: 'Cross-Examination',
    3: "Devil's Advocate",
  };

  return (
    <div className="boardroom-layout">
      {/* ─── Left: Debate Arena ─── */}
      <div className="debate-area">
        <div className="back-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Exit Boardroom
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {state.isReturning && (
              <span className="memory-badge">
                <Brain size={12} /> {state.memoryCount} memories loaded
              </span>
            )}
            {state.isDebating && (
              <div className="progress-bar" style={{ minWidth: 200 }}>
                <div className="progress-steps">
                  {[1, 2, 3].map((r) => (
                    <div
                      key={r}
                      className={`progress-step ${
                        state.currentRound > r
                          ? 'completed'
                          : state.currentRound === r
                          ? 'active'
                          : ''
                      }`}
                    />
                  ))}
                </div>
                <span className="progress-label">
                  Round {state.currentRound}/3
                </span>
              </div>
            )}
          </div>
        </div>

        {state.realityGap && <RealityGapBanner gap={state.realityGap} />}

        {/* Round headers and agent cards */}
        <AnimatePresence>
          {Object.entries(groupedByRound).map(([round, messages]) => (
            <motion.div
              key={`round-${round}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="round-header">
                <span className="round-badge">Round {round}</span>
                <span className="round-label">
                  {roundLabels[parseInt(round)] || `Round ${round}`}
                </span>
              </div>

              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.map((msg, i) => (
                  <AgentCard key={`${msg.agent}-${round}-${i}`} message={msg} />
                ))}
              </div>

              {/* Round summary badges */}
              {state.roundSummaries
                .filter((s) => s.round === parseInt(round))
                .map((summary) => (
                  <motion.div
                    key={`summary-${summary.round}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      marginTop: 12,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    {summary.conflicts.map((c, i) => (
                      <span key={`c-${i}`} className="conflict-badge conflict">
                        🔴 {c}
                      </span>
                    ))}
                    {summary.agreements.map((a, i) => (
                      <span key={`a-${i}`} className="conflict-badge agreement">
                        🟢 {a}
                      </span>
                    ))}
                  </motion.div>
                ))}

              <div style={{ height: 16 }} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Synthesis loading */}
        {state.isDebating && state.currentRound >= 3 && !state.businessPlan && (
          <div className="loading-state" style={{ padding: 30 }}>
            <div className="spinner" />
            <p>Synthesizing business plan from debate...</p>
          </div>
        )}

        {/* Empty state */}
        {state.agentMessages.length === 0 && state.isDebating && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Agents are entering the boardroom...</p>
          </div>
        )}

        {/* Memory saves */}
        {state.memorySaves.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              marginTop: 8,
            }}
          >
            {state.memorySaves.map((ms, i) => (
              <span
                key={i}
                className={`memory-badge ${ms.rejected ? 'memory-rejected' : ''}`}
                style={{ fontSize: '0.72rem' }}
              >
                {ms.rejected ? '🚫' : '💾'} {ms.agent}: {ms.key}
                {ms.rejected && ' (scope rejected)'}
              </span>
            ))}
          </motion.div>
        )}

        <div ref={debateEndRef} />
      </div>

      {/* ─── Right: Output Panel ─── */}
      <div className="output-panel">
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === 'debate' ? 'active' : ''}`}
            onClick={() => setActiveTab('debate')}
          >
            ⚔️ Status
          </button>
          <button
            className={`tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('plan')}
          >
            📋 Plan
          </button>
          <button
            className={`tab-btn ${activeTab === 'memory' ? 'active' : ''}`}
            onClick={() => setActiveTab('memory')}
          >
            🧠 Memory
          </button>
          <button
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 Chat
          </button>
        </div>

        {activeTab === 'debate' && (
          <div className="glass-card" style={{ padding: 20 }}>
            <ScoreGauges
              investorScore={state.investorScore}
              killProbability={state.killProbability}
              isDebating={state.isDebating}
            />

            <TrustOpsPanel trustOps={state.trustOps} />

            {state.boardResolution && !state.isDebating && (
              <div style={{ marginTop: 20 }}>
                <BoardResolutionCard resolution={state.boardResolution} />
              </div>
            )}

            {/* Company Brief Summary */}
            {state.companyBrief && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-secondary)' }}>
                <h4
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--text-accent)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 10,
                  }}
                >
                  📊 Intelligence Brief
                </h4>
                {state.companyBrief.reputation_data?.glassdoor_rating && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Glassdoor: ⭐ {state.companyBrief.reputation_data.glassdoor_rating}
                  </div>
                )}
                {state.companyBrief.competitive_landscape && state.companyBrief.competitive_landscape.length > 0 && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Competitors: {state.companyBrief.competitive_landscape.map(c => c.name).join(', ')}
                  </div>
                )}
                {state.companyBrief.red_flags_detected && state.companyBrief.red_flags_detected.length > 0 && (
                  <div style={{ fontSize: '0.82rem', color: '#f87171', marginBottom: 4 }}>
                    ⚠️ {state.companyBrief.red_flags_detected.length} red flags detected
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {!state.isDebating && state.businessPlan && (
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-secondary" onClick={onGoToHR}>
                  <Users size={16} /> Open HR Panel
                </button>
                {onGoToVoiceArena && (
                  <button className="btn btn-primary" onClick={onGoToVoiceArena} style={{ background: 'var(--accent-gradient)' }}>
                    🎙️ Enter Live Voice Arena
                  </button>
                )}
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    const plan = JSON.stringify(state.businessPlan, null, 2);
                    navigator.clipboard.writeText(plan);
                  }}
                >
                  <Download size={14} /> Copy Plan as JSON
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="glass-card" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {state.businessPlan ? (
              <BusinessPlanView plan={state.businessPlan} />
            ) : (
              <div className="empty-state">
                <span className="icon">📋</span>
                <p>Business plan will appear after the debate completes.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="glass-card" style={{ padding: 20, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            <h4
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 16,
              }}
            >
              🧠 Agent Memory Saves
            </h4>
            {state.memorySaves.length > 0 ? (
              state.memorySaves.map((ms, i) => (
                <div key={i} className={`memory-item ${ms.rejected ? 'memory-item-rejected' : ''}`}>
                  <div className="mem-agent" style={{ color: getAgentColor(ms.agent) }}>
                    {ms.agent} {ms.rejected ? '🚫' : '💾'}
                  </div>
                  <div className="mem-key">
                    {ms.key}
                    {ms.rejected && (
                      <span style={{ color: '#f87171', fontSize: '0.75rem' }}>
                        {' '}— rejected (agent scope)
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: 30 }}>
                <span className="icon">💾</span>
                <p>Memory saves will appear as agents complete their analysis.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="glass-card" style={{ height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
            <ChatPanel companyId={state.companyId!} />
          </div>
        )}
      </div>

      {/* Error toast */}
      {state.error && (
        <div className="toast" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          ⚠️ {state.error}
        </div>
      )}
    </div>
  );
}

function getAgentColor(agent: string): string {
  const colors: Record<string, string> = {
    CEO: '#3b82f6',
    CFO: '#10b981',
    CTO: '#8b5cf6',
    CMO: '#f59e0b',
    Devil: '#ef4444',
    "Devil's Advocate": '#ef4444',
    HR: '#ec4899',
  };
  return colors[agent] || '#6b7280';
}
