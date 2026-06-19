import os
from typing import Any, Dict, Optional
import json

from dotenv import load_dotenv
import httpx

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
                "content": "Analyze the following domain and site summary for content status, likely purpose, defensive registration likelihood, last update, and release recommendation. Return ONLY a valid JSON response with proper formatting and these exact keys: content_status, likely_purpose, defensive_registration_likelihood, last_update, release_recommendation. Ensure the JSON is properly formatted with line breaks and indentation."
            },
            {
                "role": "user",
                "content": f"Domain: {domain}. Summary: {summary}"
            }
        ]
    }
    headers = {"Authorization": f"Bearer {LLM_API_KEY}", "Content-Type": "application/json"} if LLM_API_KEY else {}

    try:
        # verify=False is used here to bypass SSL verification for testing purposes
        async with httpx.AsyncClient(timeout=20.0, headers=headers, verify=False) as client:
            response = await client.post(LLM_API_URL, json=payload)
            response.raise_for_status()
            try:
                response = response.json()
                content = response['choices'][0]['message']['content']
                return json.loads(content)
            except (ValueError, KeyError, json.JSONDecodeError) as e:
                print(f"Error parsing LLM response: {e}")
                print(f"Response: {response}")
                return None
    except httpx.HTTPError as e:
        print(f"HTTP Error: {e}")
        return None
