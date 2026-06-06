# PitchX: Crossing the Agent Reality Gap
**Adaptive Multi-Agent Startup Intelligence Platform**

*Hackathon Submission: Build agents that do real work.*

---

## 🚀 The Vision: Beyond the "Demo Zone"
Most AI agents today are trapped in the "demo zone." They work perfectly on carefully curated golden paths but fail in the face of ambiguity, lack long-term memory, and struggle with safe delegation.

**PitchX bridges the gap between viral demos and production-grade agents.** It is a persistent multi-agent boardroom that stress-tests any startup—whether a new idea or a live company—using real market intelligence, adversarial AI executives with persistent memory, and an AI HR panel that evaluates your team candidates against the strategic plan they just built.

We focus on **provable claims, scoped agent actions, live data grounding, and long-term memory**.

---

## 🧠 Core Differentiators (Why PitchX Wins)

PitchX is designed directly around real-world utility, demanded by operators, infrastructure builders, and quantitative analysts:

### 1. Reality Gap Analysis 
Founders often lie to themselves (politeness bias). PitchX doesn't just take the founder's word for it. It runs parallel research ingestion to build a factual `CompanyBrief` and computes a **Reality Gap Score** by comparing founder claims vs. public reality (Glassdoor reviews, customer complaints, funding data).

### 2. Claim Provenance: Verified vs. Assumption 
Agents hallucinate. To combat this, PitchX requires agents (especially the Devil's Advocate) to tag their claims. Every claim is auditable and grounded in live fetched data, ensuring trust and safe delegation.
* `[VERIFIED]` - Tied directly to live research data with a source URL.
* `[ASSUMPTION]` - Explicitly flagged inference.

### 3. Agent Memory Scopes: Enforced Delegation
Most multi-agent demos let every agent write everything to a global memory state. PitchX implements **Scoped Memory** at the infrastructure level. Agents can only write to their specific, authorized memory keys (e.g., the CMO cannot overwrite the financial model).

### 4. Longitudinal Memory Theater
Agents that forget the last meeting are useless in production. PitchX features structured SQLite memory persisted per company and per agent. Run a session, let agents save memories, and in the next session, watch the CEO agent seamlessly recall past decisions.

### 5. Structured Board Resolutions
No chat slop. After a 3-round adversarial debate, PitchX synthesizes a structured board vote (`APPROVE`, `CONDITIONAL`, `REJECT`), computes an Investor Readiness Score, and outputs a Kill Probability.

---

## 💡 Dual Operating Modes

### Mode 1: New Idea Mode
* **Input:** Startup idea description + parameters.
* **Agents:** Evaluate from scratch.
* **Output:** Initial Business plan + hiring plan for the founding team.
* **Memory:** Creates a new company namespace and saves the first session.

### Mode 2: Existing Startup Mode (The Real Unlock)
* **Input:** Company name + website URL.
* **Research:** Auto-ingests real company data FIRST (reviews, news, competitors, funding).
* **Agents:** Debate using the actual ingested data, not the founder's self-description.
* **Output:** Strategic audit, course-correction plan, and HR gap analysis.
* **Memory:** Loads previous sessions, agents reference past decisions.

---

## 🏗️ System Architecture

PitchX uses a multi-layered orchestration architecture:

1. **Frontend Layer:** React/Vite/TSX. Features Mode Selection, Live Debate Streaming (SSE), Memory Timeline, HR Candidate Evaluation, and a Board Resolution Output Panel.
2. **FastAPI Backend Layer:** Asynchronous Python backend managing HTTP requests and streaming responses.
3. **Research Ingestion Layer:** Uses Tavily and Anthropic's built-in web search to fire 8 parallel queries gathering market size, Glassdoor reviews, customer feedback, and funding news into a structured `CompanyBrief`.
4. **Persistent Memory Layer:** SQLite (`pitchx_memory.db`) storing data in isolated company namespaces, tracking `agent_memories`, `debate_sessions`, and `hr_decisions`.
5. **Orchestrator Agent:** Loads memory, injects briefs, manages debate rounds, resolves conflicts, and triggers cross-examinations.
6. **Execution Agent Layer:** Powered by NVIDIA NIM (`meta/llama-3.1-70b-instruct`) with tool calling. Uses Apify and PhantomBuster to autonomously execute real-world actions like scraping LinkedIn and sending outreach messages, safely guarded by NVIDIA TrustOps.

---

## 🤖 The Agent Ecosystem

* **CEO Agent:** Holds the vision. Remembers past sessions ("As I established in our last meeting..."). Uses Glassdoor data to assess team morale and culture.
* **CFO Agent:** Focuses on unit economics, runway, and burn rate. Tracks financial model versions across memory sessions.
* **CTO Agent:** Focuses on architecture, technical debt, and scalability. Approves the tech stack and stores it in memory.
* **CMO Agent:** Focuses on GTM, ICP, and brand. Uses actual customer review sentiment (from G2/Capterra) to exploit product gaps.
* **Devil's Advocate:** The ultimate stress-tester. Uses negative reviews, competitor funding, and unresolved conflicts to calculate a **Kill Probability**.
* **HR Agent (New in v2):** A dedicated Chief People Officer. Takes the generated business plan, budget, and tech stack requirements, and evaluates real candidate resumes/transcripts to output a Ranked List, Composite Fit Score (0-100), and Team Gap Analysis.
* **Execution Agent:** The action-taker. Takes the HR Gap Analysis and uses tool-calling to autonomously scrape LinkedIn profiles (Apify) and send automated outreach messages (PhantomBuster) to fill team gaps.

---

## 🛠️ Tech Stack

* **Backend:** Python 3.10+, FastAPI, SQLite3, AsyncOpenAI (NVIDIA API: `meta/llama3-8b-instruct`), Tavily
* **Frontend:** React, Vite, TypeScript, TailwindCSS
* **Architecture:** Multi-Agent Orchestration, Server-Sent Events (SSE), Scoped Memory

---

## 🚦 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/pitchx.git
cd pitchx
```

### 2. Setup the Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Environment Variables
cp .env.example .env
# Required keys:
# NVIDIA_API_KEY=your_nvidia_api_key
# TAVILY_API_KEY=your_tavily_api_key
# APIFY_API_TOKEN=your_apify_api_token (for LinkedIn Sourcing)
# PHANTOMBUSTER_API_KEY=your_phantom_buster_api_key (for LinkedIn Messaging)

# Run the FastAPI server (starts on http://localhost:8000)
python3 main.py
```

### 3. Setup the Frontend
```bash
cd ../frontend
npm install
npm run dev
# Starts on http://localhost:5173
```

---

## 📚 Core API Endpoints

The FastAPI backend exposes several crucial endpoints to support the frontend UI:

* `POST /api/company/create` — Create a new company namespace or find an existing one.
* `GET /api/company/{company_id}/memory` — Retrieve all past sessions, agent memories, and history summaries.
* `POST /api/research/ingest` — Starts parallel research ingestion and streams progress via SSE.
* `POST /api/pitch/start` — Initializes a debate session and returns a session ID.
* `GET /api/pitch/stream/{session_id}` — Streams the multi-agent debate events via SSE.
* `POST /api/hr/start` — Initializes an HR evaluation session.
* `GET /api/hr/stream/{session_id}` — Streams candidate evaluations via SSE.

---

## 🎯 Demo Guide (The "Wow" Moments)

When presenting PitchX, follow this choreography to highlight the exact features that solve the hackathon's core challenges:

1. **The Pre-Debate Reality Check:** Type in a live company (e.g., "BrowserWire" or "Authsome"). Watch the Research Panel fire 8 live queries. See the **Red Reality Gap Banner** appear if the founder's claims contradict public Glassdoor/funding data.
2. **The Provenance Badge Click:** During the debate, wait for the Devil's Advocate to speak. Click the `[VERIFIED]` badge next to a brutal claim to instantly open the source URL (e.g., a real G2 review).
3. **The Memory Theater (Session 2):** After running a session, open the *same company again*. Watch the CEO agent explicitly reference the previous session's output in their opening statement.
4. **The HR Hand-off:** Show how the HR panel rejects a candidate *specifically* because their salary expectation exceeds the CFO's budget set in the previous debate round.
5. **Autonomous Execution (LinkedIn Sourcing):** Watch the Execution Engine take the HR Gap Analysis, autonomously scrape live LinkedIn profiles for missing roles using Apify, and queue outreach messages via PhantomBuster, all safely audited by NVIDIA TrustOps.
6. **The Board Vote:** Conclude the demo by showing the structured Investor Score, Board Verdict (`CONDITIONAL_GO`), and Kill Probability.

---

## 🚀 What's Next (Roadmap)

While PitchX already crosses the reality gap by grounding agents in live data and giving them execution capabilities, our future roadmap includes:
1. **Deeper Execution Hooks:** Expanding the tool-calling repertoire to include automated calendar scheduling for interviews and CRM integrations (Salesforce/HubSpot).
2. **Dynamic Knowledge Graphs:** Moving beyond isolated JSON briefs to a full graph representation of a company's market space to better track competitors over time.
3. **Multi-Modal Board Meetings:** Adding voice synthesis so founders can verbally debate with the AI Board in real-time, bringing the stress-test to life.

---

*PitchX was built in 5.25 hours by a team of 2.*