"""
PitchX Memory Manager — Persistent PostgreSQL memory for multi-agent boardroom.
Handles companies, agent memories, debate sessions, business plans, HR decisions, and chats.
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import json
import uuid
import os
from datetime import datetime
from typing import Optional, List, Dict, Any
import contextlib

DB_URL = os.getenv("NEON_DATABASE_URL")

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    website TEXT,
    mode TEXT DEFAULT 'new_idea',
    industry TEXT,
    stage TEXT,
    monthly_revenue REAL,
    team_size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP,
    company_brief JSONB
);

CREATE TABLE IF NOT EXISTS agent_memories (
    id SERIAL PRIMARY KEY,
    company_id TEXT REFERENCES companies(id),
    agent_name TEXT NOT NULL,
    memory_key TEXT NOT NULL,
    memory_value TEXT NOT NULL,
    confidence REAL DEFAULT 0.8,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, agent_name, memory_key)
);

CREATE TABLE IF NOT EXISTS debate_sessions (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id),
    session_type TEXT DEFAULT 'initial',
    round_count INTEGER DEFAULT 0,
    key_conflicts JSONB,
    key_agreements JSONB,
    investor_readiness_score INTEGER DEFAULT 0,
    summary TEXT,
    business_plan JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_plan_versions (
    id SERIAL PRIMARY KEY,
    company_id TEXT REFERENCES companies(id),
    session_id TEXT REFERENCES debate_sessions(id),
    version INTEGER DEFAULT 1,
    plan_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hr_decisions (
    id SERIAL PRIMARY KEY,
    company_id TEXT REFERENCES companies(id),
    session_id TEXT REFERENCES debate_sessions(id),
    position_title TEXT,
    candidate_name TEXT,
    resume_summary TEXT,
    fit_score INTEGER DEFAULT 0,
    recommendation TEXT,
    hr_notes TEXT,
    evaluation_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trustops_events (
    id SERIAL PRIMARY KEY,
    company_id TEXT REFERENCES companies(id),
    session_id TEXT,
    event_type TEXT NOT NULL,
    agent_name TEXT,
    payload_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    company_id TEXT REFERENCES companies(id),
    role TEXT NOT NULL,
    agent_name TEXT DEFAULT 'Board',
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""


class MemoryManager:
    """Manages all persistent state for PitchX agents using PostgreSQL."""

    def __init__(self, db_url: str = None):
        self.db_url = db_url or DB_URL
        if not self.db_url:
            raise ValueError("NEON_DATABASE_URL environment variable is not set.")
        self._init_db()

    @contextlib.contextmanager
    def _get_conn(self):
        conn = psycopg2.connect(self.db_url, cursor_factory=RealDictCursor)
        conn.autocommit = True
        try:
            yield conn
        finally:
            conn.close()

    def _init_db(self):
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(SCHEMA_SQL)

    # ─── Company Operations ──────────────────────────────────────────

    def get_or_create_company(
        self,
        name: str,
        website: str = None,
        mode: str = "new_idea",
        industry: str = None,
        stage: str = None,
        monthly_revenue: float = None,
        team_size: int = None,
    ) -> dict:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT * FROM companies WHERE LOWER(name) = LOWER(%s)", (name,)
                )
                row = cur.fetchone()

                if row:
                    cur.execute(
                        "UPDATE companies SET last_active = %s WHERE id = %s",
                        (datetime.now(), row["id"]),
                    )
                    cur.execute(
                        "SELECT COUNT(*) as cnt FROM debate_sessions WHERE company_id = %s",
                        (row["id"],),
                    )
                    sessions = cur.fetchone()
                    return {
                        "company_id": row["id"],
                        "is_returning": True,
                        "sessions_count": sessions["cnt"],
                        "last_active": row["last_active"].isoformat() if row["last_active"] else "",
                        "name": row["name"],
                    }

                company_id = str(uuid.uuid4())
                cur.execute(
                    """INSERT INTO companies 
                       (id, name, website, mode, industry, stage, monthly_revenue, team_size, last_active)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (
                        company_id,
                        name,
                        website,
                        mode,
                        industry,
                        stage,
                        monthly_revenue,
                        team_size,
                        datetime.now(),
                    ),
                )
                return {
                    "company_id": company_id,
                    "is_returning": False,
                    "sessions_count": 0,
                    "last_active": datetime.now().isoformat(),
                    "name": name,
                }

    def get_company(self, company_id: str) -> Optional[dict]:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT * FROM companies WHERE id = %s", (company_id,)
                )
                row = cur.fetchone()
                if row:
                    d = dict(row)
                    if d.get("created_at"): d["created_at"] = d["created_at"].isoformat()
                    if d.get("last_active"): d["last_active"] = d["last_active"].isoformat()
                    return d
        return None

    def update_company_brief(self, company_id: str, brief: dict):
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE companies SET company_brief = %s WHERE id = %s",
                    (json.dumps(brief), company_id),
                )

    def list_companies(self) -> List[dict]:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT c.*, 
                           (SELECT COUNT(*) FROM debate_sessions s WHERE s.company_id = c.id) as sessions_count,
                           (SELECT COUNT(*) FROM agent_memories m WHERE m.company_id = c.id) as memory_count
                    FROM companies c
                    ORDER BY c.last_active DESC LIMIT 20
                    """
                )
                rows = cur.fetchall()
                res = []
                for r in rows:
                    d = dict(r)
                    if d.get("created_at"): d["created_at"] = d["created_at"].isoformat()
                    if d.get("last_active"): d["last_active"] = d["last_active"].isoformat()
                    res.append(d)
                return res

    # ─── Agent Memory Operations ─────────────────────────────────────

    def save_agent_memory(
        self,
        company_id: str,
        agent: str,
        key: str,
        value: Any,
        confidence: float = 0.8,
    ):
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO agent_memories 
                       (company_id, agent_name, memory_key, memory_value, confidence, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s)
                       ON CONFLICT (company_id, agent_name, memory_key) DO UPDATE SET 
                       memory_value = EXCLUDED.memory_value, 
                       confidence = EXCLUDED.confidence, 
                       updated_at = EXCLUDED.updated_at""",
                    (
                        company_id,
                        agent,
                        key,
                        json.dumps(value) if not isinstance(value, str) else value,
                        confidence,
                        datetime.now(),
                    ),
                )

    def get_agent_memory(self, company_id: str, agent: str) -> dict:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT memory_key, memory_value, confidence, updated_at
                       FROM agent_memories
                       WHERE company_id = %s AND agent_name = %s
                       ORDER BY updated_at DESC""",
                    (company_id, agent),
                )
                rows = cur.fetchall()

                result = {}
                for row in rows:
                    try:
                        val = json.loads(row["memory_value"])
                    except (json.JSONDecodeError, TypeError):
                        val = row["memory_value"]
                    result[row["memory_key"]] = {
                        "value": val,
                        "confidence": row["confidence"],
                        "last_updated": row["updated_at"].isoformat() if row["updated_at"] else "",
                    }
                return result

    def get_all_memories(self, company_id: str) -> Dict[str, dict]:
        agents = ["CEO", "CFO", "CTO", "CMO", "Devil", "HR"]
        return {agent: self.get_agent_memory(company_id, agent) for agent in agents}

    def get_memory_count(self, company_id: str) -> int:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT COUNT(*) as cnt FROM agent_memories WHERE company_id = %s",
                    (company_id,),
                )
                row = cur.fetchone()
                return row["cnt"] if row else 0

    # ─── Session Operations ──────────────────────────────────────────

    def create_session(
        self,
        company_id: str,
        session_type: str = "initial",
    ) -> str:
        session_id = str(uuid.uuid4())
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO debate_sessions (id, company_id, session_type)
                       VALUES (%s, %s, %s)""",
                    (session_id, company_id, session_type),
                )
        return session_id

    def update_session(
        self,
        session_id: str,
        round_count: int = None,
        conflicts: list = None,
        agreements: list = None,
        score: int = None,
        summary: str = None,
        business_plan: dict = None,
    ):
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                updates = []
                params = []
                if round_count is not None:
                    updates.append("round_count = %s")
                    params.append(round_count)
                if conflicts is not None:
                    updates.append("key_conflicts = %s")
                    params.append(json.dumps(conflicts))
                if agreements is not None:
                    updates.append("key_agreements = %s")
                    params.append(json.dumps(agreements))
                if score is not None:
                    updates.append("investor_readiness_score = %s")
                    params.append(score)
                if summary is not None:
                    updates.append("summary = %s")
                    params.append(summary)
                if business_plan is not None:
                    updates.append("business_plan = %s")
                    params.append(json.dumps(business_plan))
                if updates:
                    params.append(session_id)
                    cur.execute(
                        f"UPDATE debate_sessions SET {', '.join(updates)} WHERE id = %s",
                        params,
                    )

    def get_sessions(self, company_id: str) -> List[dict]:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT * FROM debate_sessions WHERE company_id = %s
                       ORDER BY created_at DESC""",
                    (company_id,),
                )
                rows = cur.fetchall()
                res = []
                for r in rows:
                    d = dict(r)
                    if d.get("created_at"): d["created_at"] = d["created_at"].isoformat()
                    res.append(d)
                return res

    def get_session(self, session_id: str) -> Optional[dict]:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT * FROM debate_sessions WHERE id = %s", (session_id,)
                )
                row = cur.fetchone()
                if row:
                    d = dict(row)
                    if d.get("created_at"): d["created_at"] = d["created_at"].isoformat()
                    return d
                return None

    # ─── Company History Summary ────────────────────────

    def get_company_history_summary(self, company_id: str) -> str:
        sessions = self.get_sessions(company_id)
        memories = self.get_all_memories(company_id)

        if not sessions:
            return "No previous sessions found. This is our first analysis."

        summary_parts = [f"PREVIOUS SESSIONS ({len(sessions)} total):"]
        for s in sessions[:3]:
            conflicts = []
            if s.get("key_conflicts"):
                try:
                    conflicts = json.loads(s["key_conflicts"]) if isinstance(s["key_conflicts"], str) else s["key_conflicts"]
                except (json.JSONDecodeError, TypeError):
                    conflicts = []
            summary_parts.append(
                f"  [{s['created_at'][:10] if s.get('created_at') else 'N/A'}] "
                f"{(s.get('session_type') or 'initial').upper()} — "
                f"Score: {s.get('investor_readiness_score', 'N/A')}/100 | "
                f"Conflicts: {len(conflicts)}"
            )

        summary_parts.append("\nAGENT MEMORY SNAPSHOTS:")
        for agent, mems in memories.items():
            if mems:
                summary_parts.append(f"\n  {agent} remembers:")
                for key, data in list(mems.items())[:3]:
                    summary_parts.append(
                        f"    • {key}: {str(data['value'])[:100]}"
                    )

        return "\n".join(summary_parts)

    # ─── HR Operations ───────────────────────────────────────────────

    def save_hr_decision(
        self,
        company_id: str,
        session_id: str,
        position: str,
        candidate_name: str,
        fit_score: int,
        recommendation: str,
        evaluation: dict,
    ):
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO hr_decisions 
                       (company_id, session_id, position_title, candidate_name, 
                        fit_score, recommendation, evaluation_json)
                       VALUES (%s,%s,%s,%s,%s,%s,%s)""",
                    (
                        company_id,
                        session_id,
                        position,
                        candidate_name,
                        fit_score,
                        recommendation,
                        json.dumps(evaluation),
                    ),
                )

    def get_hr_decisions(self, company_id: str) -> List[dict]:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT * FROM hr_decisions WHERE company_id = %s
                       ORDER BY created_at DESC""",
                    (company_id,),
                )
                rows = cur.fetchall()
                res = []
                for r in rows:
                    d = dict(r)
                    if d.get("created_at"): d["created_at"] = d["created_at"].isoformat()
                    res.append(d)
                return res

    # ─── TrustOps Operations ────────────────────────

    def save_trustops_event(
        self,
        company_id: str,
        event_type: str,
        payload: dict,
        session_id: str = "",
        agent_name: str = "",
    ):
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO trustops_events
                       (company_id, session_id, event_type, agent_name, payload_json)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (
                        company_id,
                        session_id,
                        event_type,
                        agent_name,
                        json.dumps(payload),
                    ),
                )

    def get_trustops_events(self, company_id: str, limit: int = 50) -> List[dict]:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT * FROM trustops_events WHERE company_id = %s
                       ORDER BY created_at DESC LIMIT %s""",
                    (company_id, limit),
                )
                rows = cur.fetchall()
                res = []
                for r in rows:
                    d = dict(r)
                    if d.get("created_at"): d["created_at"] = d["created_at"].isoformat()
                    res.append(d)
                return res

    # ─── Chat Operations ────────────────────────

    def save_chat_message(self, company_id: str, role: str, content: str, agent_name: str = "Board"):
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO chat_messages (company_id, role, agent_name, content)
                       VALUES (%s, %s, %s, %s)""",
                    (company_id, role, agent_name, content),
                )

    def get_chat_history(self, company_id: str, limit: int = 100) -> List[dict]:
        with self._get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT role, agent_name, content, created_at 
                       FROM chat_messages 
                       WHERE company_id = %s 
                       ORDER BY created_at ASC LIMIT %s""",
                    (company_id, limit),
                )
                rows = cur.fetchall()
                res = []
                for r in rows:
                    d = dict(r)
                    if d.get("created_at"): d["created_at"] = d["created_at"].isoformat()
                    res.append(d)
                return res
