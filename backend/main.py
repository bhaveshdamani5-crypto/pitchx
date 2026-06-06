"""
PitchX — FastAPI Backend
Adaptive Multi-Agent Startup Intelligence Platform

Routes:
  POST /api/company/create       — Create or find a company
  GET  /api/company/{id}/memory  — Get company memory
  GET  /api/companies            — List all companies
  POST /api/research/ingest      — Start research ingestion (SSE)
  POST /api/pitch/start          — Start a debate session
  GET  /api/pitch/stream/{sid}   — Stream debate events (SSE)
  POST /api/hr/start             — Start HR evaluation
  GET  /api/hr/stream/{sid}      — Stream HR evaluation (SSE)
"""

import os
import json
import asyncio
import logging
from typing import Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

from memory_manager import MemoryManager
from debate_engine import DebateEngine, HREngine
from research_ingestion import ingest_company
from execution_engine import ExecutionEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PitchX API",
    description="Multi-Agent Startup Intelligence Platform",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize core services
memory = MemoryManager()
debate_engine = DebateEngine(memory_manager=memory)
hr_engine = HREngine(memory_manager=memory)
execution_engine = ExecutionEngine(memory_manager=memory)

# Store active sessions for streaming
active_sessions = {}
active_hr_sessions = {}


# ─── Request/Response Models ─────────────────────────────────────

class CompanyCreateRequest(BaseModel):
    name: str
    website: Optional[str] = None
    mode: str = "new_idea"  # 'new_idea' | 'existing'
    industry: Optional[str] = None
    stage: Optional[str] = None
    monthly_revenue: Optional[float] = None
    team_size: Optional[int] = None


class PitchStartRequest(BaseModel):
    company_id: str
    mode: str = "new_idea"
    idea: str = ""
    challenge: Optional[str] = None
    founder_background: Optional[str] = None
    budget: Optional[float] = None
    market: Optional[str] = None
    timeline_months: Optional[int] = None
    reality_gap: Optional[dict] = None


class ResearchIngestRequest(BaseModel):
    company_id: str
    company_name: str
    website_url: Optional[str] = None
    industry: Optional[str] = None
    stage: Optional[str] = None
    challenge: Optional[str] = None
    monthly_revenue: Optional[float] = None
    team_size: Optional[int] = None
    self_description: Optional[str] = None


class HRStartRequest(BaseModel):
    company_id: str
    session_id: Optional[str] = None
    position: dict = Field(default_factory=lambda: {"title": "Engineer", "level": "Senior"})
    candidates: list = Field(default_factory=list)
    business_plan_context: Optional[str] = None

class HRExecutionRequest(BaseModel):
    company_id: str
    hr_result: dict


# ─── Health Check ─────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name": "PitchX API",
        "version": "2.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/health")
async def health():
    return {"status": "healthy", "memory_db": "connected"}


# ─── Company Routes ──────────────────────────────────────────────

@app.post("/api/company/create")
async def create_company(req: CompanyCreateRequest):
    result = memory.get_or_create_company(
        name=req.name,
        website=req.website,
        mode=req.mode,
        industry=req.industry,
        stage=req.stage,
        monthly_revenue=req.monthly_revenue,
        team_size=req.team_size,
    )
    return result


@app.get("/api/company/{company_id}/memory")
async def get_company_memory(company_id: str):
    company = memory.get_company(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    all_memories = memory.get_all_memories(company_id)
    sessions = memory.get_sessions(company_id)
    history = memory.get_company_history_summary(company_id)

    return {
        "company": company,
        "memories": all_memories,
        "sessions": [
            {
                "id": s["id"],
                "type": s.get("session_type", "initial"),
                "score": s.get("investor_readiness_score", 0),
                "round_count": s.get("round_count", 0),
                "created_at": s.get("created_at", ""),
            }
            for s in sessions
        ],
        "history_summary": history,
        "memory_count": memory.get_memory_count(company_id),
    }


@app.get("/api/company/{company_id}/brief")
async def get_company_brief(company_id: str):
    company = memory.get_company(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    brief = company.get("company_brief")
    if brief and isinstance(brief, str):
        try:
            brief = json.loads(brief)
        except json.JSONDecodeError:
            brief = None

    return {"company_id": company_id, "brief": brief}


@app.get("/api/companies")
async def list_companies():
    companies = memory.list_companies()
    result = []
    for c in companies:
        sessions = memory.get_sessions(c["id"])
        mem_count = memory.get_memory_count(c["id"])
        result.append({
            "id": c["id"],
            "name": c["name"],
            "website": c.get("website"),
            "mode": c.get("mode", "new_idea"),
            "sessions_count": len(sessions),
            "memory_count": mem_count,
            "last_active": c.get("last_active"),
            "created_at": c.get("created_at"),
        })
    return {"companies": result}


# ─── Research Routes ─────────────────────────────────────────────

@app.post("/api/research/ingest")
async def start_research(req: ResearchIngestRequest):
    async def event_stream():
        try:
            user_context = {
                "company_name": req.company_name,
                "stage": req.stage,
                "challenge": req.challenge,
                "monthly_revenue": req.monthly_revenue,
                "team_size": req.team_size,
                "self_description": req.self_description,
                "industry": req.industry,
            }
            async for event in ingest_company(
                company_name=req.company_name,
                website_url=req.website_url,
                industry=req.industry,
                user_context=user_context,
            ):
                # Save brief to database when ready
                if event.get("type") == "brief_ready":
                    memory.update_company_brief(req.company_id, event.get("brief", {}))
                
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        yield "data: {\"type\": \"stream_end\"}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ─── Debate Routes ───────────────────────────────────────────────

@app.post("/api/pitch/start")
async def start_pitch(req: PitchStartRequest):
    # Verify company exists
    company = memory.get_company(req.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Create session
    session_type = "review" if req.mode == "existing" else "initial"
    session_id = memory.create_session(req.company_id, session_type)

    # Get company brief if available
    company_brief = None
    if company.get("company_brief"):
        brief_data = company["company_brief"]
        if isinstance(brief_data, str):
            try:
                company_brief = json.loads(brief_data)
            except json.JSONDecodeError:
                pass
        else:
            company_brief = brief_data

    # Store session config for streaming
    active_sessions[session_id] = {
        "company_id": req.company_id,
        "mode": req.mode,
        "idea": req.idea,
        "company_brief": company_brief,
        "challenge": req.challenge,
        "founder_background": req.founder_background,
        "budget": req.budget,
        "market": req.market,
        "timeline_months": req.timeline_months,
        "reality_gap": req.reality_gap,
    }

    return {
        "session_id": session_id,
        "company_id": req.company_id,
        "stream_url": f"/api/pitch/stream/{session_id}",
        "has_memory": memory.get_memory_count(req.company_id) > 0,
        "has_brief": company_brief is not None,
    }


@app.get("/api/pitch/stream/{session_id}")
async def stream_debate(session_id: str):
    session_config = active_sessions.get(session_id)
    if not session_config:
        raise HTTPException(status_code=404, detail="Session not found")

    async def event_stream():
        try:
            async for event in debate_engine.run_debate(
                session_id=session_id,
                company_id=session_config["company_id"],
                idea=session_config["idea"],
                mode=session_config["mode"],
                company_brief=session_config.get("company_brief"),
                challenge=session_config.get("challenge"),
                founder_background=session_config.get("founder_background"),
                budget=session_config.get("budget"),
                market=session_config.get("market"),
                timeline_months=session_config.get("timeline_months"),
                reality_gap=session_config.get("reality_gap"),
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logger.error(f"Debate stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        finally:
            yield "data: {\"type\": \"stream_end\"}\n\n"
            # Cleanup
            active_sessions.pop(session_id, None)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/pitch/session/{session_id}")
async def get_session(session_id: str):
    session = memory.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Parse JSON fields
    result = dict(session)
    for field in ["key_conflicts", "key_agreements", "business_plan"]:
        if result.get(field) and isinstance(result[field], str):
            try:
                result[field] = json.loads(result[field])
            except json.JSONDecodeError:
                pass

    return result


# ─── HR Routes ───────────────────────────────────────────────────

@app.post("/api/hr/start")
async def start_hr(req: HRStartRequest):
    hr_session_id = f"hr_{req.company_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"

    active_hr_sessions[hr_session_id] = {
        "company_id": req.company_id,
        "session_id": req.session_id,
        "position": req.position,
        "candidates": req.candidates,
        "business_plan_context": req.business_plan_context,
    }

    return {
        "hr_session_id": hr_session_id,
        "stream_url": f"/api/hr/stream/{hr_session_id}",
    }


@app.get("/api/hr/stream/{hr_session_id}")
async def stream_hr(hr_session_id: str):
    session_config = active_hr_sessions.get(hr_session_id)
    if not session_config:
        raise HTTPException(status_code=404, detail="HR session not found")

    async def event_stream():
        try:
            async for event in hr_engine.evaluate_candidates(
                company_id=session_config["company_id"],
                session_id=session_config.get("session_id"),
                position=session_config["position"],
                candidates=session_config["candidates"],
                business_plan_context=session_config.get("business_plan_context"),
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logger.error(f"HR stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        finally:
            yield "data: {\"type\": \"stream_end\"}\n\n"
            active_hr_sessions.pop(hr_session_id, None)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/hr/decisions/{company_id}")
async def get_hr_decisions(company_id: str):
    decisions = memory.get_hr_decisions(company_id)
    result = []
    for d in decisions:
        item = dict(d)
        if item.get("evaluation_json") and isinstance(item["evaluation_json"], str):
            try:
                item["evaluation_json"] = json.loads(item["evaluation_json"])
            except json.JSONDecodeError:
                pass
        result.append(item)
    return {"decisions": result}

@app.post("/api/execute/hr")
async def execute_hr(req: HRExecutionRequest):
    async def event_stream():
        try:
            async for event in execution_engine.execute_hr_decisions(
                hr_result=req.hr_result,
                company_id=req.company_id
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logger.error(f"Execution stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        finally:
            yield "data: {\"type\": \"stream_end\"}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ─── Run ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
