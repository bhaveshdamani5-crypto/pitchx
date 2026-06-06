"""
PitchX Memory Manager — Persistent SQLite memory for multi-agent boardroom.
Handles companies, agent memories, debate sessions, business plans, and HR decisions.
"""

import sqlite3
import json
import uuid
import os
from datetime import datetime
from typing import Optional, List, Dict, Any

DB_PATH = os.path.join(os.path.dirname(__file__), "pitchx_memory.db")

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME,
    company_brief JSON
);

CREATE TABLE IF NOT EXISTS agent_memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id TEXT REFERENCES companies(id),
    agent_name TEXT NOT NULL,
    memory_key TEXT NOT NULL,
    memory_value TEXT NOT NULL,
    confidence REAL DEFAULT 0.8,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, agent_name, memory_key) ON CONFLICT REPLACE
);

CREATE TABLE IF NOT EXISTS debate_sessions (
    id TEXT PRIMARY KEY,
    company_id TEXT REFERENCES companies(id),
    session_type TEXT DEFAULT 'initial',
    round_count INTEGER DEFAULT 0,
    key_conflicts JSON,
    key_agreements JSON,
    investor_readiness_score INTEGER DEFAULT 0,
    summary TEXT,
    business_plan JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_plan_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id TEXT REFERENCES companies(id),
    session_id TEXT REFERENCES debate_sessions(id),
    version INTEGER DEFAULT 1,
    plan_json JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hr_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id TEXT REFERENCES companies(id),
    session_id TEXT REFERENCES debate_sessions(id),
    position_title TEXT,
    candidate_name TEXT,
    resume_summary TEXT,
    fit_score INTEGER DEFAULT 0,
    recommendation TEXT,
    hr_notes TEXT,
    evaluation_json JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trustops_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id TEXT REFERENCES companies(id),
    session_id TEXT,
    event_type TEXT NOT NULL,
    agent_name TEXT,
    payload_json JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
"""


class MemoryManager:
    """Manages all persistent state for PitchX agents."""

    def __init__(self, db_path: str = None):
        self.db_path = db_path or DB_PATH
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            conn.executescript(SCHEMA_SQL)

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
            row = conn.execute(
                "SELECT * FROM companies WHERE LOWER(name) = LOWER(?)", (name,)
            ).fetchone()

            if row:
                conn.execute(
                    "UPDATE companies SET last_active = ? WHERE id = ?",
                    (datetime.now().isoformat(), row["id"]),
                )
                sessions = conn.execute(
                    "SELECT COUNT(*) as cnt FROM debate_sessions WHERE company_id = ?",
                    (row["id"],),
                ).fetchone()
                return {
                    "company_id": row["id"],
                    "is_returning": True,
                    "sessions_count": sessions["cnt"],
                    "last_active": row["last_active"],
                    "name": row["name"],
                }

            company_id = str(uuid.uuid4())
            conn.execute(
                """INSERT INTO companies 
                   (id, name, website, mode, industry, stage, monthly_revenue, team_size, last_active)
                   VALUES (?,?,?,?,?,?,?,?,?)""",
                (
                    company_id,
                    name,
                    website,
                    mode,
                    industry,
                    stage,
                    monthly_revenue,
                    team_size,
                    datetime.now().isoformat(),
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
            row = conn.execute(
                "SELECT * FROM companies WHERE id = ?", (company_id,)
            ).fetchone()
            if row:
                return dict(row)
        return None

    def update_company_brief(self, company_id: str, brief: dict):
        with self._get_conn() as conn:
            conn.execute(
                "UPDATE companies SET company_brief = ? WHERE id = ?",
                (json.dumps(brief), company_id),
            )

    def list_companies(self) -> List[dict]:
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT * FROM companies ORDER BY last_active DESC LIMIT 20"
            ).fetchall()
            return [dict(r) for r in rows]

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
            conn.execute(
                """INSERT OR REPLACE INTO agent_memories 
                   (company_id, agent_name, memory_key, memory_value, confidence, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    company_id,
                    agent,
                    key,
                    json.dumps(value) if not isinstance(value, str) else value,
                    confidence,
                    datetime.now().isoformat(),
                ),
            )

    def get_agent_memory(self, company_id: str, agent: str) -> dict:
        with self._get_conn() as conn:
            rows = conn.execute(
                """SELECT memory_key, memory_value, confidence, updated_at
                   FROM agent_memories
                   WHERE company_id = ? AND agent_name = ?
                   ORDER BY updated_at DESC""",
                (company_id, agent),
            ).fetchall()

            result = {}
            for row in rows:
                try:
                    val = json.loads(row["memory_value"])
                except (json.JSONDecodeError, TypeError):
                    val = row["memory_value"]
                result[row["memory_key"]] = {
                    "value": val,
                    "confidence": row["confidence"],
                    "last_updated": row["updated_at"],
                }
            return result

    def get_all_memories(self, company_id: str) -> Dict[str, dict]:
        agents = ["CEO", "CFO", "CTO", "CMO", "Devil", "HR"]
        return {agent: self.get_agent_memory(company_id, agent) for agent in agents}

    def get_memory_count(self, company_id: str) -> int:
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT COUNT(*) as cnt FROM agent_memories WHERE company_id = ?",
                (company_id,),
            ).fetchone()
            return row["cnt"] if row else 0

    # ─── Session Operations ──────────────────────────────────────────

    def create_session(
        self,
        company_id: str,
        session_type: str = "initial",
    ) -> str:
        session_id = str(uuid.uuid4())
        with self._get_conn() as conn:
            conn.execute(
                """INSERT INTO debate_sessions (id, company_id, session_type)
                   VALUES (?, ?, ?)""",
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
            updates = []
            params = []
            if round_count is not None:
                updates.append("round_count = ?")
                params.append(round_count)
            if conflicts is not None:
                updates.append("key_conflicts = ?")
                params.append(json.dumps(conflicts))
            if agreements is not None:
                updates.append("key_agreements = ?")
                params.append(json.dumps(agreements))
            if score is not None:
                updates.append("investor_readiness_score = ?")
                params.append(score)
            if summary is not None:
                updates.append("summary = ?")
                params.append(summary)
            if business_plan is not None:
                updates.append("business_plan = ?")
                params.append(json.dumps(business_plan))
            if updates:
                params.append(session_id)
                conn.execute(
                    f"UPDATE debate_sessions SET {', '.join(updates)} WHERE id = ?",
                    params,
                )

    def get_sessions(self, company_id: str) -> List[dict]:
        with self._get_conn() as conn:
            rows = conn.execute(
                """SELECT * FROM debate_sessions WHERE company_id = ?
                   ORDER BY created_at DESC""",
                (company_id,),
            ).fetchall()
            return [dict(r) for r in rows]

    def get_session(self, session_id: str) -> Optional[dict]:
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT * FROM debate_sessions WHERE id = ?", (session_id,)
            ).fetchone()
            return dict(row) if row else None

    # ─── Company History Summary (for agent prompt injection) ────────

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
                    conflicts = json.loads(s["key_conflicts"])
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
            conn.execute(
                """INSERT INTO hr_decisions 
                   (company_id, session_id, position_title, candidate_name, 
                    fit_score, recommendation, evaluation_json)
                   VALUES (?,?,?,?,?,?,?)""",
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
            rows = conn.execute(
                """SELECT * FROM hr_decisions WHERE company_id = ?
                   ORDER BY created_at DESC""",
                (company_id,),
            ).fetchall()
            return [dict(r) for r in rows]

    # ─── TrustOps / Data Flywheel Operations ────────────────────────

    def save_trustops_event(
        self,
        company_id: str,
        event_type: str,
        payload: dict,
        session_id: str = "",
        agent_name: str = "",
    ):
        with self._get_conn() as conn:
            conn.execute(
                """INSERT INTO trustops_events
                   (company_id, session_id, event_type, agent_name, payload_json)
                   VALUES (?, ?, ?, ?, ?)""",
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
            rows = conn.execute(
                """SELECT * FROM trustops_events WHERE company_id = ?
                   ORDER BY created_at DESC LIMIT ?""",
                (company_id, limit),
            ).fetchall()
            return [dict(r) for r in rows]
