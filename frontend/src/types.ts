/* ── Types for PitchX Frontend ── */

export interface Company {
  id: string;
  name: string;
  website?: string;
  mode: string;
  sessions_count: number;
  memory_count: number;
  last_active?: string;
  created_at?: string;
}

export interface CompanyCreateResponse {
  company_id: string;
  is_returning: boolean;
  sessions_count: number;
  last_active: string;
  name: string;
}

export interface PitchStartResponse {
  session_id: string;
  company_id: string;
  stream_url: string;
  has_memory: boolean;
  has_brief: boolean;
}

export interface HRStartResponse {
  hr_session_id: string;
  stream_url: string;
}

// ─── SSE Event Types ──────────────────────────────

export type DebateEventType =
  | 'memory_loaded'
  | 'evidence_ranked'
  | 'research_injected'
  | 'reality_gap_loaded'
  | 'round_start'
  | 'agent_start'
  | 'token'
  | 'agent_done'
  | 'claim'
  | 'conflict'
  | 'round_summary'
  | 'synthesis_start'
  | 'business_plan'
  | 'board_resolution'
  | 'memory_save'
  | 'memory_rejected'
  | 'guard_check'
  | 'hr_guard'
  | 'action_guard'
  | 'done'
  | 'error'
  | 'stream_end';

export interface DebateEvent {
  type: DebateEventType;
  [key: string]: any;
}

export interface ClaimTag {
  verified: boolean;
  source_key?: string;
  text: string;
  source_url?: string;
  evidence_id?: string;
  evidence_score?: number;
  downgraded?: boolean;
}

export interface AgentMessage {
  agent: string;
  content: string;
  round: number;
  confidence?: number;
  isComplete: boolean;
  emoji?: string;
  color?: string;
  title?: string;
  claims?: ClaimTag[];
}

export interface RealityGap {
  score: number;
  severity: string;
  gaps: Array<{
    claim: string;
    reality: string;
    source: string;
    severity: string;
  }>;
  summary?: string;
}

export interface BoardResolution {
  votes: Record<string, 'APPROVE' | 'CONDITIONAL' | 'REJECT'>;
  conditions: string[];
  dissent: string;
  board_verdict: 'GO' | 'CONDITIONAL_GO' | 'NO_GO';
}

export interface RoundSummary {
  round: number;
  conflicts: string[];
  agreements: string[];
}

export interface BusinessPlan {
  executive_summary?: string;
  market_opportunity?: {
    target_market: string;
    market_size: string;
    growth_rate: string;
    key_trends: string[];
  };
  value_proposition?: string;
  competitive_advantage?: string[];
  business_model?: {
    revenue_streams: string[];
    pricing_strategy: string;
    unit_economics: string;
  };
  go_to_market?: {
    icp: string;
    channels: string[];
    first_90_days: string;
  };
  technical_plan?: {
    tech_stack: string[];
    mvp_features: string[];
    build_timeline: string;
  };
  financial_projections?: {
    initial_investment: string;
    monthly_burn: string;
    revenue_timeline: string;
    break_even: string;
  };
  risk_matrix?: Array<{
    risk: string;
    severity: string;
    mitigation: string;
  }>;
  key_conflicts_resolved?: string[];
  unresolved_questions?: string[];
  next_steps?: string[];
}

// ─── HR Types ──────────────────────────────────

export interface CandidateInput {
  id: string;
  name: string;
  resume_text: string;
  interview_transcript?: string;
}

export interface CandidateEvaluation {
  candidate_name: string;
  composite_fit_score: number;
  verdict: 'HIRE' | 'REJECT' | 'NEXT_ROUND';
  scores?: {
    technical_fit: number;
    culture_fit: number;
    growth_potential: number;
    execution_evidence: number;
    risk_flags: number;
    communication: number;
  };
  strengths?: string[];
  concerns?: string[];
  follow_up_questions?: string[];
}

export interface HRResult {
  ranked_list: string[];
  evaluations: CandidateEvaluation[];
  team_gap_analysis?: {
    filled_by_hiring: string[];
    still_missing: string[];
    critical_gap: string;
  };
}

// ─── Research Types ──────────────────────────────

export interface ResearchQuery {
  key: string;
  status: 'pending' | 'done' | 'error';
  found?: boolean;
  answer_preview?: string;
}

export interface CompanyBrief {
  company_name: string;
  website?: string;
  product_description?: string;
  funding_status?: {
    total_raised: string;
    last_round: string;
    investors: string[];
    valuation: string;
  };
  market_position?: {
    market_size: string;
    growth_rate: string;
  };
  competitive_landscape?: Array<{
    name: string;
    strength: string;
    weakness: string;
    funding: string;
  }>;
  reputation_data?: {
    glassdoor_rating?: number;
    customer_rating?: number;
    top_complaints: string[];
    top_praises: string[];
  };
  recent_news_summary?: string;
  red_flags_detected?: string[];
  research_sources?: string[];
  evidence_pack?: Array<{
    id: string;
    source_key: string;
    title: string;
    url?: string;
    content: string;
    score: number;
    provider?: string;
  }>;
  trustops?: {
    provider: string;
    model: string;
    ranked_count: number;
    generated_at?: string;
  };
}

// ─── App State ──────────────────────────────────

export type AppView = 'home' | 'idea_input' | 'company_input' | 'boardroom' | 'hr_panel';

export interface MemoryEvent {
  agent: string;
  key: string;
  rejected?: boolean;
  reason?: string;
}

export interface TrustOpsState {
  provider?: string;
  model?: string;
  evidenceRanked: number;
  verifiedClaims: number;
  assumptions: number;
  downgradedClaims: number;
  guardChecksPassed: number;
  guardChecksFailed: number;
  hrPiiRedactions: number;
  actionsAwaitingApproval: number;
  actionsBlocked: number;
  latestEvents: Array<{
    type: string;
    label: string;
    status: 'safe' | 'warning' | 'blocked' | 'info';
  }>;
}

export interface AppState {
  view: AppView;
  mode: 'new_idea' | 'existing' | 'hr_only';
  companyId?: string;
  companyName?: string;
  sessionId?: string;
  isDebating: boolean;
  currentRound: number;
  agentMessages: AgentMessage[];
  roundSummaries: RoundSummary[];
  businessPlan?: BusinessPlan;
  investorScore?: number;
  killProbability?: number;
  boardResolution?: BoardResolution;
  realityGap?: RealityGap;
  researchQueries: ResearchQuery[];
  companyBrief?: CompanyBrief;
  hrResult?: HRResult;
  memorySaves: MemoryEvent[];
  memoryCount: number;
  isReturning: boolean;
  trustOps: TrustOpsState;
  error?: string;
}
