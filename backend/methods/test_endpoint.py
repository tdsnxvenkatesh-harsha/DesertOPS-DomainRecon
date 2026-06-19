import os
from typing import Any, Dict, Optional

from dotenv import load_dotenv
import httpx
import asyncio
import json
load_dotenv()

LLM_API_URL = os.environ.get("LLM_API_URL")
LLM_API_KEY = os.environ.get("LLM_API_KEY")

async def call_llm(domain: str, summary: str) -> Optional[Dict[str, Any]]:
    if not LLM_API_URL:
        return None

    payload = {
        #nvidia/nemotron-3-ultra-550b-a55b:free
        #nex-agi/nex-n2-pro:free
        "model": "nex-agi/nex-n2-pro:free",
        "messages": [
            {
                "role": "system",
                "content": "Analyze the following domain and site summary for content status, likely purpose, defensive registration likelihood, and release recommendation. Only return a valid JSON response with keys: content_status, likely_purpose, defensive_registration_likelihood, release_recommendation."
            },
            {
                "role": "user",
                "content": f"Domain: {domain}. Summary: {summary}"
            }
        ]
    }
    headers = {"Authorization": f"Bearer {LLM_API_KEY}", "Content-Type": "application/json"} if LLM_API_KEY else {}

    try:
        # Note: verify=False is used here to bypass SSL verification for testing purposes. In production, you should handle SSL properly.
        async with httpx.AsyncClient(timeout=20.0, headers=headers, verify=False) as client:
            response = await client.post(LLM_API_URL, json=payload)
            response.raise_for_status()
            try:
                response = response.json()
                content = response['choices'][0]['message']['content']
                return json.loads(content)
            except ValueError:
                return None
    except httpx.HTTPError as e:
        print(f"Error: {e}")
        return e
print(asyncio.run(call_llm("example.com", "This is a test summary for example.com")))


"""
test

headers = {"Authorization": f"Bearer {LLM_API_KEY}"} if LLM_API_KEY else {}

async def test():
    payload = {
        "model": "openai/gpt-4o",
        "messages": [
            {
                "role": "user",
                "content": "What is the meaning of life?"
            }
        ]
    }
    try:
        async with httpx.AsyncClient(timeout=20.0, headers=headers, verify=False) as client:
            response = await client.get("https://openrouter.ai/api/v1/key")
            response.raise_for_status()
            try:
                return response.json()
            except ValueError:
                return None
    except httpx.HTTPError as e:
        print(f"Error: {e}")
        return None

print(asyncio.run(test()))
"""