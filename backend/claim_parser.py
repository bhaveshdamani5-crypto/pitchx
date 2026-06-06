"""
Parse [VERIFIED:source_key] and [ASSUMPTION] provenance tags from agent responses.
"""

import re
from typing import List


VERIFIED_PATTERN = re.compile(
    r"\[VERIFIED:([a-z_]+)\]([^\[]*)",
    re.IGNORECASE,
)
ASSUMPTION_PATTERN = re.compile(
    r"\[ASSUMPTION\]([^\[]*)",
    re.IGNORECASE,
)


def parse_claims(response: str, research_sources: list = None) -> List[dict]:
    """Extract verified and assumption claims from agent text."""
    claims = []
    sources = research_sources or []

    for match in VERIFIED_PATTERN.finditer(response):
        source_key = match.group(1).lower()
        text = match.group(2).strip()[:200]
        if text:
            claims.append({
                "verified": True,
                "source_key": source_key,
                "text": text,
                "source_url": sources[0] if sources else None,
            })

    for match in ASSUMPTION_PATTERN.finditer(response):
        text = match.group(1).strip()[:200]
        if text:
            claims.append({
                "verified": False,
                "source_key": None,
                "text": text,
                "source_url": None,
            })

    return claims


def is_memory_key_allowed(agent_name: str, key: str, agent_config: dict) -> bool:
    """Check if a memory key is within the agent's scoped memory_keys."""
    config = agent_config.get(agent_name.replace("_r2", ""))
    if not config:
        return False
    allowed = config.get("memory_keys", [])
    if key in allowed:
        return True
    return any(key.startswith(f"{a}_") or key.startswith(a) for a in allowed)