"""
PitchX Reality Gap — Compares founder-provided narrative vs live research
brief.
"""

import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


def _severity_label(score: int) -> str:
    if score >= 70:
        return "High"
    if score >= 40:
        return "Moderate"
    return "Low"


async def compute_reality_gap(
    user_context: dict,
    company_brief: dict,
    nvidia_key: Optional[str] = None,
) -> dict:
    """
    Compare founder narrative against CompanyBrief.
    Returns {score, severity, gaps: [{claim, reality, source, severity}]}
    """
    if not company_brief:
        return {"score": 0, "severity": "Low", "gaps": [], "summary": "No research data available."}

    if not OPENAI_AVAILABLE or not nvidia_key:
        return _heuristic_gap(user_context, company_brief)

    try:
        client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1", 
            api_key=nvidia_key,
            max_retries=5
        )
        prompt = f"""Compare the founder's self-reported narrative against live public research.
Identify contradictions, omissions, and overstatements.

FOUNDER NARRATIVE:
{json.dumps(user_context, indent=2)[:2000]}

LIVE RESEARCH (CompanyBrief):
{json.dumps(company_brief, indent=2)[:4000]}

Return ONLY valid JSON:
{{
  "score": 0-100,
  "gaps": [
    {{
      "claim": "what the founder implied or stated",
      "reality": "what public data shows",
      "source": "glassdoor_reviews|customer_reviews|funding_news|competitors|recent_news|red_flags",
      "severity": "high|medium|low"
    }}
  ],
  "summary": "one sentence executive summary"
}}

Score guide: 0 = aligned, 100 = severe delusion. If no contradictions, score should be under 20 with empty gaps array.
Return ONLY JSON."""

        import asyncio
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model="meta/llama-3.3-70b-instruct",
                max_tokens=1200,
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

        result = json.loads(text)
        score = max(0, min(100, int(result.get("score", 0))))
        result["score"] = score
        result["severity"] = _severity_label(score)
        return result

    except Exception as e:
        logger.error(f"Reality gap computation error: {e}")
        return _heuristic_gap(user_context, company_brief)


def _heuristic_gap(user_context: dict, company_brief: dict) -> dict:
    """Rule-based fallback when Claude is unavailable."""
    gaps = []
    rep = company_brief.get("reputation_data", {})
    glassdoor = rep.get("glassdoor_rating")
    challenge = (user_context.get("challenge") or "").lower()

    if glassdoor and glassdoor < 3.5:
        if any(w in challenge for w in ("culture", "team", "morale", "happy", "great place")):
            gaps.append({
                "claim": "Positive team/culture narrative in founder input",
                "reality": f"Glassdoor rating is {glassdoor}/5",
                "source": "glassdoor_reviews",
                "severity": "high",
            })

    red_flags = company_brief.get("red_flags_detected", [])
    if red_flags and not user_context.get("challenge"):
        gaps.append({
            "claim": "No key challenges disclosed by founder",
            "reality": f"Research detected {len(red_flags)} red flag(s): {red_flags[0][:80]}",
            "source": "red_flags",
            "severity": "medium",
        })

    complaints = rep.get("top_complaints", [])
    if complaints and "customer" in challenge and "satisfied" in challenge:
        gaps.append({
            "claim": "Strong customer satisfaction claimed",
            "reality": f"Top complaint: {complaints[0][:100]}",
            "source": "customer_reviews",
            "severity": "high",
        })

    score = min(100, len(gaps) * 25 + (10 if red_flags else 0))
    return {
        "score": score,
        "severity": _severity_label(score),
        "gaps": gaps,
        "summary": (
            f"Found {len(gaps)} narrative-research gap(s)."
            if gaps
            else "Founder narrative broadly aligns with public data."
        ),
    }