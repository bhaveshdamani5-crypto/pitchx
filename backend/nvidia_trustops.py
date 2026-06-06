"""
NVIDIA TrustOps helpers for evidence ranking, guard checks, and PII redaction.
All external NVIDIA calls degrade to deterministic local fallbacks for demos.
"""

import asyncio
import json
import os
import re
import urllib.request
from datetime import datetime
from typing import Any, Optional

from openai import OpenAI


NVIDIA_BASE_URL = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
RERANK_MODEL = os.getenv("NVIDIA_RERANK_MODEL", "nvidia/llama-3.2-nv-rerankqa-1b-v2")
GUARD_MODEL = os.getenv("NVIDIA_GUARD_MODEL", "nvidia/llama-3.1-nemoguard-8b-content-safety")

EMAIL_RE = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
PHONE_RE = re.compile(r"(?<!\d)(?:\+?\d[\d\s().-]{7,}\d)(?!\d)")


def _extract_evidence(raw_data: dict) -> list[dict]:
    evidence = []
    for source_key, value in raw_data.items():
        if not isinstance(value, dict):
            continue
        for idx, result in enumerate(value.get("results", [])[:6]):
            content = (result.get("content") or result.get("title") or "").strip()
            if not content:
                continue
            evidence.append({
                "id": f"{source_key}_{idx + 1}",
                "source_key": source_key,
                "title": result.get("title", source_key.replace("_", " ").title()),
                "url": result.get("url"),
                "content": content[:700],
                "score": 0.0,
                "provider": "local_fallback",
            })
    return evidence


def _lexical_score(query: str, text: str) -> float:
    query_terms = {t for t in re.findall(r"[a-z0-9]+", query.lower()) if len(t) > 2}
    text_terms = set(re.findall(r"[a-z0-9]+", text.lower()))
    if not query_terms:
        return 0.2
    overlap = len(query_terms & text_terms) / len(query_terms)
    return round(min(0.95, 0.25 + overlap), 3)


async def rank_evidence(
    company_name: str,
    raw_data: dict,
    nvidia_key: Optional[str],
    max_items: int = 32,
) -> dict:
    """
    Rank research snippets with NVIDIA rerank when available.
    Falls back to lexical scoring while preserving the NVIDIA TrustOps UI contract.
    """
    evidence = _extract_evidence(raw_data)
    query = f"{company_name} startup audit market competitors funding reviews risks"
    if not evidence:
        return {
            "provider": "No evidence",
            "model": RERANK_MODEL,
            "ranked_count": 0,
            "evidence_pack": [],
            "generated_at": datetime.now().isoformat(),
        }

    provider = "NVIDIA fallback scorer"
    if nvidia_key:
        try:
            payload = {
                "model": RERANK_MODEL,
                "query": query,
                "passages": [item["content"] for item in evidence[:max_items]],
            }
            request = urllib.request.Request(
                f"{NVIDIA_BASE_URL}/ranking",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {nvidia_key}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )

            def send_request():
                with urllib.request.urlopen(request, timeout=12) as response:
                    return json.loads(response.read().decode("utf-8"))

            response = await asyncio.get_event_loop().run_in_executor(None, send_request)
            rankings = response.get("rankings") or response.get("data") or []
            for rank in rankings:
                index = rank.get("index", rank.get("document_index"))
                if isinstance(index, int) and index < len(evidence):
                    evidence[index]["score"] = float(rank.get("score", rank.get("relevance_score", 0.8)))
                    evidence[index]["provider"] = "nvidia_nemoretriever"
            provider = "NVIDIA NeMo Retriever"
        except Exception:
            provider = "NVIDIA fallback scorer"

    for item in evidence:
        if item["score"] <= 0:
            item["score"] = _lexical_score(query, item["content"])
            item["provider"] = provider

    ranked = sorted(evidence, key=lambda item: item["score"], reverse=True)[:max_items]
    return {
        "provider": provider,
        "model": RERANK_MODEL,
        "ranked_count": len(ranked),
        "evidence_pack": ranked,
        "generated_at": datetime.now().isoformat(),
    }


def validate_claim(claim: dict, evidence_pack: list[dict]) -> dict:
    source_key = claim.get("source_key")
    if not claim.get("verified") or not source_key:
        return {**claim, "verified": False}

    candidates = [item for item in evidence_pack if item.get("source_key") == source_key]
    if not candidates:
        return {
            **claim,
            "verified": False,
            "source_key": None,
            "source_url": None,
            "evidence_id": None,
            "evidence_score": None,
            "downgraded": True,
        }

    best = max(candidates, key=lambda item: item.get("score", 0))
    return {
        **claim,
        "verified": True,
        "source_url": best.get("url"),
        "evidence_id": best.get("id"),
        "evidence_score": best.get("score"),
    }


def redact_pii(text: str) -> tuple[str, dict]:
    emails = EMAIL_RE.findall(text or "")
    phones = PHONE_RE.findall(text or "")
    redacted = EMAIL_RE.sub("[REDACTED_EMAIL]", text or "")
    redacted = PHONE_RE.sub("[REDACTED_PHONE]", redacted)
    return redacted, {
        "pii_detected": bool(emails or phones),
        "emails": len(emails),
        "phones": len(phones),
    }


async def guard_text(
    text: str,
    nvidia_key: Optional[str],
    policy: str = "startup boardroom and HR workflow safety",
) -> dict:
    """
    Run NemoGuard content safety when available. Fallback blocks obvious high-risk text
    and reports PII redaction status.
    """
    redacted, pii = redact_pii(text)
    result = {
        "provider": "NVIDIA fallback guard",
        "model": GUARD_MODEL,
        "safe": True,
        "categories": [],
        "pii": pii,
        "redacted_text": redacted,
    }

    lowered = (text or "").lower()
    blocked_terms = ["malware", "credential theft", "drug trafficking", "violence"]
    if any(term in lowered for term in blocked_terms):
        result["safe"] = False
        result["categories"] = ["Needs Caution"]

    if not nvidia_key:
        return result

    try:
        client = OpenAI(base_url=NVIDIA_BASE_URL, api_key=nvidia_key, max_retries=2)
        prompt = f"""Task: Check if the text is safe for this policy: {policy}.
Return ONLY JSON with keys safe:boolean and categories:array.

TEXT:
{redacted[:3000]}"""
        response = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model=GUARD_MODEL,
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}],
            ),
        )
        content = response.choices[0].message.content or ""
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
            result["safe"] = bool(parsed.get("safe", result["safe"]))
            result["categories"] = parsed.get("categories", result["categories"]) or []
        elif "unsafe" in content.lower():
            result["safe"] = False
            result["categories"] = ["NemoGuard unsafe"]
        result["provider"] = "NVIDIA NemoGuard"
    except Exception:
        pass

    return result
