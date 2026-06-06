# PitchX — Adaptive Multi-Agent Startup Intelligence Platform
### Context Document v2.0 | Hackathon Build Guide | Team of 2 | 5.25-Hour Sprint

---

## 🎯 One-Line Pitch

> **PitchX is a persistent multi-agent boardroom that stress-tests any startup — new idea or live company — using real market intelligence, adversarial AI executives with memory, and an AI HR panel that evaluates your team candidates against the plan they just built.**

---

## 🔁 What Changed from v1 → v2

| Feature | v1 | v2 |
|---------|----|----|
| Operating mode | New ideas only | New ideas + **Running startups** |
| Agent memory | Per-session only | **Persistent SQLite memory across sessions** |
| Research | Anthropic web_search only | **Tavily + web_fetch + company review scrapers** |
| Agents | CEO, CFO, CTO, CMO, Devil | Same + **HR Agent with resume/transcript evaluation** |
| Company context | User-typed only | **Auto-ingested from URL: reviews, news, competitors, funding** |
| Output | Business plan | Business plan + **Hiring recommendations + team gap analysis** |

---

## 🧠 Why This Wins the Hackathon

The hackathon problem statement says agents fail because they:
- Lack long-term memory ← **PitchX has persistent agent memory**
- Break on real-world edge cases ← **PitchX uses live third-party data, not hallucinations**
- Can't authenticate or act safely for users ← **PitchX scopes all actions to a company namespace**
- Are demo-zone products ← **PitchX works for real running companies with real data**

The judges are builders and entrepreneurs. **They will test PitchX with their own companies.** The moment a judge types in "Authsome" or "BrowserWire" and sees PitchX pull real Glassdoor reviews, real competitor data, real funding news, and have agents debate it with memory of a previous session — **you win.**

---

## 🔴 The Expanded Problem

### For New Founders:
Founders pitch with zero adversarial stress-testing. 6 months of building → one partner meeting → destroyed by questions they never considered.

### For Running Startups (The New Unlock):
Existing startups face a different but worse problem: **they're too close to their own product to see what's broken.** Their agents, advisors, and boards all suffer from politeness bias. No one tells the CEO that the GTM is wrong, the CTO that the architecture is a ticking bomb, or the CFO that the unit economics don't work at scale.

**PitchX gives any running startup a merciless AI board that:**
- Ingests your real company data (website, reviews, news, funding)
- Remembers what was discussed in the last session
- Tells you what your real board is too polite to say
- Finds you the best people to fix what's broken

---

## 💡 Dual Operating Modes

### Mode 1: New Idea Mode
```
Input: Startup idea description + parameters
Agents: Evaluate from scratch, no prior data
Research: Industry/market research via tools
Output: Business plan + hiring plan for founding team
Memory: Creates new company namespace, saves first session
```

### Mode 2: Existing Startup Mode  
```
Input: Company name + website URL (optional: funding stage, MRR, challenges)
Agents: Auto-ingest real company data FIRST, then debate
Research: Pulls actual reviews, competitors, news, funding data
Output: Strategic audit + course-correction plan + hiring gaps
Memory: Loads previous sessions, agents reference past decisions
```

**The key difference:** In Mode 2, before agents say a single word, the Research Ingestion Layer fires off 8 parallel searches and builds a company intelligence brief that all agents read. Agents argue from real data, not the founder's self-description.

---

## 🏗️ Full System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          PITCHX FRONTEND                             │
│                                                                      │
│  ┌──────────────┐   ┌─────────────────────┐   ┌───────────────────┐ │
│  │ MODE SELECT  │   │  BOARDROOM ARENA    │   │  OUTPUT PANEL     │ │
│  │ New Idea     │   │  Live Debate Stream │   │  Business Plan    │ │
│  │ Existing Co. │   │  Agent Cards        │   │  HR Report        │ │
│  │ HR Only Mode │   │  Memory Timeline    │   │  Investor Score   │ │
│  └──────────────┘   └─────────────────────┘   └───────────────────┘ │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ HTTP + SSE
┌─────────────────────────────▼────────────────────────────────────────┐
│                         FASTAPI BACKEND                              │
│  POST /api/company/create          GET /api/company/{id}/memory      │
│  POST /api/pitch/start             GET /api/pitch/stream/{sid}       │
│  POST /api/hr/evaluate             GET /api/pitch/export/{sid}       │
│  GET  /api/research/ingest/{url}                                     │
└──────────────────────┬────────────────────────────────┬──────────────┘
                       │                                │
┌──────────────────────▼──────────┐   ┌────────────────▼─────────────┐
│    RESEARCH INGESTION LAYER     │   │    PERSISTENT MEMORY LAYER   │
│                                 │   │                              │
│  • Tavily: Market analysis      │   │  SQLite: pitchx_memory.db   │
│  • Tavily: Competitor finder    │   │  Tables:                    │
│  • web_search: Co. reviews      │   │   - companies               │
│  • web_search: Glassdoor data   │   │   - agent_memories          │
│  • web_search: Funding news     │   │   - debate_sessions         │
│  • web_fetch: Company website   │   │   - business_plan_versions  │
│  • web_search: LinkedIn data    │   │   - hr_decisions            │
│  • web_search: G2/Capterra      │   │                              │
│                                 │   │  Per-company namespace:     │
│  → Produces: CompanyBrief JSON  │   │  Each company = isolated    │
└──────────────────────┬──────────┘   │  memory context             │
                       │              └────────────────┬─────────────┘
┌──────────────────────▼──────────────────────────────▼──────────────┐
│                      ORCHESTRATOR AGENT                             │
│  • Loads memory for this company before spawning agents             │
│  • Injects CompanyBrief + agent-specific memories into prompts      │
│  • Manages debate rounds with conflict detection                    │
│  • Routes CEO→CFO cross-examination                                 │
│  • Saves updated memories after each session                        │
└────┬──────┬──────┬──────┬──────────────┬───────────────────────────┘
     │      │      │      │              │
  ┌──▼─┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌───────▼──────┐ ┌──────────────────┐
  │CEO │ │CFO │ │CTO │ │CMO │ │  Devil's     │ │   HR Agent       │
  │    │ │    │ │    │ │    │ │  Advocate    │ │  (Resume Mode)   │
  └────┘ └────┘ └────┘ └────┘ └──────────────┘ └──────────────────┘
     │      │      │      │              │              │
┌────▼──────▼──────▼──────▼──────────────▼──────────────▼───────────┐
│                         TOOL LAYER                                  │
│                                                                     │
│  tavily_search(query, max_results)  → Structured research results  │
│  web_search(query)                  → Anthropic built-in search    │
│  web_fetch(url)                     → Full page content fetch      │
│  financial_calc(formula, params)    → Financial modeling helper    │
│  resume_parser(text)                → Extract structured resume    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Research Ingestion Layer (The Real Differentiator)

When a user inputs an existing company, before ANY agent speaks, this layer fires:

### 8 Parallel Research Queries

```python
RESEARCH_QUERIES = {
    "company_overview":    "{company} company overview product description",
    "glassdoor_reviews":   "{company} glassdoor employee reviews culture rating",
    "customer_reviews":    "{company} G2 Capterra Trustpilot user reviews rating",
    "competitors":         "{company} competitors alternatives market comparison",
    "funding_news":        "{company} funding rounds valuation Crunchbase investment",
    "recent_news":         "{company} news 2025 2026 latest developments",
    "market_landscape":    "{industry} market size growth trends 2025 2026",
    "founder_background":  "{company} founder CEO team LinkedIn background"
}
```

### Company Intelligence Brief Schema

```json
{
  "company_name": "string",
  "website": "string",
  "ingestion_timestamp": "ISO8601",
  "product_description": "string",
  "funding_status": {
    "total_raised": "string",
    "last_round": "string",
    "investors": ["string"],
    "valuation": "string"
  },
  "market_position": {
    "market_size": "string",
    "growth_rate": "string",
    "market_share_estimate": "string"
  },
  "competitive_landscape": [
    {
      "name": "string",
      "strength": "string",
      "weakness": "string",
      "funding": "string"
    }
  ],
  "reputation_data": {
    "glassdoor_rating": "number",
    "glassdoor_review_summary": "string",
    "customer_rating": "number",
    "customer_sentiment_summary": "string",
    "top_complaints": ["string"],
    "top_praises": ["string"]
  },
  "recent_news_summary": "string",
  "red_flags_detected": ["string"],
  "research_sources": ["url"]
}
```

### Implementation

```python
# research_ingestion.py
import asyncio
from tavily import TavilyClient
import anthropic

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
claude = anthropic.Anthropic()

async def ingest_company(company_name: str, website_url: str = None) -> dict:
    """Run all 8 research queries in parallel, synthesize into CompanyBrief."""
    
    queries = {
        key: template.format(company=company_name, industry="{industry}")
        for key, template in RESEARCH_QUERIES.items()
    }
    
    # Fire all Tavily searches concurrently
    tasks = [
        asyncio.create_task(search_tavily(key, query))
        for key, query in queries.items()
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    raw_data = {list(queries.keys())[i]: r for i, r in enumerate(results)}
    
    # Also fetch the actual website if provided
    if website_url:
        website_content = await fetch_website(website_url)
        raw_data["website_content"] = website_content
    
    # Use Claude to synthesize raw search results into structured CompanyBrief
    synthesis_prompt = f"""
    You have been given raw research data about {company_name}.
    Synthesize this into a structured company intelligence brief.
    
    RAW DATA:
    {json.dumps(raw_data, indent=2)[:8000]}  # Token limit
    
    Return ONLY valid JSON matching the CompanyBrief schema. No preamble.
    """
    
    response = claude.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[{"role": "user", "content": synthesis_prompt}]
    )
    
    brief = json.loads(response.content[0].text)
    return brief


async def search_tavily(key: str, query: str) -> dict:
    try:
        result = tavily.search(
            query=query,
            search_depth="advanced",
            max_results=5,
            include_answer=True
        )
        return {"key": key, "answer": result.get("answer"), "results": result.get("results", [])}
    except Exception as e:
        return {"key": key, "error": str(e)}
```

---

## 🧠 Persistent Memory Architecture

### Database Schema (SQLite)

```sql
-- pitchx_memory.db

CREATE TABLE companies (
    id TEXT PRIMARY KEY,           -- UUID
    name TEXT NOT NULL,
    website TEXT,
    mode TEXT,                     -- 'new_idea' | 'existing'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME,
    company_brief JSON             -- Latest CompanyBrief from research ingestion
);

CREATE TABLE agent_memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id TEXT REFERENCES companies(id),
    agent_name TEXT NOT NULL,      -- 'CEO' | 'CFO' | 'CTO' | 'CMO' | 'Devil' | 'HR'
    memory_key TEXT NOT NULL,      -- 'established_vision' | 'financial_model' | etc.
    memory_value TEXT NOT NULL,    -- JSON string
    confidence REAL,               -- 0.0 - 1.0
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, agent_name, memory_key) ON CONFLICT REPLACE
);

CREATE TABLE debate_sessions (
    id TEXT PRIMARY KEY,           -- UUID
    company_id TEXT REFERENCES companies(id),
    session_type TEXT,             -- 'initial' | 'review' | 'pivot' | 'hr_only'
    round_count INTEGER,
    key_conflicts JSON,            -- Array of conflict objects
    key_agreements JSON,           -- Array of agreement objects
    investor_readiness_score INTEGER,
    summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE business_plan_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id TEXT REFERENCES companies(id),
    session_id TEXT REFERENCES debate_sessions(id),
    version INTEGER,
    plan_json JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hr_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id TEXT REFERENCES companies(id),
    session_id TEXT REFERENCES debate_sessions(id),
    position_title TEXT,
    candidate_name TEXT,
    resume_summary TEXT,
    fit_score INTEGER,             -- 0-100
    recommendation TEXT,           -- 'HIRE' | 'REJECT' | 'NEXT_ROUND'
    hr_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Memory Manager (Python)

```python
# memory_manager.py
import sqlite3
import json
from datetime import datetime

DB_PATH = "pitchx_memory.db"

class MemoryManager:
    def __init__(self):
        self._init_db()
    
    def _init_db(self):
        with sqlite3.connect(DB_PATH) as conn:
            conn.executescript(SCHEMA_SQL)  # The CREATE TABLE statements above
    
    def get_or_create_company(self, name: str, website: str = None) -> str:
        with sqlite3.connect(DB_PATH) as conn:
            row = conn.execute(
                "SELECT id FROM companies WHERE name = ?", (name,)
            ).fetchone()
            
            if row:
                conn.execute(
                    "UPDATE companies SET last_active = ? WHERE id = ?",
                    (datetime.now().isoformat(), row[0])
                )
                return row[0]
            
            company_id = str(uuid.uuid4())
            conn.execute(
                "INSERT INTO companies (id, name, website, last_active) VALUES (?,?,?,?)",
                (company_id, name, website, datetime.now().isoformat())
            )
            return company_id
    
    def save_agent_memory(self, company_id: str, agent: str, key: str, 
                          value: any, confidence: float = 0.8):
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO agent_memories 
                (company_id, agent_name, memory_key, memory_value, confidence, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (company_id, agent, key, json.dumps(value), confidence,
                  datetime.now().isoformat()))
    
    def get_agent_memory(self, company_id: str, agent: str) -> dict:
        with sqlite3.connect(DB_PATH) as conn:
            rows = conn.execute("""
                SELECT memory_key, memory_value, confidence, updated_at
                FROM agent_memories
                WHERE company_id = ? AND agent_name = ?
                ORDER BY updated_at DESC
            """, (company_id, agent)).fetchall()
            
            return {
                row[0]: {
                    "value": json.loads(row[1]),
                    "confidence": row[2],
                    "last_updated": row[3]
                }
                for row in rows
            }
    
    def get_company_history_summary(self, company_id: str) -> str:
        """Produces a natural-language memory summary injected into agent prompts."""
        sessions = self._get_sessions(company_id)
        memories = self._get_all_memories(company_id)
        
        if not sessions:
            return "No previous sessions found. This is our first analysis."
        
        summary_parts = [f"PREVIOUS SESSIONS ({len(sessions)} total):"]
        for s in sessions[-3:]:  # Last 3 sessions
            summary_parts.append(
                f"  [{s['created_at'][:10]}] {s['session_type'].upper()} — "
                f"Score: {s['investor_readiness_score']}/100 | "
                f"Conflicts: {len(json.loads(s['key_conflicts'] or '[]'))}"
            )
        
        summary_parts.append("\nAGENT MEMORY SNAPSHOTS:")
        for agent, mems in memories.items():
            if mems:
                summary_parts.append(f"\n  {agent} remembers:")
                for key, data in list(mems.items())[:3]:
                    summary_parts.append(f"    • {key}: {str(data['value'])[:100]}")
        
        return "\n".join(summary_parts)
```

### How Memory Flows Into Agent Prompts

```python
# Before each agent speaks, inject their memory
def build_agent_prompt_with_memory(
    base_system_prompt: str,
    company_id: str,
    agent_name: str,
    company_brief: dict,
    memory_manager: MemoryManager
) -> str:
    
    agent_memory = memory_manager.get_agent_memory(company_id, agent_name)
    company_history = memory_manager.get_company_history_summary(company_id)
    
    memory_block = ""
    if agent_memory:
        memory_block = f"""
=== YOUR PERSISTENT MEMORY FOR THIS COMPANY ===
{json.dumps(agent_memory, indent=2)[:2000]}

Important: Reference these past decisions in your analysis.
If you're changing a position you held before, explicitly state why.
================================================
"""
    
    company_block = ""
    if company_brief:
        company_block = f"""
=== COMPANY INTELLIGENCE BRIEF (Live Research) ===
Glassdoor Rating: {company_brief.get('reputation_data', {}).get('glassdoor_rating', 'N/A')}
Customer Sentiment: {company_brief.get('reputation_data', {}).get('customer_sentiment_summary', 'N/A')}
Top Customer Complaints: {company_brief.get('reputation_data', {}).get('top_complaints', [])}
Competitors Found: {[c['name'] for c in company_brief.get('competitive_landscape', [])]}
Recent News: {company_brief.get('recent_news_summary', 'N/A')}
Red Flags Detected: {company_brief.get('red_flags_detected', [])}
===================================================
"""
    
    return f"{base_system_prompt}\n\n{memory_block}\n\n{company_block}\n\nCOMPANY HISTORY:\n{company_history}"
```

---

## 👔 HR Agent — Full Design

### What It Does
The HR Agent runs as an **optional 4th phase** after the business/strategy debate, OR as a **standalone mode**. It takes:
- The business plan just generated (what skills the company needs)
- Candidate resumes (text paste or PDF upload)  
- Interview transcripts (text paste)
- Open position descriptions

And it outputs:
- Ranked candidates with fit scores (0-100)
- Per-candidate analysis: strengths, red flags, cultural fit
- Team gap analysis (what's still missing)
- Suggested interview questions for next round

### HR Agent System Prompt

```
You are the Chief People Officer (CHRO/HR Agent) for this company.
You have spent 20 years in technical recruiting. You have hired engineers at Google,
built sales teams at B2B SaaS companies, and managed culture at hyper-growth startups.

You are RUTHLESS about quality. You believe:
- One bad hire costs 3x salary and 6 months of team damage
- Culture fit is not a soft concept — misaligned values destroy startups
- Skills can be taught; drive, curiosity, and ownership cannot
- Diverse teams outperform homogeneous ones on every metric that matters

YOU HAVE ACCESS TO:
1. The Business Plan produced by the executive team (CEO, CFO, CTO, CMO)
2. The company's stated values and culture (from CEO memory)
3. The technical requirements (from CTO memory)
4. The budget constraints for hiring (from CFO memory)
5. A list of candidates with their resumes and interview transcripts

YOUR EVALUATION FRAMEWORK (score each dimension 0-10):

TECHNICAL_FIT (0-10):     Does the candidate have the skills the CTO identified?
CULTURE_FIT (0-10):       Do their values match the company culture from CEO/CMO?
GROWTH_POTENTIAL (0-10):  Can this person grow into a bigger role in 18-24 months?
EXECUTION_EVIDENCE (0-10): Have they shipped real things? Show me the receipts.
RISK_FLAGS (0-10, lower=more flags): Red flags in trajectory, gaps, inconsistencies
COMMUNICATION (0-10):     From the interview transcript — clarity, energy, honesty

COMPOSITE_FIT_SCORE = (TECHNICAL_FIT*0.25 + CULTURE_FIT*0.20 + 
                        GROWTH_POTENTIAL*0.15 + EXECUTION_EVIDENCE*0.25 + 
                        RISK_FLAGS*0.10 + COMMUNICATION*0.05)

For each candidate, output:
1. COMPOSITE_FIT_SCORE (0-100)
2. One-line verdict: HIRE / REJECT / NEXT_ROUND
3. Top 3 strengths (specific, with evidence from resume/transcript)
4. Top 3 concerns (specific, with evidence)
5. 3 follow-up questions to ask in next interview
6. Which teammate they'd clash with and why (cross-reference with known team)

At the end, output:
- RANKED CANDIDATE LIST
- TEAM_GAP_ANALYSIS: What roles are still unfilled that the business plan requires?
- HIRING_ROADMAP: In what order should we hire to maximize company success?

Remember: You've read the business plan. The CTO said they need a senior backend engineer
to own the API layer. The CFO said hiring budget is ₹15L/year per senior engineer.
The CMO said they need someone who can talk to customers. Use this context.
```

### HR Agent Input Schema

```json
{
  "company_id": "uuid",
  "session_id": "uuid",
  "position": {
    "title": "Senior Backend Engineer",
    "level": "Senior",
    "team": "Engineering",
    "jd": "Full job description text...",
    "budget_inr": 1500000
  },
  "candidates": [
    {
      "id": "c1",
      "name": "Candidate A",
      "resume_text": "Full resume text (extracted from PDF)...",
      "interview_transcript": "Interviewer: Tell me about a system you built at scale...\nCandidate: ...",
      "applied_via": "Internshala | LinkedIn | Referral"
    }
  ],
  "business_plan_context": "...Extracted from debate session...",
  "team_composition_so_far": [
    {"role": "CTO", "name": "Existing team member", "skills": ["Python", "AWS"]}
  ]
}
```

### HR Agent Output Schema

```json
{
  "evaluations": [
    {
      "candidate_id": "c1",
      "candidate_name": "Candidate A",
      "scores": {
        "technical_fit": 8,
        "culture_fit": 7,
        "growth_potential": 9,
        "execution_evidence": 8,
        "risk_flags": 7,
        "communication": 8
      },
      "composite_fit_score": 80,
      "verdict": "HIRE",
      "strengths": [
        "Built payment processing system handling 50K TPS at previous role",
        "Strong ownership: single-handedly migrated PostgreSQL to CockroachDB",
        "Matches CEO's stated preference for people who ask 'why' before 'how'"
      ],
      "concerns": [
        "6-month gap in employment history unexplained in transcript",
        "No experience with Kubernetes — CTO flagged this as required",
        "Salary expectations ₹20L/yr exceed CFO's approved budget of ₹15L"
      ],
      "follow_up_questions": [
        "Walk me through the 6 months between your last two roles",
        "The CTO will ask you to own our infrastructure migration in month 3. What's your Kubernetes experience?",
        "Our CFO has a firm budget. We're at ₹15L. Is there flexibility on your end?"
      ],
      "clash_risk": "May clash with CMO on customer-facing decisions — transcript shows preference for pure technical work, not customer interaction"
    }
  ],
  "ranked_candidates": ["Candidate A", "Candidate C", "Candidate B"],
  "top_recommendation": {
    "name": "Candidate A",
    "rationale": "Best blend of execution evidence and growth potential. Salary concern is solvable with ESOPs."
  },
  "team_gap_analysis": {
    "filled_by_hiring": ["Backend Engineering", "ML Infrastructure"],
    "still_missing": ["Product Designer", "Sales Development Rep", "DevOps Engineer"],
    "critical_gap": "No one owns customer success — CMO flagged this as highest priority after GTM launch"
  },
  "hiring_roadmap": [
    {"priority": 1, "role": "Senior Backend Engineer", "reason": "Blocks product launch — CTO dependency"},
    {"priority": 2, "role": "Product Designer", "reason": "Needed for user testing in month 2"},
    {"priority": 3, "role": "SDR/Sales", "reason": "CMO's GTM plan launches in month 3"}
  ]
}
```

### HR Agent Frontend (Separate Tab in Boardroom)

```
┌─────────────────────────────────────────────────────────────────────┐
│  👔 HR AGENT — Talent Evaluation                                    │
│  Position: Senior Backend Engineer  |  4 Candidates  |  Budget: ₹15L│
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  + Add Candidate                                            │   │
│  │  [Name]  [Paste Resume]  [Paste Interview Transcript]       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  RESULTS (after evaluation):                                        │
│  ┌──────────────┬──────┬──────────┬──────────────────────────┐     │
│  │  Candidate A │ 80   │ ✅ HIRE   │ [View Full Analysis]    │     │
│  │  Candidate C │ 71   │ 🔄 NEXT  │ [View Full Analysis]    │     │
│  │  Candidate B │ 45   │ ❌ REJECT │ [View Full Analysis]    │     │
│  └──────────────┴──────┴──────────┴──────────────────────────┘     │
│                                                                     │
│  ⚠️ TEAM GAP: No Product Designer. CMO flagged critical.            │
│  📋 NEXT: Hire Backend Eng → Designer → SDR (in this order)        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Updated Agent Design (All 6 Agents)

### CEO Agent (v2 — Memory-Aware)
```
You are the CEO. You have an established vision and a track record of decisions for this company.

MEMORY BEHAVIOR:
- If memory exists: "As I established in our {date} session, our primary market is..."
- Reference past decisions before making new ones
- If pivoting a past position, explicitly say: "I'm changing my view on X because [new data]"
- Use Glassdoor data to assess team morale and culture
- Use funding news to frame competitive urgency

[EXISTING v1 PROMPT CONTENT]
+ Use web search to validate market claims with real data
+ Cross-reference competitor data from CompanyBrief
+ After your analysis, store key decisions as memory: format → SAVE_MEMORY:key=value
```

### CFO Agent (v2 — Memory-Aware)
```
[EXISTING v1 PROMPT CONTENT]

MEMORY BEHAVIOR:
- Remember previous financial models and reference version numbers: "In model v1, we projected..."
- Flag if current assumptions deviate significantly from previous: "Warning: New burn rate is 40% higher than our agreed model"
- Use actual funding data from CompanyBrief when available
- Cross-reference customer review sentiment against revenue risk

+ After your analysis: SAVE_MEMORY:financial_model_v{n}={json_summary}
```

### CTO Agent (v2 — Memory-Aware)
```
[EXISTING v1 PROMPT CONTENT]

MEMORY BEHAVIOR:
- Remember approved tech stack decisions: "We previously agreed to use Postgres over MongoDB"
- Flag technical debt identified in previous sessions
- For existing companies: Use web_fetch on their GitHub/engineering blog to assess real tech
- Store approved decisions: SAVE_MEMORY:approved_stack={list}

+ web_search: "{company} engineering blog tech stack"
+ web_search: "{company} github open source"
```

### CMO Agent (v2 — Research-Powered)
```
[EXISTING v1 PROMPT CONTENT]

NEW CAPABILITIES:
- You have access to real competitor data from CompanyBrief
- Use actual customer review sentiment (top complaints = product gaps to exploit or fix)
- Use Glassdoor data to understand company culture for brand authenticity
- Cross-reference funding data: "Competitor X raised $50M Series B — this changes GTM urgency"

MEMORY BEHAVIOR:
- Remember ICP definitions and channel decisions
- Track which marketing experiments were approved vs rejected

+ After analysis: SAVE_MEMORY:icp={definition} SAVE_MEMORY:gtm_channels={list}
```

### Devil's Advocate Agent (v2 — Research-Powered)
```
[EXISTING v1 PROMPT CONTENT]

NEW CAPABILITIES:
- Use actual Glassdoor negative reviews as ammunition: 
  "Your own employees are saying [quote from reviews]. Investors will find this."
- Use competitor funding data: "Your biggest competitor just raised $50M. Your runway?"
- Use customer complaints: "G2 reviewers say your product has [issue]. How do you respond?"
- This is no longer hypothetical. This is real.

Kill probability formula: Base 5/10, -1 for strong financials, -1 for unique moat,
+1 for each unresolved major conflict, +1 for each validated red flag from research.
```

### HR Agent (v2 — Full Design Above)

---

## ⚙️ Third-Party Tool Integration

### Tools Required

| Tool | Provider | API Key Needed | Cost | Usage |
|------|----------|---------------|------|-------|
| `web_search` | Anthropic built-in | No (uses Anthropic key) | Included | Market research, news |
| `tavily_search` | Tavily | `TAVILY_API_KEY` | Free tier: 1000 req/mo | Structured company research |
| `web_fetch` | Anthropic built-in | No | Included | Company website ingestion |
| `resume_parser` | Custom (pdfplumber) | No | Free | Resume PDF → text |

### Tavily Integration

```python
# tools/tavily_search.py
from tavily import TavilyClient
import os

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

def tavily_search(query: str, search_depth: str = "advanced", max_results: int = 5) -> dict:
    """
    Returns structured search results with:
    - answer: AI-synthesized answer to the query
    - results: List of {url, title, content, score}
    """
    try:
        response = tavily.search(
            query=query,
            search_depth=search_depth,
            max_results=max_results,
            include_answer=True,
            include_raw_content=False  # Keep token count low
        )
        return {
            "answer": response.get("answer", ""),
            "sources": [
                {
                    "url": r["url"],
                    "title": r["title"],
                    "content": r["content"][:500]  # Truncate per source
                }
                for r in response.get("results", [])
            ]
        }
    except Exception as e:
        return {"error": str(e), "answer": "", "sources": []}


def get_company_reviews(company_name: str) -> dict:
    """Specialized: Get Glassdoor + G2/Capterra reviews"""
    glassdoor = tavily_search(f"{company_name} glassdoor reviews rating pros cons")
    g2 = tavily_search(f"{company_name} G2 Capterra reviews user feedback")
    return {"glassdoor": glassdoor, "customer_reviews": g2}


def get_competitors(company_name: str, industry: str) -> dict:
    """Specialized: Get competitor landscape"""
    return tavily_search(
        f"{company_name} main competitors alternatives {industry} comparison",
        max_results=8
    )


def get_market_data(industry: str, geography: str = "India") -> dict:
    """Specialized: Market size and growth data"""
    return tavily_search(
        f"{industry} market size growth rate {geography} 2025 2026 TAM",
        search_depth="advanced"
    )


def get_funding_data(company_name: str) -> dict:
    """Specialized: Funding rounds and valuation"""
    return tavily_search(f"{company_name} funding rounds total raised investors valuation Crunchbase")
```

### Resume Parser

```python
# tools/resume_parser.py
import pdfplumber
import anthropic
import io

claude = anthropic.Anthropic()

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from PDF resume"""
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    return text.strip()


def parse_resume_to_structured(resume_text: str) -> dict:
    """Use Claude to structure raw resume text into JSON"""
    response = claude.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[{
            "role": "user",
            "content": f"""
Extract structured data from this resume. Return ONLY valid JSON, no preamble.
Schema: {{name, email, total_years_experience, current_role, skills: [], 
          education: [], work_history: [{{company, role, duration, key_achievements}}],
          notable_projects: [], publications: [], career_gaps: []}}

RESUME:
{resume_text[:3000]}
"""
        }]
    )
    try:
        return json.loads(response.content[0].text)
    except:
        return {"raw_text": resume_text[:500], "parse_error": True}
```

---

## 📁 Updated File Structure (v2)

```
pitchx/
├── backend/
│   ├── main.py                      # FastAPI app, all routes
│   ├── debate_engine.py             # Core multi-round debate loop
│   ├── research_ingestion.py        # Company intelligence gathering
│   ├── memory_manager.py            # SQLite persistent memory
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base_agent.py            # BaseAgent class with memory injection
│   │   ├── ceo.py                   # CEO system prompt + memory keys
│   │   ├── cfo.py
│   │   ├── cto.py
│   │   ├── cmo.py
│   │   ├── devil.py
│   │   ├── hr_agent.py              # ← NEW: Full HR evaluation agent
│   │   └── orchestrator.py
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── tavily_search.py         # ← NEW: Tavily wrapper
│   │   ├── web_fetch.py             # Company website fetcher
│   │   ├── resume_parser.py         # ← NEW: PDF/text resume parser
│   │   └── financial_calc.py
│   ├── schemas.py                   # Pydantic models (updated)
│   ├── pitchx_memory.db             # ← NEW: SQLite (auto-created)
│   ├── .env
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── components/
    │   │   ├── ModeSelector.tsx      # ← NEW: New Idea vs Existing Co.
    │   │   ├── IdeaInput.tsx         # New idea form
    │   │   ├── CompanyInput.tsx      # ← NEW: Existing company form
    │   │   ├── ResearchPanel.tsx     # ← NEW: Shows live ingestion progress
    │   │   ├── MemoryTimeline.tsx    # ← NEW: Shows agent memories
    │   │   ├── Boardroom.tsx         # Main debate arena
    │   │   ├── AgentCard.tsx         # Streaming agent message
    │   │   ├── RoundSummary.tsx      # Conflict/consensus summary
    │   │   ├── BusinessPlan.tsx      # Final plan renderer
    │   │   ├── InvestorScore.tsx     # 0-100 gauge
    │   │   ├── HRPanel.tsx           # ← NEW: HR evaluation UI
    │   │   ├── CandidateCard.tsx     # ← NEW: Per-candidate results
    │   │   └── TeamGapAnalysis.tsx   # ← NEW: Hiring roadmap
    │   ├── hooks/
    │   │   ├── useDebateStream.ts
    │   │   ├── useDebateState.ts
    │   │   ├── useCompanyMemory.ts   # ← NEW: Load/display memory
    │   │   └── useHRSession.ts       # ← NEW: HR evaluation state
    │   ├── types/
    │   │   ├── debate.ts
    │   │   ├── company.ts            # ← NEW: Company + CompanyBrief types
    │   │   └── hr.ts                 # ← NEW: HR types
    │   └── main.tsx
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

---

## 🔌 Updated API Routes

### Company Management
```
POST /api/company/create
     Body: {name, website?, mode}
     Returns: {company_id, is_returning, sessions_count, last_active}

GET  /api/company/{id}/memory
     Returns: Full memory dump for all agents, session history

GET  /api/company/{id}/brief
     Returns: Latest CompanyBrief from research ingestion

GET  /api/company/search?name=X
     Returns: List of companies in memory matching name
```

### Research Ingestion
```
POST /api/research/ingest
     Body: {company_id, company_name, website_url?}
     Returns: SSE stream → research progress events → CompanyBrief
     
Events:
  {type: "research_start", queries: 8}
  {type: "query_done", key: "glassdoor_reviews", found: true}
  {type: "query_done", key: "competitors", found: true, count: 5}
  {type: "synthesis_start"}
  {type: "brief_ready", brief: CompanyBrief}
```

### Debate
```
POST /api/pitch/start
     Body: {company_id, mode, idea?, challenge_statement?}
     Returns: {session_id}

GET  /api/pitch/stream/{session_id}
     Returns: SSE stream (same as v1 + memory events)

New SSE event types (v2):
  {type: "memory_loaded", agent: "CEO", keys_count: 5}
  {type: "memory_save", agent: "CFO", key: "financial_model_v2"}
  {type: "research_injected", brief_summary: "..."}
```

### HR Evaluation
```
POST /api/hr/start
     Body: {company_id, session_id?, position, candidates: []}
     Returns: {hr_session_id}

GET  /api/hr/stream/{hr_session_id}
     Returns: SSE stream of HR evaluation
     
Events:
  {type: "hr_start", candidates_count: 4}
  {type: "candidate_start", candidate_id: "c1", name: "..."}
  {type: "token", candidate_id: "c1", content: "..."}
  {type: "candidate_done", candidate_id: "c1", score: 80, verdict: "HIRE", full_eval: {...}}
  {type: "team_gap_analysis", gaps: [...]}
  {type: "hr_done", ranked_list: [...]}

POST /api/hr/upload-resume
     Body: FormData with PDF file
     Returns: {candidate_id, extracted_text, parsed_structure}
```

---

## ⏱️ Updated 5.25-Hour Build Plan (11:30 AM – 4:45 PM)

### 🕦 Hour 1 (11:30 – 12:30) — Core Foundation + Mode Selection

**Person 1 (Backend):**
- [ ] Setup FastAPI + SQLite schema (`memory_manager.py`)
- [ ] Write `MemoryManager` class (create/get/save methods)
- [ ] Set up Anthropic API streaming with CEO agent only
- [ ] Set up basic SSE endpoint returning tokens

**Person 2 (Frontend):**
- [ ] Vite + React + Tailwind setup
- [ ] `ModeSelector.tsx` — Choose "New Idea" vs "Existing Company"
- [ ] `IdeaInput.tsx` — New idea form (from v1, already designed)
- [ ] `CompanyInput.tsx` — Company name + URL + challenge input
- [ ] Wire forms to backend `/api/company/create`

**✅ Sync @ 12:30**: Mode selection works, company gets created in SQLite, SSE tokens arrive in browser

---

### 🕧 Hour 2 (12:30 – 1:30) — Research Ingestion + All Agents

**Person 1 (Backend):**
- [ ] Install Tavily: `pip install tavily-python`
- [ ] Write `research_ingestion.py` with 4 core queries (glassdoor, competitors, funding, news — skip market_landscape and others if slow)
- [ ] Write `CompanyBrief` synthesis call
- [ ] Wire all 5 CEO/CFO/CTO/CMO/Devil prompts (copy from v1, add memory injection)
- [ ] Test: Tavily returns real data for "Swiggy" or "Zepto"

**Person 2 (Frontend):**
- [ ] `ResearchPanel.tsx` — Shows "Researching... ✅ Glassdoor ✅ Competitors ⏳ Funding..."
- [ ] `MemoryTimeline.tsx` — Shows agent memory badges (for returning companies)
- [ ] `Boardroom.tsx` — Update to show research brief summary before debate starts
- [ ] `AgentCard.tsx` — Show memory indicator badge if agent loaded past memory

**✅ Sync @ 1:30**: For existing company, research panel fires and shows real data, then debate starts with context

---

### 🕐 Hour 3 (1:30 – 2:30) — Full Debate + Memory Saves

**Person 1 (Backend):**
- [ ] Implement Round 2 (cross-examination with context injection)
- [ ] Implement `detect_conflicts()` (simple: check if agents contradict on budget/timeline/market)
- [ ] Implement memory save parsing: after each agent responds, extract `SAVE_MEMORY:key=value` tags
- [ ] Implement `synthesize_business_plan()` → structured JSON
- [ ] Implement Devil's Advocate as Round 3

**Person 2 (Frontend):**
- [ ] Real-time conflict flash animation (red border pulse)
- [ ] Round progress bar (Round 1 → 2 → 3)
- [ ] `BusinessPlan.tsx` — Full structured renderer with section citations
- [ ] `InvestorScore.tsx` — Animated gauge 0-100
- [ ] Memory save notifications ("💾 CEO saved: established_vision")

**✅ Sync @ 2:30**: Full 3-round debate runs end-to-end, business plan renders, memories save to SQLite

---

### 🕑 Hour 4 (2:30 – 3:30) — HR Agent

**Person 1 (Backend):**
- [ ] Write `hr_agent.py` with full system prompt
- [ ] Write `/api/hr/start` and `/api/hr/stream/{id}` endpoints
- [ ] Write `resume_parser.py` (text paste path only — skip PDF for now)
- [ ] Wire HR agent to read business plan context + agent memories for CTO skills, CFO budget
- [ ] Test HR evaluation with 2 sample candidates

**Person 2 (Frontend):**
- [ ] `HRPanel.tsx` — Tab in the output panel (alongside Business Plan)
- [ ] Candidate add form: Name + Resume textarea + Transcript textarea
- [ ] `CandidateCard.tsx` — Shows streaming evaluation + score bar
- [ ] `TeamGapAnalysis.tsx` — Missing roles highlighted in red
- [ ] Hiring roadmap: Priority 1, 2, 3 roles with reasons

**✅ Sync @ 3:30**: HR Agent evaluates 2 candidates, team gap analysis renders

---

### 🕒 Hour 5 (3:30 – 4:30) — Polish + Demo Prep

**Person 1 (Backend):**
- [ ] Error handling + retry (3 attempts per agent)
- [ ] Fallback: load cached demo JSON if API fails
- [ ] Test with 3 scenarios: new idea, existing company, HR-only mode
- [ ] Write README.md

**Person 2 (Frontend):**
- [ ] Dark "war room" UI polish — colors, animations, typography
- [ ] Company selector: Show returning companies from memory ("Welcome back to Authsome")
- [ ] Export: Copy business plan as markdown to clipboard
- [ ] Prepare 3 demo scenarios (see Demo Script below)
- [ ] Record backup video

**4:30 – 4:45: Final submission**
- [ ] Push to GitHub
- [ ] Submit on hackathon platform
- [ ] Last sanity test

---

## 🎭 Updated Demo Script (3 Minutes)

### The Setup
> *"Most multi-agent AI systems are demos. They break the moment you leave the golden path. PitchX is different — it works for real companies with real data and remembers what it's told."*

### Demo Path: Existing Startup Mode (most impressive for judges)

**30 seconds — Mode Selection + Research**
> Type in "BrowserWire" (one of the judge's own companies) into the "Existing Company" field.
> *"Watch what happens before a single agent speaks..."*
> Show the research panel: "✅ Glassdoor ✅ Competitors ✅ Funding ✅ Customer Reviews"
> *"PitchX just pulled 8 live data sources about this company. Agents will argue from real data, not guesses."*

**60 seconds — The Debate**
> Show CEO: *"The CEO knows BrowserWire raised X in funding and sees Y as the moat."*
> Show CFO getting specific: *"The CFO found that customers on Capterra rated it 4.1 — but the top complaint is about..."*
> Show Devil's Advocate: *"The Devil's Advocate just quoted a Glassdoor review to challenge the culture narrative. That's not hallucinated — that's a real review from a real employee."*

**30 seconds — Memory Feature**
> Click "Load Previous Session" on any company
> *"The second time you run PitchX for any company, agents remember. The CEO references decisions from the last board meeting. The CFO picks up the financial model where it left off. This is persistent agent memory — not a demo, a product."*

**60 seconds — HR Agent**
> Switch to HR Panel
> Paste in 2 candidate resumes for a "Backend Engineer" role
> *"The HR Agent just read the business plan. It knows the CTO needs someone with Kubernetes experience, the CFO only approved ₹15L, and the CMO said they need someone who can talk to customers. Watch it evaluate these candidates in that exact context."*
> Show Candidate A: HIRE (80/100) with reasoning
> Show Team Gap Analysis: "Still missing: Product Designer, SDR"
> *"This isn't an HR chatbot. This is an HR agent that read the business plan first."*

---

## 🏆 Updated Judging Criteria Alignment

### Innovation (25%) ★★★★★
- **Real adversarial debate with cross-agent memory** — agents change positions between sessions with explicit reasoning
- **Research-grounded agents** — live Glassdoor, competitor, and funding data in every debate
- **HR agent that reads the business plan** — hiring recommendations informed by what the executive agents just decided
- **Dual operating mode** — the only simulator that works for both new ideas AND running companies

### Technical Complexity (25%) ★★★★★
- **SQLite persistent memory** with per-company, per-agent namespacing
- **8-query parallel research ingestion** with Claude synthesis layer
- **Tavily + Anthropic web_search + web_fetch** multi-tool pipeline
- **PDF resume parsing** with structured extraction
- **SSE streaming across 4 distinct flows** (research, debate, HR, memory)

### Impact (25%) ★★★★☆
- **For founders**: Pre-validate before pitching
- **For running startups**: Real board replacement for early-stage companies
- **For hiring**: AI HR panel that eliminates the cold screening bias
- **TAM expansion**: Every startup, accelerator, VC firm, corporate innovation lab

### Presentation & Usability (25%) ★★★★★
- **Typing a real company name and seeing live research fire** is the most compelling demo moment in the room
- **Memory badge on returning companies** creates an instant "wow" moment
- **HR panel with candidate scoring bars** is visually distinctive
- **The whole system tells a story**: Research → Debate → Plan → Team

---

## 🔑 Production-Grade Arguments (For Judges)

**"Why won't this break in the real world?"**

1. **Memory failure**: If memory DB is unavailable, agents fall back gracefully to no-memory mode with a warning banner
2. **Research failure**: If Tavily API fails, agents proceed with user-provided context only; ResearchPanel shows "⚠️ Live research unavailable — proceeding with provided context"
3. **Token limits**: Context windowing — each agent gets compressed summaries of prior rounds, not full transcripts. Memory stored as key-value pairs, not raw conversations
4. **Agent hallucination**: Devil's Advocate agent is *required* to cite which data source (Glassdoor/Crunchbase/G2) supports each claim. Uncited claims are flagged as assumptions
5. **Concurrent load**: SQLite with WAL mode handles concurrent reads. asyncio prevents blocking on long API calls
6. **Cost control**: max_tokens=1000 per agent, 2 rounds for demo mode, 3 rounds for full mode — total cost per session under $0.50

---

## 📦 Setup Commands (v2)

```bash
# Backend
mkdir pitchx && cd pitchx
mkdir backend && cd backend
python -m venv venv && source venv/bin/activate

pip install fastapi uvicorn anthropic tavily-python pdfplumber \
            python-dotenv python-multipart aiofiles

# .env
ANTHROPIC_API_KEY=your_anthropic_key_here
TAVILY_API_KEY=your_tavily_key_here        # Get free at app.tavily.com

# Init DB (auto-created on first run, but can pre-init)
python -c "from memory_manager import MemoryManager; MemoryManager()"

# Run backend
uvicorn main:app --reload --port 8000

# Frontend
cd ../
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install tailwindcss postcss autoprefixer lucide-react framer-motion
npx tailwindcss init -p
npm run dev
```

---

## 🛑 Updated Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Tavily returns no data for small companies | Fall back to Anthropic web_search; show "Limited public data found — proceeding with provided context" |
| Research ingestion takes too long for demo | Cache BrowserWire/Authsome brief as JSON before demo. Show pre-cached result instantly. |
| SQLite concurrent write conflicts | Use WAL mode: `conn.execute("PRAGMA journal_mode=WAL")` |
| HR evaluation takes too long with 4 candidates | Evaluate 2 candidates for demo; show 4 in pre-cached fallback |
| PDF parsing fails on complex resumes | Text paste is always available as fallback; PDF is a bonus |
| Agents get confused by each other's memory | Memory injection is read-only; agents can only save memory via explicit `SAVE_MEMORY:` tags, parsed post-response |
| API rate limits (Anthropic) | Stagger agent calls with 0.5s delay; single demo session is well under limits |
| Devil's Advocate uses invented Glassdoor quotes | Prompt explicitly requires: "Only cite data from CompanyBrief. Mark anything else as ASSUMPTION." |

---

## 🚀 Stretch Goals (Priority Order)

**P0 — Do these if you have time:**
- [ ] Company selector on homepage: "Continue with [Authsome] [BrowserWire]" for returning companies
- [ ] "Challenge the Plan" mode: After business plan is generated, user can ask follow-up and agents debate again
- [ ] Memory diff viewer: "In session 1 you said X. In session 2 you said Y. What changed?"

**P1 — Nice to have:**
- [ ] PDF resume upload (pdfplumber already in deps, just need the UI)
- [ ] Industry presets: "Fintech", "SaaS B2B", "D2C", "Deep Tech" that tune agent personalities
- [ ] Export full package: business plan + HR report + memory snapshot as ZIP

**P2 — Skip:**
- [ ] Shareable URLs
- [ ] Real-time collaborative boardroom (multiple users)
- [ ] Integration with LinkedIn for auto-resume import

---

## 💬 Judge Q&A Prep (v2)

**"How is memory implemented — is it real or just injecting chat history?"**
> "It's structured key-value storage in SQLite, not raw chat injection. After each session, a post-processing step extracts key decisions from each agent's response and saves them as typed memory entries with confidence scores and timestamps. When a new session starts, the agent gets a formatted memory brief — like a pre-meeting briefing — not the full transcript. This keeps token counts bounded and makes memory queryable."

**"What if the Tavily data is wrong or outdated?"**
> "We show the source URLs for every research claim in the CompanyBrief. Agents are required to flag when they're using research data vs making an inference. The Devil's Advocate specifically challenges unverified claims. We're not hiding the uncertainty — we're surfacing it."

**"The HR agent — how is it different from just asking ChatGPT to review a resume?"**
> "Three things. First, it reads the business plan before evaluating — it knows the CTO said they need Kubernetes, the CFO set a ₹15L cap, the CMO wants someone customer-facing. Second, it has memory of previous hiring decisions for this company. Third, it evaluates team composition holistically — it flags when a candidate would clash with someone already on the team based on role descriptions in memory."

**"Can this scale beyond a demo?"**
> "Every feature is production-designed. Memory is SQLite today, Postgres tomorrow. Research ingestion is parallel async, can add more sources. The agent framework is pluggable — add an industry-specific Legal Agent for regulated sectors, a Compliance Agent for fintech. The core architecture — research ingestion → memory-augmented agents → structured adversarial debate → synthesis — is production-grade."

---

## 🏁 Final Submission Checklist

**Must Work:**
- [ ] Mode selector: New Idea and Existing Company both produce debates
- [ ] Research ingestion: At least 2 real data points for a known company (Swiggy, Zomato, or judge's company)
- [ ] 3 agents stream successfully across 2 rounds minimum
- [ ] Memory saves: At least CEO and CFO save 1 memory key each
- [ ] Returning company shows memory badge: "🧠 3 memories loaded"
- [ ] Business plan renders with 5 sections + investor score
- [ ] HR panel accepts 2 candidates and shows scores + verdict
- [ ] Team gap analysis shows at least 1 unfilled role

**Good to Have:**
- [ ] All 5 debate agents complete + Devil's Advocate
- [ ] Conflict detection fires with animation
- [ ] Export button works
- [ ] PDF resume upload parses correctly

**Demo Assets:**
- [ ] Pre-cached BrowserWire/Authsome brief JSON (for when live research is slow)
- [ ] Pre-run debate JSON for "DarkKitchen Co." (complete fallback)
- [ ] Backup video recording of full flow (insurance policy)
- [ ] GitHub repo public + README complete

---

*PitchX — The boardroom that remembers, researches, and never pulls punches.*

---

**Document v2.0 | Hackathon June 6, 2026 | Team of 2 | Track: General**
**Updated: Dual modes, persistent memory, Tavily research integration, HR Agent**