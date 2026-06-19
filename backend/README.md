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

## OpenAI enrichment

The deterministic heuristics produce ground-truth signals, which are then sent to OpenAI to be
rewritten into concise, human-readable phrases for these fields: `email_functionality`,
`last_update`, `content_status`, `likely_purpose`, and `defensive_registration_likelihood`.

Configure via a `.env` file in `backend/` (see `.env.example`):

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.5   # optional; override if this model id is unavailable
```

If `OPENAI_API_KEY` is not set, or any API/network/parse error occurs, the service falls back to
the deterministic values automatically (no enrichment).

## Testing the OpenAI integration

There are three layers you can test, from most isolated to most end-to-end.

### Option A - Direct test of the OpenAI call (fastest, isolates the integration)

`test_openai.py` calls `call_llm` directly and makes one real OpenAI request, so you can see
exactly what the model returns. Run it from the `backend` folder:

```bash
py test_openai.py
```

Expected output:

```
Using model: gpt-5.5

Enriched fields returned by OpenAI:
  email_functionality: Yes - contact email present
  last_update: Updated March 2024
  content_status: Active, live informational site
  likely_purpose: General corporate / illustrative
  defensive_registration_likelihood: Low
```

- Five short phrases printed -> integration works.
- `call_llm returned None` -> the key is missing/wrong, the network is blocked, or the `gpt-5.5`
  model id is not available on your account. Fix by setting a valid `OPENAI_MODEL` in `.env`
  (for example `gpt-4o-mini`) and re-run.

Note: this makes a real (billable) API call each run.

### Option B - Test through the running API (`/analyze`)

Restart the backend so it loads the latest code, then send a request:

```bash
py -m uvicorn main:app --host 127.0.0.1 --port 8000
```

PowerShell:

```powershell
$body = @{ url = "https://example.com"; api_key = "supersecretkey123" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8000/analyze" -Method Post -ContentType "application/json" -Body $body
```

Look for short readable phrases in `email_functionality`, `last_update`, `content_status`,
`likely_purpose`, and `defensive_registration_likelihood`, plus `notes` = `"LLM analysis applied"`.
You can also use the Swagger UI at http://127.0.0.1:8000/docs.

### Option C - Verify the graceful fallback

Temporarily blank out `OPENAI_API_KEY` in `.env`, restart, and re-run Option A or B. You should
get the plain deterministic values and `notes: null` (no crash), confirming the no-key path.

### Frontend filtering

With the dev server running, upload an Excel file and click Start Analysis. Above the results
table, use the per-column dropdown filters (they AND together and combine with the search box),
watch the "Showing X of Y domains" count update, and use "Clear filters" to reset.

## Notes

- The service uses a hardcoded API key `supersecretkey123` for endpoint authorization.
- `release_recommendation` is always computed deterministically from the (enriched) fields.
- The `.env` file is gitignored; never commit real keys.
