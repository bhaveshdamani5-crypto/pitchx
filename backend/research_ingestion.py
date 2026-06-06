"""
PitchX Research Ingestion — Gathers real company intelligence via Tavily + Claude synthesis.
"""

import os
import json
import asyncio
import logging
import re
from typing import Optional, AsyncGenerator

from reality_gap import compute_reality_gap

logger = logging.getLogger(__name__)

# Try importing tavily; graceful fallback if not available
try:
    from tavily import TavilyClient
    TAVILY_AVAILABLE = True
except ImportError:
    TAVILY_AVAILABLE = False

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


RESEARCH_QUERIES = {
    "company_overview": "{company} company overview product description funding",
    "glassdoor_reviews": "{company} glassdoor employee reviews culture rating",
    "customer_reviews": "{company} G2 Capterra Trustpilot user reviews rating",
    "competitors": "{company} competitors alternatives market comparison",
    "funding_news": "{company} funding rounds valuation investment latest",
    "recent_news": "{company} news 2025 2026 latest developments",
    "market_landscape": "{industry} market size growth trends 2025 2026",
    "founder_background": "{company} founder CEO team background",
}

COMPANY_BRIEF_SCHEMA = {
    "company_name": "",
    "website": "",
    "ingestion_timestamp": "",
    "product_description": "",
    "funding_status": {
        "total_raised": "Unknown",
        "last_round": "Unknown",
        "investors": [],
        "valuation": "Unknown",
    },
    "market_position": {
        "market_size": "Unknown",
        "growth_rate": "Unknown",
        "market_share_estimate": "Unknown",
    },
    "competitive_landscape": [],
    "reputation_data": {
        "glassdoor_rating": None,
        "glassdoor_review_summary": "",
        "customer_rating": None,
        "customer_sentiment_summary": "",
        "top_complaints": [],
        "top_praises": [],
    },
    "recent_news_summary": "",
    "red_flags_detected": [],
    "research_sources": [],
}


async def search_tavily(
    query: str, api_key: str, max_results: int = 5
) -> dict:
    """Execute a single Tavily search query."""
    if not TAVILY_AVAILABLE:
        return {"error": "Tavily not installed", "answer": "", "results": []}
    
    try:
        client = TavilyClient(api_key=api_key)
        # Run sync client in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: client.search(
                query=query,
                search_depth="advanced",
                max_results=max_results,
                include_answer=True,
            ),
        )
        return {
            "answer": result.get("answer", ""),
            "results": result.get("results", []),
        }
    except Exception as e:
        logger.error(f"Tavily search error for '{query}': {e}")
        return {"error": str(e), "answer": "", "results": []}


def _company_slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def _load_cached_brief(company_name: str) -> Optional[dict]:
    """Load pre-cached brief by normalized company slug (backend only, never shown in UI)."""
    cache_dir = os.path.join(os.path.dirname(__file__), "demo_cache")
    slug = _company_slug(company_name)
    cache_path = os.path.join(cache_dir, f"{slug}.json")
    if os.path.isfile(cache_path):
        try:
            with open(cache_path, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load cache for {slug}: {e}")
    return None


async def ingest_company(
    company_name: str,
    website_url: str = None,
    industry: str = None,
    user_context: dict = None,
    use_cache: bool = True,
) -> AsyncGenerator[dict, None]:
    """
    Run research queries and yield progress events.
    Final event contains the synthesized CompanyBrief.
    """
    tavily_key = os.getenv("TAVILY_API_KEY")
    openrouter_key = os.getenv("OPENROUTER_API_KEY")

    industry = industry or "technology"

    # Optional demo cache (fast fallback — transparent to user)
    if use_cache:
        cached = _load_cached_brief(company_name)
        if cached:
            yield {"type": "research_start", "queries": len(RESEARCH_QUERIES), "cached": True}
            for key in RESEARCH_QUERIES:
                yield {"type": "query_done", "key": key, "found": True, "cached": True}
            yield {"type": "synthesis_start", "cached": True}
            yield {"type": "brief_ready", "brief": cached, "cached": True}
            if user_context:
                gap = await compute_reality_gap(user_context, cached, openrouter_key)
                yield {"type": "reality_gap", **gap}
            return

    if not tavily_key:
        yield {
            "type": "research_limited",
            "message": "Live research unavailable — proceeding with provided context only.",
        }
        brief = _build_fallback_brief(company_name, website_url, {})
        yield {"type": "brief_ready", "brief": brief, "limited": True}
        return

    yield {"type": "research_start", "queries": len(RESEARCH_QUERIES)}

    # Fire all searches concurrently
    raw_data = {}
    tasks = {}

    for key, template in RESEARCH_QUERIES.items():
        query = template.format(company=company_name, industry=industry)
        tasks[key] = asyncio.create_task(search_tavily(query, tavily_key))

    for key, task in tasks.items():
        try:
            result = await task
            raw_data[key] = result
            has_data = bool(result.get("answer") or result.get("results"))
            yield {
                "type": "query_done",
                "key": key,
                "found": has_data,
                "answer_preview": (result.get("answer", "")[:150] if has_data else ""),
            }
        except Exception as e:
            raw_data[key] = {"error": str(e)}
            yield {"type": "query_done", "key": key, "found": False, "error": str(e)}

    # Synthesize into CompanyBrief using Claude
    yield {"type": "synthesis_start"}

    brief = await synthesize_brief(company_name, website_url, raw_data, openrouter_key)

    yield {"type": "brief_ready", "brief": brief}

    if user_context:
        gap = await compute_reality_gap(user_context, brief, openrouter_key)
        yield {"type": "reality_gap", **gap}


async def synthesize_brief(
    company_name: str,
    website_url: str,
    raw_data: dict,
    openrouter_key: str,
) -> dict:
    """Use Claude to synthesize raw search results into structured CompanyBrief."""
    if not OPENAI_AVAILABLE or not openrouter_key:
        # Return a minimal brief from raw data
        return _build_fallback_brief(company_name, website_url, raw_data)

    try:
        client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=openrouter_key)

        # Truncate raw data to fit token limits
        truncated = {}
        for key, val in raw_data.items():
            if isinstance(val, dict):
                truncated[key] = {
                    "answer": val.get("answer", "")[:500],
                    "sources": [
                        {"title": r.get("title", ""), "content": r.get("content", "")[:300]}
                        for r in val.get("results", [])[:3]
                    ],
                }
            else:
                truncated[key] = str(val)[:500]

        synthesis_prompt = f"""You have been given raw research data about {company_name}.
Synthesize this into a structured company intelligence brief.

RAW DATA:
{json.dumps(truncated, indent=2)[:6000]}

Return ONLY valid JSON matching this schema (fill in what you can, use "Unknown" for missing data):
{{
  "company_name": "{company_name}",
  "website": "{website_url or 'Unknown'}",
  "ingestion_timestamp": "now",
  "product_description": "string",
  "funding_status": {{
    "total_raised": "string",
    "last_round": "string",
    "investors": ["string"],
    "valuation": "string"
  }},
  "market_position": {{
    "market_size": "string",
    "growth_rate": "string",
    "market_share_estimate": "string"
  }},
  "competitive_landscape": [
    {{"name": "string", "strength": "string", "weakness": "string", "funding": "string"}}
  ],
  "reputation_data": {{
    "glassdoor_rating": number_or_null,
    "glassdoor_review_summary": "string",
    "customer_rating": number_or_null,
    "customer_sentiment_summary": "string",
    "top_complaints": ["string"],
    "top_praises": ["string"]
  }},
  "recent_news_summary": "string",
  "red_flags_detected": ["string"],
  "research_sources": ["url"]
}}

Return ONLY the JSON. No markdown, no explanation."""

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model="meta-llama/llama-3.3-70b-instruct:free",
                max_tokens=2000,
                messages=[{"role": "user", "content": synthesis_prompt}],
            ),
        )

        text = response.choices[0].message.content.strip()
        # Clean up potential markdown wrapping
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

        brief = json.loads(text)
        return brief

    except Exception as e:
        logger.error(f"Synthesis error: {e}")
        return _build_fallback_brief(company_name, website_url, raw_data)


def _build_fallback_brief(
    company_name: str, website_url: str, raw_data: dict
) -> dict:
    """Build a minimal brief from raw data when Claude synthesis fails."""
    brief = dict(COMPANY_BRIEF_SCHEMA)
    brief["company_name"] = company_name
    brief["website"] = website_url or ""

    # Extract what we can
    overview = raw_data.get("company_overview", {})
    if isinstance(overview, dict):
        brief["product_description"] = overview.get("answer", "")[:500]

    news = raw_data.get("recent_news", {})
    if isinstance(news, dict):
        brief["recent_news_summary"] = news.get("answer", "")[:500]

    # Collect source URLs
    sources = []
    for key, val in raw_data.items():
        if isinstance(val, dict):
            for r in val.get("results", []):
                if r.get("url"):
                    sources.append(r["url"])
    brief["research_sources"] = sources[:10]

    return brief
