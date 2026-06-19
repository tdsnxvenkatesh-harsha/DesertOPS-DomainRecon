import json
import os
from typing import Any, Dict, Optional
import json

from dotenv import load_dotenv

try:
    from openai import AsyncOpenAI
except ImportError:  # pragma: no cover - openai not installed
    AsyncOpenAI = None  # type: ignore[assignment]

load_dotenv()

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-5.5")

ENRICHED_KEYS = (
    "email_functionality",
    "last_update",
    "content_status",
    "likely_purpose",
    "defensive_registration_likelihood",
)

_client: Optional["AsyncOpenAI"] = None


def _get_client() -> Optional["AsyncOpenAI"]:
    global _client
    if not OPENAI_API_KEY or AsyncOpenAI is None:
        return None
    if _client is None:
        _client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    return _client


def _build_prompt(domain: str, summary: str, signals: Dict[str, Any]) -> str:
    signal_lines = "\n".join(f"- {key}: {value}" for key, value in signals.items())
    return (
        "You are a domain reconnaissance analyst. Using the deterministic signals as "
        "ground truth (never contradict or invent facts), rewrite each field into a concise, "
        "human-readable phrase of at most 8 words.\n\n"
        f"Domain: {domain}\n\n"
        "Deterministic signals (ground truth):\n"
        f"{signal_lines}\n\n"
        "Page text excerpt:\n"
        f"{summary}\n\n"
        "Return ONLY a JSON object (no markdown, no prose) with exactly these string keys: "
        "email_functionality, last_update, content_status, likely_purpose, "
        "defensive_registration_likelihood."
    )


def _parse_output(raw: str) -> Optional[Dict[str, Any]]:
    if not raw:
        return None

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        # Strip code fences like ```json ... ```
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
    except (ValueError, TypeError):
        return None

    if not isinstance(data, dict):
        return None

    result: Dict[str, Any] = {}
    for key in ENRICHED_KEYS:
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            result[key] = value.strip()
    return result or None


async def call_llm(
    domain: str, summary: str, signals: Optional[Dict[str, Any]] = None
) -> Optional[Dict[str, Any]]:
    client = _get_client()
    if client is None:
        return None

    prompt = _build_prompt(domain, summary, signals or {})

    try:
        response = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception:  # noqa: BLE001 - any API/network error degrades gracefully
        return None

    return _parse_output(response.choices[0].message.content)
