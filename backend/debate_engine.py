"""
PitchX Debate Engine — Core multi-round adversarial debate loop with streaming.
Orchestrates 5 agents through structured debate rounds with memory injection.
"""

import os
import re
import json
import asyncio
import logging
from typing import AsyncGenerator, Optional
from datetime import datetime

from openai import OpenAI

from agents import AGENT_CONFIG, build_agent_prompt_with_memory
from memory_manager import MemoryManager
from claim_parser import parse_claims, is_memory_key_allowed
from nvidia_trustops import guard_text, redact_pii, validate_claim

logger = logging.getLogger(__name__)

# Debate configuration
DEBATE_AGENTS_ORDER = ["CEO", "CFO", "CTO", "CMO"]
ROUND_LABELS = {
    1: "First Impressions — Independent Analysis",
    2: "Cross-Examination — Agents Challenge Each Other",
    3: "Devil's Advocate — Final Stress Test",
}
MAX_TOKENS_PER_AGENT = 1200


class DebateEngine:
    """Runs a multi-round adversarial debate between AI agents."""

    def __init__(self, memory_manager: Optional[MemoryManager] = None):
        self.memory = memory_manager or MemoryManager()
        api_key = os.getenv("NVIDIA_API_KEY")
        if not api_key:
            raise ValueError("NVIDIA_API_KEY not set")
        self.api_key = api_key
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1", 
            api_key=api_key,
            max_retries=5
        )

    async def run_debate(
        self,
        session_id: str,
        company_id: str,
        idea: str,
        mode: str = "new_idea",
        company_brief: Optional[dict] = None,
        challenge: Optional[str] = None,
        founder_background: Optional[str] = None,
        budget: Optional[float] = None,
        market: Optional[str] = None,
        timeline_months: Optional[int] = None,
        reality_gap: Optional[dict] = None,
    ) -> AsyncGenerator[dict, None]:
        """
        Run the full debate loop and yield SSE events.
        """
        # Build idea context string
        idea_context = self._build_idea_context(
            idea, mode, challenge, founder_background, budget, market, timeline_months,
            reality_gap=reality_gap,
        )

        # Load memories for all agents
        memory_count = self.memory.get_memory_count(company_id)
        if memory_count > 0:
            yield {
                "type": "memory_loaded",
                "count": memory_count,
                "summary": self.memory.get_company_history_summary(company_id),
            }

        # Inject company brief if available
        if company_brief:
            yield {
                "type": "research_injected",
                "brief_summary": company_brief.get("product_description", "")[:200],
            }

        if reality_gap and reality_gap.get("score", 0) > 0:
            yield {
                "type": "reality_gap_loaded",
                "score": reality_gap.get("score"),
                "severity": reality_gap.get("severity"),
                "gaps": reality_gap.get("gaps", [])[:5],
                "summary": reality_gap.get("summary", ""),
            }

        all_responses = {}
        conflicts = []
        agreements = []

        # ─── Round 1: First Impressions ──────────────────────────
        yield {"type": "round_start", "round": 1, "label": ROUND_LABELS[1]}

        for agent_name in DEBATE_AGENTS_ORDER:
            async for event in self._run_single_agent(
                agent_name=agent_name,
                company_id=company_id,
                idea_context=idea_context,
                context="This is Round 1 — give your independent assessment. Do not reference other agents yet.",
                company_brief=company_brief,
                round_num=1,
                session_id=session_id,
            ):
                yield event
                if event.get("type") == "agent_done":
                    all_responses[agent_name] = event.get("full_response", "")

            # Delay between agents to prevent rate limit
            await asyncio.sleep(5.0)

        # Round 1 summary
        r1_conflicts, r1_agreements = self._detect_conflicts(all_responses)
        conflicts.extend(r1_conflicts)
        agreements.extend(r1_agreements)
        yield {
            "type": "round_summary",
            "round": 1,
            "conflicts": r1_conflicts,
            "agreements": r1_agreements,
        }

        # ─── Round 2: Cross-Examination ──────────────────────────
        yield {"type": "round_start", "round": 2, "label": ROUND_LABELS[2]}

        cross_exam_context = self._build_cross_exam_context(all_responses)

        for agent_name in DEBATE_AGENTS_ORDER:
            async for event in self._run_single_agent(
                agent_name=agent_name,
                company_id=company_id,
                idea_context=idea_context,
                context=cross_exam_context,
                company_brief=company_brief,
                round_num=2,
                session_id=session_id,
            ):
                yield event
                if event.get("type") == "agent_done":
                    all_responses[f"{agent_name}_r2"] = event.get("full_response", "")

            await asyncio.sleep(5.0)

        # Round 2 summary
        r2_responses = {
            k.replace("_r2", ""): v
            for k, v in all_responses.items()
            if "_r2" in k
        }
        r2_conflicts, r2_agreements = self._detect_conflicts(r2_responses)
        conflicts.extend(r2_conflicts)
        agreements.extend(r2_agreements)
        yield {
            "type": "round_summary",
            "round": 2,
            "conflicts": r2_conflicts,
            "agreements": r2_agreements,
        }

        # ─── Round 3: Devil's Advocate ───────────────────────────
        yield {"type": "round_start", "round": 3, "label": ROUND_LABELS[3]}

        devil_context = self._build_devil_context(all_responses, conflicts, agreements)

        async for event in self._run_single_agent(
            agent_name="Devil",
            company_id=company_id,
            idea_context=idea_context,
            context=devil_context,
            company_brief=company_brief,
            round_num=3,
            session_id=session_id,
        ):
            yield event
            if event.get("type") == "agent_done":
                all_responses["Devil"] = event.get("full_response", "")

        yield {
            "type": "round_summary",
            "round": 3,
            "conflicts": conflicts,
            "agreements": agreements,
        }

        # ─── Synthesize Business Plan ────────────────────────────
        yield {"type": "synthesis_start"}

        business_plan = await self._synthesize_plan(
            idea_context, all_responses, conflicts, agreements, company_brief
        )

        # Calculate investor readiness score
        score = self._calculate_investor_score(all_responses, conflicts, agreements)

        # Save session data
        self.memory.update_session(
            session_id=session_id,
            round_count=3,
            conflicts=conflicts,
            agreements=agreements,
            score=score,
            summary=business_plan.get("executive_summary", ""),
            business_plan=business_plan,
        )

        kill_probability = self._extract_kill_probability(all_responses)

        board_resolution = await self._synthesize_board_vote(
            idea_context, all_responses, conflicts, score, kill_probability
        )

        yield {
            "type": "business_plan",
            "plan": business_plan,
            "investor_readiness_score": score,
            "kill_probability": kill_probability,
        }

        yield {"type": "board_resolution", "resolution": board_resolution}

        # Save agent memories with scope enforcement
        memory_saves = self._extract_memory_saves(all_responses)
        for agent_name, memories in memory_saves.items():
            for key, value in memories.items():
                if not is_memory_key_allowed(agent_name, key, AGENT_CONFIG):
                    yield {
                        "type": "memory_rejected",
                        "agent": agent_name,
                        "key": key,
                        "reason": "out_of_scope",
                    }
                    self.memory.save_trustops_event(
                        company_id=company_id,
                        session_id=session_id,
                        agent_name=agent_name,
                        event_type="memory_rejected",
                        payload={"key": key, "reason": "out_of_scope"},
                    )
                    continue
                self.memory.save_agent_memory(company_id, agent_name, key, value)
                self.memory.save_trustops_event(
                    company_id=company_id,
                    session_id=session_id,
                    agent_name=agent_name,
                    event_type="memory_saved",
                    payload={"key": key},
                )
                yield {
                    "type": "memory_save",
                    "agent": agent_name,
                    "key": key,
                }

        yield {
            "type": "done",
            "session_id": session_id,
            "score": score,
            "kill_probability": kill_probability,
            "board_verdict": board_resolution.get("board_verdict"),
        }

    async def _run_single_agent(
        self,
        agent_name: str,
        company_id: str,
        idea_context: str,
        context: str,
        company_brief: Optional[dict],
        round_num: int,
        session_id: str,
    ) -> AsyncGenerator[dict, None]:
        """Run a single agent and yield streaming events."""
        config = AGENT_CONFIG.get(agent_name) or AGENT_CONFIG.get("Devil") or {}
        display_name = config.get("name", agent_name)

        yield {
            "type": "agent_start",
            "agent": agent_name,
            "round": round_num,
            "emoji": config.get("emoji", "🤖"),
            "color": config.get("color", "#6B7280"),
            "title": config.get("title", agent_name),
        }

        # Build system prompt with memory
        system_prompt = build_agent_prompt_with_memory(
            agent_name=agent_name,
            company_id=company_id,
            company_brief=company_brief or {},
            memory_manager=self.memory,
        )

        user_message = f"""STARTUP/COMPANY CONTEXT:
{idea_context}

ROUND {round_num} CONTEXT:
{context}

Provide your analysis now. Be specific, cite data, use numbers where possible."""

        full_response = ""

        try:
            loop = asyncio.get_event_loop()

            # Stream response
            def create_stream():
                return self.client.chat.completions.create(
                    model="meta/llama-3.3-70b-instruct",
                    max_tokens=MAX_TOKENS_PER_AGENT,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    stream=True,
                )

            stream = await loop.run_in_executor(None, create_stream)

            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    text = chunk.choices[0].delta.content
                    full_response += text
                    yield {
                        "type": "token",
                        "agent": agent_name,
                        "content": text,
                    }

        except Exception as e:
            logger.error(f"Agent {agent_name} error: {e}")
            full_response = f"[Agent {agent_name} encountered an error: {str(e)[:100]}]"
            yield {
                "type": "token",
                "agent": agent_name,
                "content": full_response,
            }

        # Extract confidence score
        confidence = self._extract_confidence(full_response)

        sources = (company_brief or {}).get("research_sources", [])
        evidence_pack = (company_brief or {}).get("evidence_pack", [])
        raw_claims = parse_claims(full_response, sources)
        claims = [validate_claim(claim, evidence_pack) for claim in raw_claims]
        for claim in claims:
            yield {"type": "claim", "agent": agent_name, **claim}
            self.memory.save_trustops_event(
                company_id=company_id,
                session_id=session_id,
                agent_name=agent_name,
                event_type="claim_checked",
                payload=claim,
            )

        guard = await guard_text(
            full_response,
            self.api_key,
            policy="startup boardroom analysis must be safe, relevant, and professional",
        )
        yield {
            "type": "guard_check",
            "agent": agent_name,
            "safe": guard.get("safe", True),
            "provider": guard.get("provider"),
            "model": guard.get("model"),
            "categories": guard.get("categories", []),
        }
        self.memory.save_trustops_event(
            company_id=company_id,
            session_id=session_id,
            agent_name=agent_name,
            event_type="guard_check",
            payload={k: guard.get(k) for k in ("provider", "model", "safe", "categories")},
        )

        yield {
            "type": "agent_done",
            "agent": agent_name,
            "confidence": confidence,
            "full_response": full_response,
            "round": round_num,
            "claims_count": len(claims),
        }

    def _build_idea_context(
        self, idea, mode, challenge, founder_background, budget, market, timeline_months,
        reality_gap=None,
    ) -> str:
        parts = [f"MODE: {mode}"]
        parts.append(f"IDEA/COMPANY: {idea}")
        if challenge:
            parts.append(f"KEY CHALLENGE: {challenge}")
        if founder_background:
            parts.append(f"FOUNDER BACKGROUND: {founder_background}")
        if budget:
            parts.append(f"BUDGET: ₹{budget:,.0f}")
        if market:
            parts.append(f"TARGET MARKET: {market}")
        if timeline_months:
            parts.append(f"TIMELINE: {timeline_months} months")
        if reality_gap and reality_gap.get("gaps"):
            parts.append(f"\nREALITY GAP SCORE: {reality_gap.get('score')}/100 ({reality_gap.get('severity')})")
            parts.append("NARRATIVE-RESEARCH CONTRADICTIONS (address these explicitly):")
            for gap in reality_gap.get("gaps", [])[:5]:
                parts.append(
                    f"  - Founder: {gap.get('claim')} | Reality: {gap.get('reality')} "
                    f"[source: {gap.get('source')}]"
                )
        return "\n".join(parts)

    def _extract_kill_probability(self, responses: dict) -> int:
        devil_resp = responses.get("Devil", "")
        match = re.search(r"KILL_PROBABILITY:\s*(\d+)/10", devil_resp, re.IGNORECASE)
        return int(match.group(1)) if match else 5

    async def _synthesize_board_vote(
        self, idea_context, responses, conflicts, investor_score, kill_probability
    ) -> dict:
        """Produce structured board resolution from debate."""
        truncated = {k: v[:600] for k, v in responses.items()}

        prompt = f"""Synthesize this boardroom debate into a structured board resolution.

CONTEXT: {idea_context[:500]}
INVESTOR READINESS: {investor_score}/100
KILL PROBABILITY: {kill_probability}/10
CONFLICTS: {json.dumps(conflicts[:5])}
AGENT POSITIONS: {json.dumps(truncated)[:4000]}

Return ONLY valid JSON:
{{
  "votes": {{"CEO": "APPROVE|CONDITIONAL|REJECT", "CFO": "...", "CTO": "...", "CMO": "...", "Devil": "REJECT"}},
  "conditions": ["CFO: specific condition if conditional"],
  "dissent": "Devil's primary objection in one sentence",
  "board_verdict": "GO|CONDITIONAL_GO|NO_GO"
}}
Return ONLY JSON."""

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model="meta/llama-3.3-70b-instruct",
                    max_tokens=800,
                    messages=[{"role": "user", "content": prompt}],
                ),
            )
            content = response.choices[0].message.content
            text = content.strip() if content else ""
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
            return json.loads(text)
        except Exception as e:
            logger.error(f"Board vote synthesis error: {e}")
            return {
                "votes": {
                    "CEO": "CONDITIONAL",
                    "CFO": "CONDITIONAL",
                    "CTO": "APPROVE",
                    "CMO": "APPROVE",
                    "Devil": "REJECT",
                },
                "conditions": ["Resolve key conflicts before proceeding"],
                "dissent": f"Kill probability {kill_probability}/10",
                "board_verdict": "CONDITIONAL_GO" if investor_score >= 50 else "NO_GO",
            }

    def _build_cross_exam_context(self, responses: dict) -> str:
        """Build context from Round 1 responses for cross-examination."""
        parts = [
            "Round 2 — CROSS-EXAMINATION. You have read all Round 1 analyses below.",
            "Challenge the weakest arguments. Support strong ones. Direct questions with @mentions.",
            "If you disagree, say WHY with evidence.",
            "",
        ]
        for agent, resp in responses.items():
            if "_r2" not in agent:
                parts.append(f"--- {agent}'s Round 1 Analysis ---")
                parts.append(resp[:800])
                parts.append("")
        return "\n".join(parts)

    def _build_devil_context(
        self, responses: dict, conflicts: list, agreements: list
    ) -> str:
        """Build context for Devil's Advocate from all rounds."""
        parts = [
            "DEVIL'S ADVOCATE ROUND — This is your moment.",
            f"There were {len(conflicts)} conflicts and {len(agreements)} agreements.",
            "",
            "KEY CONFLICTS TO EXPLOIT:",
        ]
        for c in conflicts[:5]:
            parts.append(f"  - {c}")
        parts.append("")
        parts.append("ALL AGENT RESPONSES (summarized):")
        for agent, resp in responses.items():
            parts.append(f"  {agent}: {resp[:300]}")
        return "\n".join(parts)

    def _detect_conflicts(self, responses: dict) -> tuple:
        """Simple conflict detection based on sentiment analysis of responses."""
        conflicts = []
        agreements = []

        agents = list(responses.keys())
        keywords_negative = [
            "disagree", "wrong", "unrealistic", "impossible", "too high",
            "too low", "overestimate", "underestimate", "risk", "fatal",
            "won't work", "doesn't make sense", "@",
        ]
        keywords_positive = [
            "agree", "support", "strong", "viable", "excellent", "solid",
            "aligned", "consensus",
        ]

        for i, a1 in enumerate(agents):
            for a2 in agents[i + 1:]:
                r1 = responses[a1].lower()
                r2 = responses[a2].lower()

                neg_count = sum(
                    1 for k in keywords_negative if k in r1 or k in r2
                )
                pos_count = sum(
                    1 for k in keywords_positive if k in r1 or k in r2
                )

                if neg_count > 3:
                    conflicts.append(f"{a1} vs {a2}: Significant disagreement detected")
                if pos_count > 2:
                    agreements.append(f"{a1} and {a2}: General alignment")

        return conflicts, agreements

    def _extract_confidence(self, response: str) -> int:
        """Extract CONFIDENCE_SCORE or KILL_PROBABILITY from response."""
        patterns = [
            r"CONFIDENCE_SCORE:\s*(\d+)/10",
            r"KILL_PROBABILITY:\s*(\d+)/10",
            r"Confidence:\s*(\d+)/10",
        ]
        for pattern in patterns:
            match = re.search(pattern, response, re.IGNORECASE)
            if match:
                return int(match.group(1))
        return 5  # default

    def _extract_memory_saves(self, responses: dict) -> dict:
        """Parse SAVE_MEMORY:key=value tags from agent responses."""
        memory_saves: dict[str, dict[str, str]] = {}
        pattern = r"SAVE_MEMORY:(\w+)=(.+?)(?:\n|$)"

        for agent, resp in responses.items():
            agent_clean = agent.replace("_r2", "")
            matches = re.findall(pattern, resp)
            if matches:
                memory_saves[agent_clean] = {}
                for key, value in matches:
                    memory_saves[agent_clean][key] = value.strip()

        return memory_saves

    def _calculate_investor_score(
        self, responses: dict, conflicts: list, agreements: list
    ) -> int:
        """Calculate Investor Readiness Score (0-100)."""
        base = 50

        # Extract confidence scores
        confidences = []
        for agent, resp in responses.items():
            c = self._extract_confidence(resp)
            if "Devil" not in agent:
                confidences.append(c)

        if confidences:
            avg_confidence = sum(confidences) / len(confidences)
            base += int(avg_confidence * 3)  # up to +30

        # Conflicts lower score
        base -= min(len(conflicts) * 3, 15)

        # Agreements raise score
        base += min(len(agreements) * 2, 10)

        # Devil's kill probability
        devil_resp = responses.get("Devil", "")
        kill_match = re.search(r"KILL_PROBABILITY:\s*(\d+)/10", devil_resp, re.IGNORECASE)
        if kill_match:
            kill = int(kill_match.group(1))
            base -= kill * 2  # high kill prob hurts

        return max(0, min(100, base))

    async def _synthesize_plan(
        self,
        idea_context: str,
        responses: dict,
        conflicts: list,
        agreements: list,
        company_brief: Optional[dict],
    ) -> dict:
        """Use Claude to synthesize all agent outputs into a structured business plan."""
        # Truncate responses for context window
        truncated = {}
        for agent, resp in responses.items():
            truncated[agent] = resp[:1000]

        synthesis_prompt = f"""You are synthesizing a multi-agent debate into a structured business plan.

ORIGINAL CONTEXT:
{idea_context}

AGENT RESPONSES:
{json.dumps(truncated, indent=2)[:6000]}

KEY CONFLICTS:
{json.dumps(conflicts[:5])}

KEY AGREEMENTS:
{json.dumps(agreements[:5])}

Create a structured business plan as JSON with these sections:
{{
  "executive_summary": "2-3 sentence overview",
  "market_opportunity": {{
    "target_market": "string",
    "market_size": "string",
    "growth_rate": "string",
    "key_trends": ["string"]
  }},
  "value_proposition": "string",
  "competitive_advantage": ["string"],
  "business_model": {{
    "revenue_streams": ["string"],
    "pricing_strategy": "string",
    "unit_economics": "string"
  }},
  "go_to_market": {{
    "icp": "string",
    "channels": ["string"],
    "first_90_days": "string"
  }},
  "technical_plan": {{
    "tech_stack": ["string"],
    "mvp_features": ["string"],
    "build_timeline": "string"
  }},
  "financial_projections": {{
    "initial_investment": "string",
    "monthly_burn": "string",
    "revenue_timeline": "string",
    "break_even": "string"
  }},
  "risk_matrix": [
    {{"risk": "string", "severity": "high/medium/low", "mitigation": "string"}}
  ],
  "key_conflicts_resolved": ["string"],
  "unresolved_questions": ["string"],
  "next_steps": ["string"]
}}

Return ONLY valid JSON. No markdown, no explanation."""

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model="meta/llama-3.3-70b-instruct",
                    max_tokens=2500,
                    messages=[{"role": "user", "content": synthesis_prompt}],
                ),
            )

            content = response.choices[0].message.content
            text = content.strip() if content else ""
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()

            return json.loads(text)
        except Exception as e:
            logger.error(f"Plan synthesis error: {e}")
            return {
                "executive_summary": f"Business plan synthesis for: {idea_context[:200]}",
                "error": str(e),
                "raw_conflicts": conflicts[:3],
                "raw_agreements": agreements[:3],
            }


class HREngine:
    """Runs HR candidate evaluation using the HR agent with business plan context."""

    def __init__(self, memory_manager: Optional[MemoryManager] = None):
        self.memory = memory_manager or MemoryManager()
        api_key = os.getenv("NVIDIA_API_KEY")
        if not api_key:
            raise ValueError("NVIDIA_API_KEY not set")
        self.api_key = api_key
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1", 
            api_key=api_key,
            max_retries=5
        )

    async def evaluate_candidates(
        self,
        company_id: str,
        session_id: str,
        position: dict,
        candidates: list,
        business_plan_context: Optional[str] = None,
    ) -> AsyncGenerator[dict, None]:
        """Evaluate candidates and yield streaming events."""
        yield {
            "type": "hr_start",
            "candidates_count": len(candidates),
            "position": position.get("title", "Unknown"),
        }

        # Get business plan context from session if not provided
        if not business_plan_context:
            session = self.memory.get_session(session_id) if session_id else None
            if session and session.get("business_plan"):
                bp = session["business_plan"]
                if isinstance(bp, str):
                    try:
                        bp = json.loads(bp)
                    except json.JSONDecodeError:
                        pass
                business_plan_context = json.dumps(bp)[:2000] if isinstance(bp, dict) else str(bp)[:2000]

        # Get agent memories for context
        cto_memory = self.memory.get_agent_memory(company_id, "CTO")
        cfo_memory = self.memory.get_agent_memory(company_id, "CFO")
        ceo_memory = self.memory.get_agent_memory(company_id, "CEO")

        evaluations = []

        for candidate in candidates:
            cand_id = candidate.get("id", candidate.get("name", "unknown"))
            cand_name = candidate.get("name", "Unknown")

            yield {
                "type": "candidate_start",
                "candidate_id": cand_id,
                "name": cand_name,
            }

            candidate_text = "\n".join([
                str(candidate.get("resume_text", "")),
                str(candidate.get("interview_transcript", "")),
            ])
            guard = await guard_text(
                candidate_text,
                self.api_key,
                policy="candidate evaluation input privacy and safety",
            )
            pii = guard.get("pii", {})
            yield {
                "type": "hr_guard",
                "candidate_id": cand_id,
                "name": cand_name,
                "safe": guard.get("safe", True),
                "provider": guard.get("provider"),
                "model": guard.get("model"),
                "pii_detected": pii.get("pii_detected", False),
                "emails_redacted": pii.get("emails", 0),
                "phones_redacted": pii.get("phones", 0),
                "categories": guard.get("categories", []),
            }
            self.memory.save_trustops_event(
                company_id=company_id,
                session_id=session_id or "",
                agent_name="HR",
                event_type="hr_privacy_guard",
                payload={
                    "candidate": cand_name,
                    "safe": guard.get("safe", True),
                    "provider": guard.get("provider"),
                    "pii": pii,
                    "categories": guard.get("categories", []),
                },
            )

            guarded_candidate = dict(candidate)
            guarded_candidate["resume_text"] = redact_pii(candidate.get("resume_text", ""))[0]
            guarded_candidate["interview_transcript"] = redact_pii(
                candidate.get("interview_transcript", "")
            )[0]

            evaluation = await self._evaluate_single_candidate(
                position=position,
                candidate=guarded_candidate,
                business_plan_context=business_plan_context,
                cto_memory=cto_memory,
                cfo_memory=cfo_memory,
                ceo_memory=ceo_memory,
            )

            evaluations.append(evaluation)

            # Save HR decision
            self.memory.save_hr_decision(
                company_id=company_id,
                session_id=session_id or None,
                position=position.get("title", ""),
                candidate_name=cand_name,
                fit_score=evaluation.get("composite_fit_score", 0),
                recommendation=evaluation.get("verdict", "NEXT_ROUND"),
                evaluation=evaluation,
            )

            yield {
                "type": "candidate_done",
                "candidate_id": cand_id,
                "name": cand_name,
                "score": evaluation.get("composite_fit_score", 0),
                "verdict": evaluation.get("verdict", "NEXT_ROUND"),
                "evaluation": evaluation,
            }

        # Rank candidates
        ranked = sorted(evaluations, key=lambda x: x.get("composite_fit_score", 0), reverse=True)
        ranked_names = [e.get("candidate_name", "Unknown") for e in ranked]

        # Team gap analysis
        gap_analysis = await self._analyze_team_gaps(
            position, evaluations, business_plan_context
        )

        yield {
            "type": "hr_done",
            "ranked_list": ranked_names,
            "evaluations": evaluations,
            "team_gap_analysis": gap_analysis,
            "top_recommendation": ranked[0] if ranked else None,
        }

    async def _evaluate_single_candidate(
        self,
        position: dict,
        candidate: dict,
        business_plan_context: Optional[str],
        cto_memory: dict,
        cfo_memory: dict,
        ceo_memory: dict,
    ) -> dict:
        """Evaluate a single candidate using the HR agent."""
        hr_prompt = AGENT_CONFIG["HR"]["system_prompt"]

        context_parts = [
            f"POSITION: {position.get('title', 'N/A')} — {position.get('level', 'N/A')} level",
            f"TEAM: {position.get('team', 'N/A')}",
            f"BUDGET: {position.get('budget', 'N/A')}",
        ]

        if business_plan_context:
            context_parts.append(f"\nBUSINESS PLAN CONTEXT:\n{business_plan_context[:1500]}")

        if cto_memory:
            context_parts.append(f"\nCTO REQUIREMENTS: {json.dumps(cto_memory)[:500]}")
        if cfo_memory:
            context_parts.append(f"\nCFO BUDGET CONTEXT: {json.dumps(cfo_memory)[:300]}")
        if ceo_memory:
            context_parts.append(f"\nCEO CULTURE/VISION: {json.dumps(ceo_memory)[:300]}")

        context_parts.append(f"\n--- CANDIDATE: {candidate.get('name', 'Unknown')} ---")
        context_parts.append(f"RESUME:\n{candidate.get('resume_text', 'No resume provided')[:2000]}")
        if candidate.get("interview_transcript"):
            context_parts.append(
                f"\nINTERVIEW TRANSCRIPT:\n{candidate['interview_transcript'][:1500]}"
            )

        context_parts.append(
            "\n\nEvaluate this candidate using your framework. Return a JSON evaluation."
        )

        user_message = "\n".join(context_parts)

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model="meta/llama-3.3-70b-instruct",
                    max_tokens=1500,
                    messages=[
                        {"role": "system", "content": str(hr_prompt) + "\n\nReturn your evaluation as valid JSON only."},
                        {"role": "user", "content": user_message}
                    ],
                ),
            )

            content = response.choices[0].message.content
            text = content.strip() if content else ""
            # Try to extract JSON from response
            if "```" in text:
                json_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
                if json_match:
                    text = json_match.group(1).strip()

            # Try to find JSON object in text
            json_match = re.search(r"\{.*\}", text, re.DOTALL)
            if json_match:
                evaluation = json.loads(json_match.group())
            else:
                evaluation = json.loads(text)

            evaluation["candidate_name"] = candidate.get("name", "Unknown")
            return evaluation

        except Exception as e:
            logger.error(f"HR evaluation error: {e}")
            return {
                "candidate_name": candidate.get("name", "Unknown"),
                "composite_fit_score": 50,
                "verdict": "NEXT_ROUND",
                "error": str(e),
                "scores": {
                    "technical_fit": 5,
                    "culture_fit": 5,
                    "growth_potential": 5,
                    "execution_evidence": 5,
                    "risk_flags": 5,
                    "communication": 5,
                },
                "strengths": ["Unable to fully evaluate — please retry"],
                "concerns": ["Evaluation encountered an error"],
                "follow_up_questions": ["Please retry evaluation"],
            }

    async def _analyze_team_gaps(
        self,
        position: dict,
        evaluations: list,
        business_plan_context: Optional[str],
    ) -> dict:
        """Analyze team gaps based on evaluations and business plan."""
        hired = [
            e for e in evaluations if e.get("verdict") == "HIRE"
        ]
        return {
            "filled_by_hiring": [position.get("title", "Unknown")] if hired else [],
            "still_missing": ["Product Designer", "Sales Development Rep"]
                if not business_plan_context else [],
            "critical_gap": "Review business plan for unfilled critical roles",
        }
