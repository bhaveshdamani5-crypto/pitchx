# PitchX — Multi-Agent Startup Simulator & Company Evaluator
### Context Document v2.0 | Hackathon Build Guide | Team of 2 | 4-Hour Sprint

---

## 🎯 One-Line Pitch

> **PitchX is a multi-agent boardroom simulator where AI executives debate your startup idea OR evaluate your existing company — powered by real-time market research, competitor analysis, and persistent agent memory — to produce a battle-tested business plan before you ever talk to a real investor.**

---

## 🧠 Why This Wins

The hackathon description literally reads: *"what we want to build is a Multi-Agent Startup Simulator."*
You are building exactly what the judges want to see — and you need to build it **better than anyone else in the room.**

This document is your complete playbook.

---

## 🔴 The Problem You're Solving (Frame This Right)

**For new ideas:** Most founders pitch to investors with zero prior adversarial stress-testing. They spend 6 months building, then walk into a partner meeting and get destroyed by questions they never thought to ask themselves.

**For existing startups:** Running companies make decisions in echo chambers. The CEO "feels" the market is growing, the CTO "thinks" the tech is fine, but nobody has done real competitive intelligence. They don't know what customers say on G2, what competitors just launched, or how their unit economics compare to industry benchmarks.

**For both:** There's no tool that combines real-time company research, adversarial multi-agent debate, AND persistent memory that learns and tracks your progress over time.

AI agents today fall into three failure modes:
1. **Single-agent assistants** — One LLM that just "plays along" with your idea
2. **Demo-zone multi-agent systems** — Multiple LLMs with different system prompts that take turns speaking, but never actually *conflict, challenge, or force synthesis*
3. **Amnesiac agents** — Every session starts from zero. No memory of past debates, no tracking of how your company evolved, no compounding intelligence

**PitchX bridges ALL these gaps.** It runs a real adversarial simulation where agents have fundamentally different incentive structures, access to live research tools (Tavily, Exa, Serper), persistent memory across sessions, and are forced to reach consensus through structured debate rounds — using REAL data about YOUR company.

---

## 💡 The Expanded Idea (What Makes This Different)

### What the basic demo would look like (don't do this):
```
User: "I want to start a restaurant"
Agent 1 (CEO): "Great idea! Here's a vision..."
Agent 2 (CFO): "Here are some costs..."
Agent 3 (CTO): "Here's some tech..."
→ Output: A generic text blob
```

### What PitchX actually does:

**1. User enters their startup idea + key parameters**
```
Idea: "AI-powered dark kitchen for college campuses"
Budget: ₹50 lakhs
Market: Tier-1 Indian cities
Timeline: 18 months to profitability
```

**2. Orchestrator Agent spawns 5 specialized agents with real tool access**

| Agent | Role | Personality | Tools |
|-------|------|-------------|-------|
| **CEO** | Vision, market opportunity, competitive moat | Optimistic, big-picture, risk-tolerant | Web search (market data, trends) |
| **CFO** | Unit economics, burn rate, fundraising | Conservative, data-obsessed, skeptical | Financial calculator, market sizing |
| **CTO** | Tech feasibility, build vs buy, infrastructure | Pragmatic, timeline-focused, blunt | Tech stack evaluator, complexity scorer |
| **CMO** | GTM, customer acquisition, brand | Creative, growth-hacker mindset | Web search (competitor analysis) |
| **Devil's Advocate** | Challenges EVERY assumption | Adversarial, Socratic, never satisfied | All tools |

**3. Structured Multi-Round Debate Protocol**
- **Round 1 — First Impressions**: Each agent independently evaluates the idea (no cross-reading)
- **Round 2 — Cross-Examination**: Agents respond directly to each other's arguments with `@mentions`
- **Round 3 — Synthesis**: Agents are forced to reach compromise positions and sign off with confidence scores
- **Final Round — Devil's Advocate Attack**: One final adversarial pass that both agents and the user must counter

**4. Live output artifacts**
- Real-time streaming debate in a "boardroom" UI
- Structured Business Plan document generated from consensus
- Risk Matrix with confidence scores from each agent
- "Investor Readiness Score" (0-100) based on how well the debate resolved
- **Company Research Dossier** — automated competitor, review, and market analysis (Company Mode)
- **Memory Timeline** — how agent opinions evolved across sessions

---

## 🔀 Dual Mode: New Idea vs. Existing Company

PitchX operates in two modes. The user selects their mode on the input screen.

### Mode 1 — New Idea (Original Flow)
User enters a startup idea with key parameters. Agents evaluate from scratch using web research.

### Mode 2 — Existing Company / Running Startup (NEW)
User provides their company details. The system **automatically researches the company** using third-party APIs before the debate begins.

**User Input for Company Mode:**
```
Company Name: "FreshBasket"
Website URL: "freshbasket.in"
Industry: "D2C Grocery Delivery"
Stage: Seed / Series A / Series B / Growth
Monthly Revenue: ₹45 lakhs
Team Size: 28
Key Challenge: "Struggling with unit economics in Tier-2 cities"
What do you want evaluated: "Should we pivot to B2B supply chain?"
```

**Pre-Debate Research Pipeline (Automated — runs before agents start):**

| Step | Tool | What It Does |
|------|------|--------------|
| 1. Company Profile | Tavily Extract | Scrapes company website → mission, products, pricing, team |
| 2. Customer Reviews | Tavily Search | Searches G2, Capterra, Trustpilot, Google Reviews, Glassdoor |
| 3. Competitor Discovery | Exa (Semantic Search) | Finds similar companies by meaning, not just keywords |
| 4. Competitor Deep-Dive | Tavily Search + Extract | Top 5 competitors' positioning, pricing, funding, reviews |
| 5. Market Analysis | Tavily Search | Industry reports, TAM/SAM/SOM, growth rates, regulatory landscape |
| 6. News & Sentiment | Serper (Google Search) | Recent press, funding news, social media sentiment |
| 7. Financial Benchmarks | Tavily Search | Industry-specific CAC, LTV, churn, margin benchmarks |

This **research dossier** becomes the agent context — giving every agent real data about YOUR specific company, not generic industry knowledge.

**What changes in Company Mode:**
- **CEO Agent** receives competitor landscape + market sizing data from Exa/Tavily
- **CFO Agent** receives industry financial benchmarks + your actual revenue data
- **CTO Agent** receives your current tech stack (scraped from job postings/website)
- **CMO Agent** receives your positioning vs competitors + real customer reviews
- **Devil's Advocate** receives EVERYTHING + negative reviews + competitor advantages

---

## 🧠 Persistent Agent Memory

PitchX agents **remember across sessions**. This is NOT just conversation history — it's structured, queryable knowledge that compounds over time.

### Memory Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MEMORY LAYER (SQLite)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  SESSION      │  │  COMPANY     │  │  AGENT           │  │
│  │  MEMORY       │  │  PROFILES    │  │  MEMORY          │  │
│  │               │  │              │  │                  │  │
│  │ • Past debates│  │ • Cached     │  │ • What CEO said  │  │
│  │ • Outcomes    │  │   research   │  │   last time      │  │
│  │ • User prefs  │  │ • Reviews    │  │ • CFO's concerns │  │
│  │ • Follow-ups  │  │ • Competitors│  │ • Unresolved     │  │
│  │               │  │ • Financials │  │   conflicts      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  EVOLUTION TRACKER                                    │   │
│  │  • Tracks how agent opinions change across sessions   │   │
│  │  • "CFO confidence went from 4/10 → 7/10 after       │   │
│  │    pivot to subscription model"                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### SQLite Memory Schema

```sql
-- Session history
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    company_id TEXT,
    mode TEXT CHECK(mode IN ('idea', 'company')),
    idea_params JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    investor_readiness_score INTEGER,
    status TEXT DEFAULT 'active'
);

-- Company profiles (cached research)
CREATE TABLE companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    website TEXT,
    industry TEXT,
    research_data JSON,   -- Full Tavily/Exa research dossier
    reviews JSON,         -- Aggregated customer reviews
    competitors JSON,     -- Discovered competitors
    last_researched TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Per-agent, per-company structured memory
CREATE TABLE agent_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT REFERENCES sessions(id),
    company_id TEXT REFERENCES companies(id),
    agent_name TEXT NOT NULL,
    memory_type TEXT CHECK(memory_type IN
        ('observation', 'concern', 'recommendation', 'conflict', 'consensus')),
    content TEXT NOT NULL,
    confidence_score REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track how agent confidence evolves over time
CREATE TABLE confidence_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id TEXT REFERENCES companies(id),
    agent_name TEXT NOT NULL,
    session_id TEXT REFERENCES sessions(id),
    confidence_score REAL,
    key_factors JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### How Memory Is Used

1. **Before a new debate**: Agents receive a "memory brief" — summary of past observations, concerns, and unresolved conflicts
2. **During the debate**: New observations are tagged and stored in real-time
3. **After the debate**: A "What Changed" report shows how agent opinions evolved
4. **Cross-session**: Users can ask "What did the CFO think last time?" and get real answers

### Memory-Powered Features
- **"Continue from last session"** — Resume a debate with full context
- **"What changed?"** — Compare current vs previous agent assessments
- **"Track my progress"** — See Investor Readiness Score evolution over time
- **"Iterative refinement"** — Make changes, re-run; agents remember what they said before
- **"Company dashboard"** — Persistent view of all research + debate history for a company

---

## 🔍 Third-Party Research Pipeline

### Tool Stack

| Tool | Purpose | API | Free Tier |
|------|---------|-----|-----------|
| **Tavily Search** | AI-optimized web search for market data, news, trends | `tavily.com/api` | 1000 req/mo |
| **Tavily Extract** | Scrape & structure content from specific URLs | `tavily.com/api` | Included |
| **Exa (Semantic Search)** | Find similar companies, semantic competitor discovery | `exa.ai/api` | 1000 req/mo |
| **Serper** | Google Search results (reviews, news, financial data) | `serper.dev` | 2500 queries |
| **Anthropic Web Search** | Built-in Claude web search (fallback) | Claude API | Included |

### Research Pipeline Flow (Company Mode)

```
User Input (Company Name + URL)
        │
        ▼
┌─────────────────────────────────┐
│   STEP 1: COMPANY PROFILE       │
│   Tavily Extract → company URL  │
│   Output: mission, products,    │
│   pricing, team, tech stack     │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│   STEP 2: REVIEW AGGREGATION    │
│   Tavily Search →               │
│   "[company] reviews" on G2,    │
│   Trustpilot, Glassdoor         │
│   Output: sentiment, themes     │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│   STEP 3: COMPETITOR DISCOVERY  │
│   Exa → semantic search for     │
│   "companies similar to [desc]" │
│   Output: top 10 competitors    │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│   STEP 4: COMPETITOR DEEP DIVE  │
│   Tavily Extract → top 5 URLs   │
│   Tavily Search → pricing,      │
│   funding, reviews per company  │
│   Output: per-competitor profile │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│   STEP 5: MARKET ANALYSIS       │
│   Tavily + Serper → industry    │
│   TAM/SAM/SOM, CAGR, trends,   │
│   regulatory risks              │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│   STEP 6: NEWS & SENTIMENT      │
│   Serper → recent press,        │
│   funding, partnerships         │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│   RESEARCH DOSSIER COMPLETE     │
│   → Cached in SQLite            │
│   → Fed to all agents as context│
│   → Refreshed every 24 hours    │
└─────────────────────────────────┘
```

### Research Dossier Schema

```json
{
  "company_profile": {
    "name": "FreshBasket",
    "website": "freshbasket.in",
    "description": "D2C grocery delivery...",
    "products": [],
    "pricing_model": "...",
    "tech_stack_detected": ["React", "Node.js", "AWS"]
  },
  "reviews": {
    "aggregate_sentiment": "mixed",
    "average_rating": 3.6,
    "total_reviews_found": 142,
    "positive_themes": ["fast delivery", "fresh produce"],
    "negative_themes": ["pricing", "limited coverage"],
    "platforms": {
      "google_reviews": {"rating": 3.8, "count": 89},
      "trustpilot": {"rating": 3.2, "count": 53}
    }
  },
  "competitors": [
    {
      "name": "BigBasket",
      "website": "bigbasket.com",
      "strengths": ["scale", "brand recognition"],
      "weaknesses": ["slow delivery in Tier-2"],
      "funding": "Series F, $300M+"
    }
  ],
  "market_analysis": {
    "tam": "$45B Indian grocery delivery market",
    "sam": "$12B online grocery in Tier-1 cities",
    "som": "$500M D2C organic grocery niche",
    "cagr": "28%",
    "key_trends": [],
    "regulatory_risks": []
  },
  "recent_news": [],
  "last_updated": "2026-06-06T12:00:00Z"
}
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PITCHX FRONTEND                        │
│  [Mode Select] → [Input Form] → [Boardroom] → [Biz Plan]   │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP + SSE (Streaming)
┌─────────────────────▼───────────────────────────────────────┐
│                   FASTAPI BACKEND                           │
│  /api/pitch/start  /api/pitch/stream  /api/pitch/export     │
│  /api/company/research  /api/sessions  /api/memory          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              RESEARCH PIPELINE (Company Mode)               │
│  [Tavily Search] [Tavily Extract] [Exa Semantic] [Serper]   │
│  → Builds Research Dossier → Caches in SQLite               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               ORCHESTRATOR AGENT                            │
│  • Manages debate rounds                                    │
│  • Routes messages between agents                           │
│  • Detects conflicts and resolution                         │
│  • Loads agent memory from previous sessions                │
│  • Aggregates final output                                  │
└──┬────────┬────────┬─────────┬──────────────────────────────┘
   │        │        │         │
┌──▼──┐ ┌───▼──┐ ┌───▼──┐ ┌───▼──┐ ┌──────────────────┐
│ CEO │ │ CFO  │ │ CTO  │ │ CMO  │ │ Devil's Advocate │
│Agent│ │Agent │ │Agent │ │Agent │ │     Agent        │
└──┬──┘ └───┬──┘ └───┬──┘ └───┬──┘ └────────┬─────────┘
   │        │        │        │              │
┌──▼────────▼────────▼────────▼──────────────▼─────────┐
│                    TOOL LAYER                         │
│  [Tavily Search] [Tavily Extract] [Exa Semantic]     │
│  [Serper] [Financial Calc] [Market Sizer]            │
│  [Tech Stack Evaluator] [Competitor Finder]          │
└──────────────────────┬────────────────────────────────┘
                       │
┌──────────────────────▼────────────────────────────────┐
│              PERSISTENT MEMORY (SQLite)               │
│  [Sessions] [Companies] [Agent Memory] [Confidence]  │
│  → Survives restarts → Compounds intelligence        │
└──────────────────────────────────────────────────────┘
```

---

## 🤖 Agent Design (Detailed System Prompts)

### CEO Agent
```
You are the CEO of a startup evaluating whether to pursue this business idea.
You are optimistic but not naive. Your job is to:
- Identify the BIGGEST market opportunity
- Articulate a compelling vision and mission
- Identify the 3 key competitive moats
- Call out dependencies on other team members' domains

When responding to other agents, use @CFO, @CTO, @CMO to direct questions.
You MUST disagree with the CFO if their burn rate projections kill the vision.
You MUST challenge the CTO if their timeline is too conservative.

Format: Start with CONFIDENCE_SCORE: X/10, then your analysis.
Tools: Use web search to find real market size data for this industry.
```

### CFO Agent
```
You are the CFO. You believe all startup ideas are guilty of financial recklessness 
until proven innocent. Your job is to:
- Calculate realistic CAC, LTV, and payback period
- Model a 24-month P&L with optimistic/base/pessimistic scenarios
- Identify the 3 biggest financial risks
- Set hard conditions: "This only works IF [condition X] is met"

You have access to a financial calculator. Always run numbers.
Never accept vague market size claims from the CEO without data.
If the math doesn't work at scale, say so clearly and with numbers.

Format: Start with CONFIDENCE_SCORE: X/10, then your analysis.
Always include at least one concrete table: 3-column (Optimistic/Base/Pessimistic).
```

### CTO Agent
```
You are the CTO. You care about whether this can actually be built, in what time,
by how many engineers, at what cost. Your job is to:
- Evaluate technical feasibility (1-10)
- Recommend tech stack with justification
- Identify the 3 biggest technical risks
- Estimate MVP build time (weeks) with team size
- Flag over-engineered features that should be cut from V1

You are pragmatic. If the CEO wants AI in everything, you will push back.
Use first-principles reasoning: build vs buy, custom vs off-the-shelf.

Format: Start with CONFIDENCE_SCORE: X/10, then your analysis.
Include a table: Feature | Build vs Buy | Time Estimate | Priority (MVP/V2/V3)
```

### CMO Agent
```
You are the CMO. You think about the human on the other end: who are they,
what do they feel, how do we reach them. Your job is to:
- Define the ICP (Ideal Customer Profile) with specificity
- Design a 90-day GTM strategy
- Identify 3 acquisition channels with estimated CAC for each
- Write the brand positioning statement (1 sentence)
- Find 3 direct competitors and differentiation strategy

Use web search to research competitor positioning and real user pain points.
Never accept "our users are everyone" from the CEO.

Format: Start with CONFIDENCE_SCORE: X/10, then your analysis.
Include competitor table: Name | Strength | Weakness | Our Differentiation
```

### Devil's Advocate Agent
```
You are a sand-bagging, deeply skeptical investor. You have seen 1000 pitches 
and every "revolutionary idea" turned out to be a feature, not a company.
Your job is to find the FATAL FLAW in this plan. Ask:

- Who said customers actually want this?
- What happens when Google/Amazon/[incumbent] copies this in 6 months?
- Why would the best engineers join this company over FAANG?
- What's the REAL reason the last 3 companies that tried this failed?
- If you had to kill this company in 12 months, how would you do it?

After all agents have spoken, your job is to synthesize the 3 strongest 
objections from the entire debate and present them as investor questions.

Format: Start with KILL_PROBABILITY: X/10 (how likely this startup fails),
then your 3 killer questions.
```

### Orchestrator Agent
```
You are the debate orchestrator for PitchX. You manage a structured debate
between CEO, CFO, CTO, CMO, and Devil's Advocate agents.

Your responsibilities:
1. Detect when agents DISAGREE (flag with 🔴 CONFLICT)
2. Detect when agents AGREE (flag with 🟢 CONSENSUS)
3. Force resolution: "CEO and CFO disagree on burn rate. Force a compromise."
4. Track which arguments have been made and avoid repetition
5. At the end of each round, produce a ROUND SUMMARY: key conflicts, key agreements
6. LOAD MEMORY: Before each debate, retrieve past session memories for this
   company/idea. Inject a "Memory Brief" into each agent's context.
7. TRACK EVOLUTION: After each debate, compare agent confidence scores
   to previous sessions and flag significant changes.
8. In COMPANY MODE: Ensure agents reference the Research Dossier data
   (real reviews, real competitors, real market data) — not generic assumptions.

Output the final CONSENSUS BUSINESS PLAN only after Round 3 + Devil's Advocate.
The business plan must cite which agent championed each section.

Memory Brief format (injected before Round 1):
"MEMORY FROM PREVIOUS SESSIONS:
- Session on [date]: CEO confidence 7/10, CFO flagged burn rate risk,
  unresolved conflict: market size assumptions.
- Agent [X] previously recommended [Y] — check if still relevant."
```

---

## ⚙️ Technical Stack

### Backend
```
Language:           Python 3.11+
Framework:          FastAPI
Streaming:          Server-Sent Events (SSE) via asyncio generators
AI SDK:            anthropic (Python SDK)
Model:             claude-sonnet-4-20250514
Web Search:        Tavily API (primary) + Anthropic built-in (fallback)
Semantic Search:   Exa API (competitor discovery)
Google Search:     Serper API (reviews, news)
URL Extraction:    Tavily Extract API (scrape company websites)
Persistent Memory: SQLite3 (built into Python, zero-setup)
Task Orchestration: asyncio (concurrent agent calls)
CORS:              FastAPI CORS middleware
Export:            Python-docx OR markdown-it
```

### Frontend
```
Framework:       React 18 + TypeScript
Styling:         TailwindCSS + custom CSS
Icons:           Lucide React
Streaming:       EventSource API (SSE client)
State:           useState + useReducer (no Redux needed)
Animations:      Framer Motion OR CSS transitions
Export:          html2pdf.js for business plan export
Build:           Vite
```

### Infrastructure (Hackathon-grade)
```
Dev:             localhost (no deployment needed for demo)
Database:        SQLite (file-based, zero-config, persists across restarts)
API Keys:        .env file (see below)
CORS:            localhost:5173 ↔ localhost:8000
```

### API Keys Required (.env)
```
ANTHROPIC_API_KEY=your_key_here
TAVILY_API_KEY=your_key_here       # Free: tavily.com (1000 req/mo)
EXA_API_KEY=your_key_here           # Free: exa.ai (1000 req/mo)
SERPER_API_KEY=your_key_here        # Free: serper.dev (2500 queries)
```

---

## 📁 File Structure

```
pitchx/
├── backend/
│   ├── main.py                  # FastAPI app, routes, CORS
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── ceo.py               # CEO agent class + system prompt
│   │   ├── cfo.py               # CFO agent class + system prompt
│   │   ├── cto.py               # CTO agent class + system prompt
│   │   ├── cmo.py               # CMO agent class + system prompt
│   │   ├── devil.py             # Devil's Advocate agent
│   │   └── orchestrator.py      # Debate orchestrator + memory injection
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── tavily_search.py     # Tavily Search API wrapper
│   │   ├── tavily_extract.py    # Tavily Extract API (URL scraping)
│   │   ├── exa_search.py        # Exa semantic search (competitor discovery)
│   │   ├── serper_search.py     # Serper Google Search (reviews, news)
│   │   └── financial_calc.py    # Financial calculation tool
│   ├── research/
│   │   ├── __init__.py
│   │   ├── pipeline.py          # Research pipeline orchestrator
│   │   ├── company_profiler.py  # Step 1: Scrape company website
│   │   ├── review_aggregator.py # Step 2: Aggregate reviews
│   │   ├── competitor_finder.py # Step 3-4: Find + analyze competitors
│   │   ├── market_analyzer.py   # Step 5: Market size + trends
│   │   └── news_scanner.py      # Step 6: Recent news + sentiment
│   ├── memory/
│   │   ├── __init__.py
│   │   ├── database.py          # SQLite connection + schema setup
│   │   ├── session_store.py     # CRUD for sessions table
│   │   ├── company_store.py     # CRUD for companies + research cache
│   │   ├── agent_memory.py      # CRUD for agent observations/concerns
│   │   └── evolution_tracker.py # Track confidence scores over time
│   ├── schemas.py               # Pydantic models (idea + company modes)
│   ├── debate_engine.py         # Core debate loop (memory-aware)
│   ├── pitchx.db                # SQLite database file (auto-created)
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── components/
    │   │   ├── ModeSelector.tsx  # Step 0: Choose Idea vs Company mode
    │   │   ├── IdeaInput.tsx     # Step 1a: Idea input form
    │   │   ├── CompanyInput.tsx  # Step 1b: Company input form (NEW)
    │   │   ├── ResearchStatus.tsx # Research pipeline progress (NEW)
    │   │   ├── Boardroom.tsx     # Step 2: Live debate arena
    │   │   ├── AgentCard.tsx     # Individual agent speech bubble
    │   │   ├── MemoryBadge.tsx   # Shows "Remembers 3 past sessions" (NEW)
    │   │   ├── RoundSummary.tsx  # Round conflict/consensus summary
    │   │   ├── BusinessPlan.tsx  # Step 3: Output document
    │   │   ├── InvestorScore.tsx # Investor readiness score
    │   │   ├── CompanyDashboard.tsx # Persistent company view (NEW)
    │   │   └── EvolutionChart.tsx   # Confidence score timeline (NEW)
    │   ├── hooks/
    │   │   ├── useDebateStream.ts  # SSE stream handler
    │   │   ├── useDebateState.ts   # State management
    │   │   └── useSessionHistory.ts # Fetch past sessions (NEW)
    │   ├── types/
    │   │   └── debate.ts
    │   └── main.tsx
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

---

## 🔌 API Design

### POST `/api/pitch/start` (Idea Mode)
```json
Request:
{
  "mode": "idea",
  "idea": "AI-powered dark kitchen for college campuses",
  "budget": 5000000,
  "currency": "INR",
  "market": "India",
  "timeline_months": 18,
  "founder_background": "2 ex-Swiggy engineers"
}

Response:
{
  "session_id": "uuid-v4",
  "stream_url": "/api/pitch/stream/uuid-v4",
  "memory_context": null
}
```

### POST `/api/pitch/start` (Company Mode)
```json
Request:
{
  "mode": "company",
  "company_name": "FreshBasket",
  "website": "freshbasket.in",
  "industry": "D2C Grocery Delivery",
  "stage": "series_a",
  "monthly_revenue": 4500000,
  "currency": "INR",
  "team_size": 28,
  "key_challenge": "Struggling with unit economics in Tier-2 cities",
  "evaluation_focus": "Should we pivot to B2B supply chain?",
  "founder_background": "2 ex-Swiggy engineers"
}

Response:
{
  "session_id": "uuid-v4",
  "company_id": "uuid-v4",
  "research_status_url": "/api/company/research/status/uuid-v4",
  "stream_url": "/api/pitch/stream/uuid-v4",
  "memory_context": {
    "previous_sessions": 2,
    "last_session_date": "2026-06-01T10:00:00Z",
    "last_investor_readiness": 62
  }
}
```

### GET `/api/company/research/status/{company_id}` (SSE — Research Progress)
```
data: {"type": "research_start", "step": "company_profile", "label": "Scraping website..."}
data: {"type": "research_progress", "step": "company_profile", "status": "done", "summary": "Found 12 products..."}
data: {"type": "research_start", "step": "reviews", "label": "Aggregating reviews..."}
data: {"type": "research_progress", "step": "reviews", "status": "done", "summary": "142 reviews, 3.6 avg"}
data: {"type": "research_start", "step": "competitors", "label": "Discovering competitors..."}
data: {"type": "research_progress", "step": "competitors", "status": "done", "summary": "Found 8 competitors"}
data: {"type": "research_start", "step": "market", "label": "Analyzing market..."}
data: {"type": "research_progress", "step": "market", "status": "done", "summary": "TAM: $45B, CAGR: 28%"}
data: {"type": "research_done", "dossier_summary": {...}}
```

### GET `/api/pitch/stream/{session_id}` (SSE — Debate Stream)
```
data: {"type": "memory_loaded", "sessions_found": 2, "summary": "..."}
data: {"type": "research_context", "dossier": {...}}  // Company mode only
data: {"type": "round_start", "round": 1, "label": "First Impressions"}
data: {"type": "agent_start", "agent": "CEO", "round": 1}
data: {"type": "token", "agent": "CEO", "content": "The opportunity here..."}
data: {"type": "tool_call", "agent": "CEO", "tool": "tavily_search", "query": "dark kitchen market India 2026"}
data: {"type": "tool_result", "agent": "CEO", "result": "Market size: $2.3B..."}
data: {"type": "agent_done", "agent": "CEO", "confidence": 8, "full_response": "..."}
data: {"type": "conflict", "between": ["CEO", "CFO"], "topic": "burn rate"}
data: {"type": "consensus", "topic": "tech stack", "agreed_by": ["CTO", "CEO"]}
data: {"type": "round_summary", "round": 1, "conflicts": [...], "agreements": [...]}
data: {"type": "business_plan", "content": {...}}
data: {"type": "memory_saved", "observations_stored": 14}
data: {"type": "evolution", "changes": [{"agent": "CFO", "prev": 4, "now": 7}]}
data: {"type": "done"}
```

### GET `/api/sessions/{company_id}` (Session History)
```json
Response:
{
  "sessions": [
    {
      "id": "uuid",
      "created_at": "2026-06-01T10:00:00Z",
      "investor_readiness_score": 62,
      "key_conflicts": ["burn rate", "market timing"],
      "mode": "company"
    }
  ]
}
```

### GET `/api/memory/{session_id}` (Agent Memory for a Session)
```json
Response:
{
  "memories": [
    {
      "agent": "CFO",
      "type": "concern",
      "content": "Unit economics in Tier-2 don't support expansion",
      "confidence": 6
    }
  ]
}
```

### GET `/api/pitch/export/{session_id}`
```
Returns: PDF/DOCX of business plan + research dossier + memory timeline
```

---

## 💻 Core Implementation Code

### Backend: debate_engine.py

```python
import anthropic
import asyncio
from typing import AsyncGenerator

client = anthropic.Anthropic()

AGENTS = {
    "CEO": {"prompt": CEO_SYSTEM_PROMPT, "color": "#3B82F6"},
    "CFO": {"prompt": CFO_SYSTEM_PROMPT, "color": "#10B981"},
    "CTO": {"prompt": CTO_SYSTEM_PROMPT, "color": "#8B5CF6"},
    "CMO": {"prompt": CMO_SYSTEM_PROMPT, "color": "#F59E0B"},
    "Devil": {"prompt": DEVIL_SYSTEM_PROMPT, "color": "#EF4444"},
}

async def run_agent_stream(
    agent_name: str,
    idea: str,
    context: str,
    round_num: int
) -> AsyncGenerator[dict, None]:
    
    yield {"type": "agent_start", "agent": agent_name, "round": round_num}
    
    full_response = ""
    
    with client.messages.stream(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        system=AGENTS[agent_name]["prompt"],
        messages=[{
            "role": "user",
            "content": f"""
STARTUP IDEA: {idea}

CONTEXT FROM PREVIOUS AGENTS:
{context}

Round {round_num} — Provide your analysis.
{"Respond DIRECTLY to the other agents' points above." if round_num > 1 else "Give your independent first assessment."}
"""
        }],
        tools=[{
            "type": "web_search_20250305",
            "name": "web_search"
        }]
    ) as stream:
        for event in stream:
            if hasattr(event, 'type'):
                if event.type == 'content_block_delta':
                    if hasattr(event.delta, 'text'):
                        token = event.delta.text
                        full_response += token
                        yield {"type": "token", "agent": agent_name, "content": token}
    
    # Parse confidence score from response
    confidence = parse_confidence(full_response)
    yield {"type": "agent_done", "agent": agent_name, 
           "confidence": confidence, "full_response": full_response}


async def run_debate(idea_params: dict) -> AsyncGenerator[dict, None]:
    idea = idea_params["idea"]
    debate_context = []
    
    # ROUND 1: Independent assessments (parallel)
    yield {"type": "round_start", "round": 1, "label": "First Impressions"}
    
    for agent_name in ["CEO", "CFO", "CTO", "CMO"]:
        context_str = ""  # No cross-context in round 1
        async for event in run_agent_stream(agent_name, idea, context_str, 1):
            yield event
            if event["type"] == "agent_done":
                debate_context.append(f"[{agent_name}]: {event['full_response']}")
    
    # Detect conflicts after round 1
    conflicts = await detect_conflicts(debate_context)
    for c in conflicts:
        yield {"type": "conflict", "between": c["agents"], "topic": c["topic"]}
    
    yield {"type": "round_summary", "round": 1, "conflicts": conflicts}
    
    # ROUND 2: Cross-examination
    yield {"type": "round_start", "round": 2, "label": "Cross-Examination"}
    context_str = "\n\n".join(debate_context)
    
    for agent_name in ["CEO", "CFO", "CTO", "CMO"]:
        async for event in run_agent_stream(agent_name, idea, context_str, 2):
            yield event
            if event["type"] == "agent_done":
                debate_context.append(f"[{agent_name} Round 2]: {event['full_response']}")
    
    # ROUND 3: Devil's Advocate
    yield {"type": "round_start", "round": 3, "label": "Devil's Advocate"}
    full_context = "\n\n".join(debate_context)
    
    async for event in run_agent_stream("Devil", idea, full_context, 3):
        yield event
        if event["type"] == "agent_done":
            debate_context.append(f"[Devil's Advocate]: {event['full_response']}")
    
    # Generate Business Plan
    business_plan = await synthesize_business_plan(idea, debate_context)
    yield {"type": "business_plan", "content": business_plan}
    yield {"type": "done"}
```

### Backend: main.py

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import uuid
import asyncio
from debate_engine import run_debate
from schemas import PitchRequest

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions = {}

@app.post("/api/pitch/start")
async def start_pitch(request: PitchRequest):
    session_id = str(uuid.uuid4())
    sessions[session_id] = request.dict()
    return {"session_id": session_id}

@app.get("/api/pitch/stream/{session_id}")
async def stream_pitch(session_id: str):
    params = sessions.get(session_id)
    if not params:
        return {"error": "Session not found"}
    
    async def event_generator():
        async for event in run_debate(params):
            yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(0)  # yield control
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )
```

### Frontend: useDebateStream.ts

```typescript
import { useState, useCallback } from 'react';

export interface DebateEvent {
  type: 'agent_start' | 'token' | 'agent_done' | 'conflict' | 
        'consensus' | 'round_start' | 'round_summary' | 'business_plan' | 'done';
  agent?: string;
  content?: string;
  round?: number;
  confidence?: number;
  full_response?: string;
  between?: string[];
  topic?: string;
  conflicts?: Conflict[];
}

export interface AgentMessage {
  agent: string;
  content: string;
  confidence?: number;
  isStreaming: boolean;
  round: number;
}

export function useDebateStream() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [businessPlan, setBusinessPlan] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  const startDebate = useCallback(async (ideaParams: object) => {
    setIsRunning(true);
    setMessages([]);
    
    // Start session
    const res = await fetch('/api/pitch/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ideaParams)
    });
    const { session_id } = await res.json();
    
    // Stream events
    const eventSource = new EventSource(`/api/pitch/stream/${session_id}`);
    
    eventSource.onmessage = (e) => {
      const event: DebateEvent = JSON.parse(e.data);
      
      switch (event.type) {
        case 'round_start':
          setCurrentRound(event.round!);
          break;
          
        case 'agent_start':
          setActiveAgent(event.agent!);
          setMessages(prev => [...prev, {
            agent: event.agent!,
            content: '',
            isStreaming: true,
            round: event.round!
          }]);
          break;
          
        case 'token':
          setMessages(prev => prev.map((m, i) => 
            i === prev.length - 1 && m.agent === event.agent
              ? { ...m, content: m.content + event.content! }
              : m
          ));
          break;
          
        case 'agent_done':
          setMessages(prev => prev.map((m, i) =>
            i === prev.length - 1 && m.agent === event.agent
              ? { ...m, isStreaming: false, confidence: event.confidence }
              : m
          ));
          setActiveAgent(null);
          break;
          
        case 'conflict':
          setConflicts(prev => [...prev, { 
            agents: event.between!, 
            topic: event.topic! 
          }]);
          break;
          
        case 'business_plan':
          setBusinessPlan(event.content);
          break;
          
        case 'done':
          setIsRunning(false);
          eventSource.close();
          break;
      }
    };
    
    eventSource.onerror = () => {
      setIsRunning(false);
      eventSource.close();
    };
  }, []);

  return { messages, conflicts, currentRound, businessPlan, isRunning, 
           activeAgent, startDebate };
}
```

---

## 🎨 UI Design — The Boardroom

### Visual Design Direction
- **Aesthetic**: Dark, high-contrast "war room" / "boardroom" feel
- **Color Palette**: 
  - Background: `#0A0A0F` (near black)
  - Surface: `#111118` (card backgrounds)
  - Accent: `#F59E0B` (amber - decision/alert color)
  - CEO: `#3B82F6` (blue)
  - CFO: `#10B981` (green - money)
  - CTO: `#8B5CF6` (purple - tech)
  - CMO: `#F59E0B` (amber - creative)
  - Devil: `#EF4444` (red - danger)
  - Conflict: Red flash overlay
  - Consensus: Green flash overlay

### Screen 0: Mode Selector (NEW)
```
┌─────────────────────────────────────────────────────────┐
│  PITCHX                            [Logo top-left]      │
│                                                         │
│  "Stress-test your idea before the real thing"         │
│                                                         │
│  What would you like to evaluate?                      │
│                                                         │
│  ┌────────────────────┐  ┌────────────────────────┐    │
│  │  💡 NEW IDEA       │  │  🏢 EXISTING COMPANY    │    │
│  │                    │  │                        │    │
│  │  I have a startup  │  │  I have a running      │    │
│  │  idea and want it  │  │  startup/project and   │    │
│  │  stress-tested     │  │  want it evaluated     │    │
│  │                    │  │  with real data         │    │
│  │  [SELECT →]        │  │  [SELECT →]             │    │
│  └────────────────────┘  └────────────────────────┘    │
│                                                         │
│  📊 Past Sessions: [View 3 previous evaluations →]     │
└─────────────────────────────────────────────────────────┘
```

### Screen 1a: Idea Input (Original)
```
┌─────────────────────────────────────────────────────────┐
│  PITCHX — New Idea Mode            [← Back to modes]   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Describe your startup idea...                  │   │
│  │  [Large textarea, placeholder with example]     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Budget: [₹ input]    Market: [dropdown]               │
│  Timeline: [slider: 6-36 months]                       │
│  Your background: [textarea, optional]                 │
│                                                         │
│  [ENTER THE BOARDROOM →]  ← CTA button               │
└─────────────────────────────────────────────────────────┘
```

### Screen 1b: Company Input (NEW)
```
┌─────────────────────────────────────────────────────────┐
│  PITCHX — Company Mode             [← Back to modes]   │
│                                                         │
│  Company Name: [________________]                      │
│  Website URL:  [________________]                      │
│  Industry:     [dropdown ▼]                            │
│  Stage:        [Seed] [A] [B] [Growth] ← toggle       │
│                                                         │
│  Monthly Revenue: [₹ input]   Team Size: [input]       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  What's your biggest challenge right now?       │   │
│  │  [textarea]                                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  What do you want the board to evaluate?        │   │
│  │  e.g. "Should we pivot?", "Are we ready for     │   │
│  │  Series B?", "How do we beat [competitor]?"     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🔍 We'll research your company, competitors,         │
│     reviews, and market before the debate starts.      │
│                                                         │
│  [RESEARCH & ENTER BOARDROOM →]                        │
└─────────────────────────────────────────────────────────┘
```

### Screen 1c: Research Progress (NEW — Company Mode only)
```
┌─────────────────────────────────────────────────────────┐
│  PITCHX — Researching FreshBasket                       │
│                                                         │
│  Building your research dossier...                     │
│                                                         │
│  ✅ Company Profile        Scraped freshbasket.in       │
│  ✅ Customer Reviews       142 reviews, 3.6★ avg       │
│  ✅ Competitor Discovery   8 competitors found          │
│  🔄 Competitor Deep-Dive   Analyzing BigBasket...      │
│  ⏳ Market Analysis        Queued                       │
│  ⏳ News & Sentiment       Queued                       │
│                                                         │
│  ████████████░░░░░░░░░░░  55% complete                 │
│                                                         │
│  💡 Previous session found (June 1) — agents will      │
│     remember their past analysis.                      │
└─────────────────────────────────────────────────────────┘
```

### Screen 2: Boardroom Arena (The Core UI)
```
┌─────────────────────────────────────────────────────────────┐
│  PITCHX Boardroom          ROUND 2/3 ████████░░ 75%        │
│                                                             │
│  🔴 CONFLICT: CEO vs CFO — Burn rate disagreement          │
│                                                             │
│  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │  AGENTS          │  │  DEBATE ARENA                   │ │
│  │                  │  │                                 │ │
│  │ 🔵 CEO   [8/10] │  │  ┌─────────────────────────┐   │ │
│  │ 🟢 CFO   [6/10] │  │  │ 🔵 CEO — Round 1        │   │ │
│  │ 🟣 CTO   [9/10] │  │  │ "The dark kitchen market │   │ │
│  │ 🟡 CMO   [7/10] │  │  │  in India is growing    │   │ │
│  │ 🔴 Devil [—]    │  │  │  at 45% CAGR..." ▌      │   │ │
│  │                  │  │  └─────────────────────────┘   │ │
│  │  Conflicts: 2    │  │                                 │ │
│  │  Agreements: 3   │  │  ┌─────────────────────────┐   │ │
│  │                  │  │  │ 🟢 CFO — Round 1        │   │ │
│  │  [⬇ Export Plan] │  │  │ "The unit economics     │   │ │
│  └──────────────────┘  │  │  don't support this..." │   │ │
│                         │  └─────────────────────────┘   │ │
│                         └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Screen 3: Business Plan Output
```
┌─────────────────────────────────────────────────────────────┐
│  PITCHX — Business Plan                                     │
│  Generated from 3-round debate | Investor Readiness: 74/100 │
│                                                             │
│  [📄 Export PDF]  [🔄 New Simulation]  [🔗 Share]          │
│                                                             │
│  1. Executive Summary          [Championed by: CEO]        │
│  2. Market Analysis            [Source: CEO + CMO]         │
│  3. Financial Projections      [Source: CFO]               │
│  4. Technology Plan            [Source: CTO]               │
│  5. Go-to-Market Strategy      [Source: CMO]               │
│  6. Risk Matrix                [Source: Devil's Advocate]  │
│  7. Unresolved Conflicts       [Requires founder attention]│
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Business Plan Output Schema

```json
{
  "mode": "idea | company",
  "session_id": "uuid",
  "company_id": "uuid | null",
  "executive_summary": "string",

  "company_context": {
    "_note": "Only present in company mode",
    "name": "string",
    "website": "string",
    "stage": "string",
    "current_revenue": "string",
    "team_size": 0,
    "key_challenge": "string",
    "research_dossier_id": "uuid"
  },

  "market_opportunity": {
    "tam": "string",
    "sam": "string",
    "som": "string",
    "data_sources": ["Tavily Search", "Exa"],
    "source": "CEO"
  },

  "competitive_landscape": {
    "_note": "Populated from Research Pipeline in company mode",
    "competitors": [
      {
        "name": "string",
        "strengths": [],
        "weaknesses": [],
        "our_differentiation": "string",
        "data_source": "Exa + Tavily"
      }
    ],
    "source": "CMO + Research Pipeline"
  },

  "customer_sentiment": {
    "_note": "Populated from review aggregation in company mode",
    "average_rating": 0,
    "total_reviews": 0,
    "positive_themes": [],
    "negative_themes": [],
    "platforms_checked": [],
    "source": "Research Pipeline"
  },

  "financial_projections": {
    "scenarios": {
      "optimistic": {"year1": 0, "year2": 0, "year3": 0},
      "base": {"year1": 0, "year2": 0, "year3": 0},
      "pessimistic": {"year1": 0, "year2": 0, "year3": 0}
    },
    "cac": "string",
    "ltv": "string",
    "runway_months": 0,
    "industry_benchmarks": {
      "avg_cac": "string",
      "avg_ltv": "string",
      "avg_churn": "string",
      "data_source": "Tavily Search"
    },
    "source": "CFO"
  },

  "tech_plan": {
    "current_stack": [],
    "recommended_stack": [],
    "mvp_timeline_weeks": 0,
    "team_size": 0,
    "build_vs_buy": [],
    "source": "CTO"
  },

  "gtm_strategy": {
    "icp": "string",
    "channels": [],
    "brand_positioning": "string",
    "competitors": [],
    "source": "CMO"
  },

  "risk_matrix": {
    "risks": [
      {"risk": "string", "severity": "HIGH|MEDIUM|LOW", "mitigation": "string"}
    ],
    "kill_probability": 0,
    "source": "Devil's Advocate"
  },

  "unresolved_conflicts": [],
  "investor_readiness_score": 0,
  "agent_confidence_scores": {
    "CEO": 8, "CFO": 6, "CTO": 9, "CMO": 7
  },

  "memory_context": {
    "previous_sessions_count": 0,
    "confidence_evolution": {
      "CEO": [{"session": "uuid", "date": "...", "score": 7}, {"session": "uuid", "date": "...", "score": 8}],
      "CFO": [{"session": "uuid", "date": "...", "score": 4}, {"session": "uuid", "date": "...", "score": 7}]
    },
    "key_changes_since_last": [
      "CFO confidence improved from 4→7 after subscription pivot",
      "New competitor 'QuickCart' entered market since last session"
    ]
  }
}
```

---

## ⏱️ 4-Hour Build Plan

### Hour 1 (11:30 AM – 12:30 PM) — Foundation
**Person 1 (Backend):**
- [ ] Set up FastAPI project with folder structure
- [ ] Install deps: `anthropic`, `fastapi`, `uvicorn`, `python-dotenv`
- [ ] Write CEO agent with hardcoded system prompt
- [ ] Test basic single-agent Anthropic API call with streaming
- [ ] Set up SSE endpoint with dummy events

**Person 2 (Frontend):**
- [ ] `npm create vite@latest pitchx-frontend -- --template react-ts`
- [ ] Install: `tailwindcss`, `lucide-react`, `framer-motion`
- [ ] Build `IdeaInput.tsx` — the form screen (static first)
- [ ] Build `Boardroom.tsx` — layout scaffold
- [ ] Set up `useDebateStream.ts` with EventSource

**Sync checkpoint at 12:30**: Connect FE form to BE endpoint, see first streaming token in browser console

---

### Hour 2 (12:30 PM – 1:30 PM) — Core Debate Loop
**Person 1 (Backend):**
- [ ] Write all 5 agent system prompts (CFO, CTO, CMO, Devil)
- [ ] Build `debate_engine.py` with Round 1 sequential loop
- [ ] Wire up all agents to stream through single SSE endpoint
- [ ] Test: full Round 1 completing successfully

**Person 2 (Frontend):**
- [ ] Wire SSE events to state in `useDebateStream.ts`
- [ ] Build `AgentCard.tsx` — streaming text bubble with color-coded agent
- [ ] Display tokens as they arrive (the "typewriter" effect)
- [ ] Add agent status indicators (thinking, speaking, done)
- [ ] Test: See all 4 agents stream into UI

**Sync checkpoint at 1:30**: See Round 1 debate running end-to-end in browser

---

### Hour 3 (1:30 PM – 2:30 PM) — Differentiation Features
**Person 1 (Backend):**
- [ ] Add Round 2 (cross-examination context injection)
- [ ] Add Devil's Advocate as Round 3
- [ ] Add `detect_conflicts()` function (LLM-powered or keyword-matching)
- [ ] Add `synthesize_business_plan()` function (calls Anthropic to aggregate)
- [ ] Wire business plan JSON output to SSE

**Person 2 (Frontend):**
- [ ] Build `RoundSummary.tsx` — conflict flash animation (red border flash)
- [ ] Build consensus indicator (green highlight)
- [ ] Build `BusinessPlan.tsx` — structured output renderer
- [ ] Add `InvestorScore.tsx` — the 0-100 gauge UI element
- [ ] Add agent confidence badges (X/10 shown on each card)

**Sync checkpoint at 2:30**: Full debate runs, business plan renders

---

### Hour 4 (2:30 PM – 3:30 PM) — Polish + Demo Prep
**Person 1 (Backend):**
- [ ] Add error handling + retry logic (3 attempts per agent)
- [ ] Add `/api/pitch/export` endpoint returning markdown
- [ ] Test with 3 different startup ideas
- [ ] Fix any rate limiting / timeout issues

**Person 2 (Frontend):**
- [ ] Polish the Boardroom UI — colors, typography, spacing
- [ ] Add loading animations (pulsing dots while agent "thinks")
- [ ] Add the progress bar (Round X/3, percentage)
- [ ] Export button → downloads markdown business plan
- [ ] Test on different screen sizes

**Final 1 hour (3:30 - 4:30 PM) — Demo Polish**
- [ ] Record a backup video of the app working (in case demo issues)
- [ ] Prepare 3 demo scenarios (restaurant, SaaS B2B, edtech)
- [ ] Rehearse the 3-minute demo script (see below)
- [ ] Deploy locally and ensure app runs without issues
- [ ] Create a short README

---

## 🎭 Demo Script (3 Minutes for Judges)

### Minute 1: Hook (30 seconds)
*"Every great startup pitch sounds amazing in the founder's head. PitchX puts your idea in a boardroom before you step in front of real investors. Watch as AI executives debate, challenge, and stress-test your idea in real time."*

→ Type: *"I want to build a ₹5 crore dark kitchen network for college campuses in Bangalore"*
→ Click "Enter the Boardroom"

### Minute 2: The Debate (90 seconds)
*"Round 1 — first impressions. Watch how the CEO sees a massive opportunity, but the CFO immediately pushes back on the burn rate."*

→ Point out the CONFLICT notification appearing
→ *"That's not just two agents disagreeing — PitchX detects when fundamental assumptions clash and flags them for resolution."*

→ Round 2 starts: *"Round 2 — cross-examination. The CEO now HAS to respond to the CFO's numbers. They're referencing each other's arguments."*

→ Devil's Advocate appears: *"And then... the Devil's Advocate. The agent who's seen 1000 pitches and knows exactly how to kill your company."*

### Minute 3: The Output (60 seconds)
*"After 3 rounds, PitchX synthesizes everything into a structured business plan — with each section credited to the agent who championed it, unresolved conflicts highlighted as action items, and an Investor Readiness Score."*

→ Show the business plan with 74/100 score
→ Show the Risk Matrix from the Devil's Advocate
→ Export the plan

*"PitchX doesn't just build a prettier ChatGPT wrapper. It builds a real adversarial agent system with tool use, cross-agent context, conflict detection, and structured synthesis. This is what production-grade multi-agent AI looks like."*

---

## 🏆 Judging Criteria Alignment

### Innovation (25%) — Why You Score High
- **Multi-round adversarial debate** with cross-agent context injection (not just sequential LLM calls)
- **Conflict detection** using a meta-agent that reads all outputs and identifies logical contradictions
- **Investor Readiness Score** — a composite metric from agent confidence scores and unresolved conflicts
- **Devil's Advocate layer** — a purpose-built adversarial agent, not just a negative persona

### Technical Complexity (25%) — Why You Score High
- **Server-Sent Events** for real-time streaming (not polling, not websockets)
- **Multi-round context management** — each round's context feeds into the next
- **Tool use** — web search calls integrated into agent responses
- **Structured JSON synthesis** — LLM as aggregator with schema enforcement
- **Concurrent agent architecture** — asyncio-based parallel agent execution potential

### Impact (25%) — Why You Score High
- **TAM**: Every founder, student, startup idea generator
- **Immediate pain point**: Founders pitch unprepared → lose rounds → waste months
- **Scalable**: Could be a SaaS product (PitchX Pro) with industry-specific agent personas
- **Demo-ready use case**: Judges are entrepreneurs, they've felt this pain personally

### Presentation & Usability (25%) — Why You Score High
- **The boardroom UI** is visually distinctive — not generic AI chat
- **Live streaming** makes the demo dynamic and compelling
- **3 distinct screens** with clear UX flow: Input → Debate → Output
- **Conflict flash animations** are memorable and demonstrate the core value
- **Export functionality** shows this is production-intent, not just a prototype

---

## 🔑 What Makes This NOT a Demo-Zone Project

The hackathon theme is: *"Easy to build an AI agent that looks good in a demo. Hard to build one that works in the real world."*

Frame PitchX as solving this problem for itself:

1. **Agents fail with vague prompts** → PitchX enforces structured prompts with mandatory sections and format requirements (CONFIDENCE_SCORE prefix, mandatory tables from CFO, etc.)

2. **Agents lose context over long conversations** → PitchX uses round-based context windowing — each round only injects the most relevant prior outputs, not the full history

3. **Agents agree with each other too easily** → The Devil's Advocate agent is architecturally prevented from reading other agents' outputs until Round 3, forcing an independent adversarial pass

4. **Multi-agent systems have no consensus mechanism** → PitchX's orchestrator detects conflicts between agents' fundamental positions (burn rate, market size, feasibility) and surfaces them explicitly

5. **Demo outputs are unstructured blobs** → Business plan output is structured JSON with required fields, citations to specific agents, and confidence scores — usable, not just readable

---

## 🚀 Stretch Goals (Only If Time Permits)

If you finish early, implement these in priority order:

**P0 (High Impact, Low Effort):**
- [ ] Add a "Challenge the Plan" mode — user can ask the agents follow-up questions after the initial debate
- [ ] Add 3 preset startup templates (SaaS, Marketplace, D2C) as quick-start examples
- [ ] Add an animated "thinking" indicator per agent (dots pulsing while API call is in flight)

**P1 (Medium Impact, Medium Effort):**
- [ ] Add industry-specific agent variant presets (e.g., Fintech-specific CFO has different risk parameters)
- [ ] Add a "Replay" mode — step back through the debate round by round
- [ ] Store session results in localStorage for the demo session

**P2 (Skip if short on time):**
- [ ] PDF export via `@react-pdf/renderer`
- [ ] Shareable URL for the business plan
- [ ] Dark/light mode toggle

---

## 🛑 Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| API rate limits during demo | Cache one pre-run debate result as fallback. Show the UI with real data even if live API is slow. |
| Streaming drops / SSE disconnects | Add reconnection logic in EventSource; show "reconnecting..." state |
| Agent responses too long / cost too high | Set max_tokens=1000 per agent, max 2 rounds in demo mode |
| Backend crashes during demo | Have a static JSON file with a complete debate result that can be loaded instantly |
| Frontend looks generic | Use the dark "war room" aesthetic described above — makes it memorable even if agents are slow |
| Time runs out before Round 2 is built | Make sure Round 1 with all 4 agents works FIRST. A polished 1-round demo > a broken 3-round demo |

---

## 📦 Setup Commands

```bash
# Backend
mkdir pitchx && cd pitchx
mkdir -p backend/{agents,tools,research,memory}
cd backend
python -m venv venv && source venv/bin/activate
pip install fastapi uvicorn anthropic python-dotenv python-multipart \
  tavily-python exa-py httpx aiosqlite

# .env file
cat > .env << EOF
ANTHROPIC_API_KEY=your_key_here
TAVILY_API_KEY=your_key_here
EXA_API_KEY=your_key_here
SERPER_API_KEY=your_key_here
EOF

# Run backend
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd ../
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install tailwindcss postcss autoprefixer lucide-react
npx tailwindcss init -p
npm run dev
```

---

## 🏁 Final Checklist Before Submission

- [ ] App runs on localhost without errors
- [ ] At least 3 agent responses stream successfully
- [ ] Conflict detection shows at least 1 conflict in demo
- [ ] Business plan renders with all 6 sections
- [ ] Investor Readiness Score shows a number
- [ ] Export button works (even if just copies markdown to clipboard)
- [ ] README.md written with setup instructions
- [ ] Code pushed to GitHub (public repo)
- [ ] Demo rehearsed at least once end-to-end
- [ ] Backup video recorded in case of live demo issues

---

## 💬 One-Liner Answers to Judge Questions

**"How is this different from just calling ChatGPT 4 times?"**
> "PitchX implements a structured adversarial debate protocol with persistent memory and real-time research. Agents read each other's arguments and are forced to directly rebut them. The Orchestrator detects logical conflicts. The Devil's Advocate is architecturally isolated until Round 3. Agents use Tavily, Exa, and Serper to pull real competitor data, customer reviews, and market analysis. And they REMEMBER what they said in your last session. None of that happens in 4 parallel ChatGPT calls."

**"Is this production-grade or just a demo?"**
> "Persistent SQLite memory that survives restarts. Real third-party API integrations (Tavily, Exa, Serper) for live market research. Round-based context windowing. Structured JSON outputs. Confidence score evolution tracking across sessions. This isn't a demo — it's a platform."

**"Can this work for existing companies, not just ideas?"**
> "Yes — that's our Company Mode. Enter your company URL, and PitchX automatically scrapes your website, aggregates customer reviews from G2/Trustpilot/Glassdoor, discovers competitors via semantic search, and pulls real market data. All of this feeds into the debate as hard evidence. The agents argue about YOUR company with YOUR data."

**"What's your business model?"**
> "PitchX Pro — ₹999/month for founders (includes persistent memory + 10 research sessions). ₹10,000/session for accelerators. Enterprise: ₹5L/year for VCs to continuously monitor and stress-test portfolio companies with real market data."

---

*PitchX — Where your startup idea survives the boardroom before it faces the world.*

---

**Document created for hackathon on June 6, 2026**
**Team: 2 members | Track: General | Time: 4-hour sprint (11:30 AM – 4:30 PM)**