import os
from typing import Any, Dict, Optional
import json

from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")


async def call_llm(domain: str, summary: str) -> Optional[Dict[str, Any]]:
    if not OPENAI_API_KEY:
        return None

    client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    try:
        response = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "Analyze the following domain and site summary for content status, likely purpose, defensive registration likelihood, last update, and release recommendation. Return ONLY a valid JSON response with proper formatting and these exact keys: content_status, likely_purpose, defensive_registration_likelihood, last_update, release_recommendation. Ensure the JSON is properly formatted with line breaks and indentation."
                },
                {
                    "role": "user",
                    "content": f"Domain: {domain}. Summary: {summary}"
                }
            ]
        )
        
        content = response.choices[0].message.content
        return json.loads(content)
    except (ValueError, KeyError, json.JSONDecodeError) as e:
        print(f"Error parsing LLM response: {e}")
        return None
    except Exception as e:
        print(f"OpenAI API Error: {e}")
        return None