"""Manual test for the OpenAI enrichment integration.

Run from the backend folder:
    py test_openai.py

Requires backend/.env to contain OPENAI_API_KEY (and optionally OPENAI_MODEL).
This makes ONE real OpenAI API call so you can see the enriched output.
"""

import asyncio

from methods.call_llm import OPENAI_MODEL, _get_client, call_llm


async def main() -> None:
    if _get_client() is None:
        print("No OpenAI client. Is OPENAI_API_KEY set in backend/.env?")
        return

    print(f"Using model: {OPENAI_MODEL}\n")

    signals = {
        "email_functionality": "Yes",
        "last_update": "2024-03-01",
        "content_status": "Active / Live",
        "likely_purpose": "General / Corporate",
        "defensive_registration_likelihood": "Low",
    }
    summary = "Example Domain. This domain is for use in illustrative examples in documents."

    result = await call_llm("example.com", summary, signals)

    if result is None:
        print("call_llm returned None (API/network/parse error or model unavailable).")
        print("If the model id is wrong, set OPENAI_MODEL in backend/.env to a valid model.")
    else:
        print("Enriched fields returned by OpenAI:")
        for key, value in result.items():
            print(f"  {key}: {value}")


if __name__ == "__main__":
    asyncio.run(main())
