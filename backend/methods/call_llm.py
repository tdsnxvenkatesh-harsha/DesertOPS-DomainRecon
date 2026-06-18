import os
from typing import Any, Dict, Optional

import httpx

LLM_API_URL = os.environ.get("LLM_API_URL")
LLM_API_KEY = os.environ.get("LLM_API_KEY")


async def call_llm(domain: str, summary: str) -> Optional[Dict[str, Any]]:
    if not LLM_API_URL:
        return None

    payload = {
        "prompt": (
            "Analyze the following domain and site summary for content status, likely purpose, "
            "defensive registration likelihood, and release recommendation. Return JSON with keys: content_status, likely_purpose, defensive_registration_likelihood, release_recommendation. "
            f"Domain: {domain}. Summary: {summary}"
        )
    }
    headers = {"Authorization": f"Bearer {LLM_API_KEY}"} if LLM_API_KEY else {}

    try:
        async with httpx.AsyncClient(timeout=20.0, headers=headers) as client:
            response = await client.get(LLM_API_URL, params=payload)
            response.raise_for_status()
            try:
                return response.json()
            except ValueError:
                return None
    except httpx.HTTPError:
        return None
