# DomainRecon FastAPI

A simple FastAPI service to analyze a domain / URL for availability, redirects, page rendering, email/contact signals, content status, and likely purpose.

## Installation

1. Create a Python environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
go to http://localhost:8000/docs

## API

POST `/analyze`

Request body:

```json
{
  "url": "https://example.com",
  "api_key": "Please request the API key from the Gilbert team"
}
```

Example response:

```json
{
  "domain": "example.com",
  "website_behind_url": "Yes",
  "redirect": "No",
  "page_opens_renders": "Yes",
  "email_functionality": "No",
  "last_update": null,
  "content_status": "Active / Live",
  "likely_purpose": "General / Unknown",
  "defensive_registration_likelihood": "Low",
  "release_recommendation": "Review with business owner",
  "notes": null
}
```

## Notes

- An LLM is always called to enhance analysis. Set `LLM_API_URL` and `LLM_API_KEY` environment variables to configure your LLM endpoint.
- The heuristic-based analysis is enriched by LLM responses for content status, likely purpose, defensive registration likelihood, and release recommendations.
