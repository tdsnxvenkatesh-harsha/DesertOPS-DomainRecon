import os
from typing import Any, Dict

from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException

from classes import AnalyzeRequest, AnalyzeResponse
from methods import (
    call_llm,
    detect_content_status,
    detect_defensive_registration,
    detect_email_functionality,
    detect_likely_purpose,
    detect_release_recommendation,
    extract_last_update,
    fetch_page,
)

app = FastAPI(title="Domain Recon Analyzer")

SERVICE_API_KEY = "gilbert-az-desertops-110f"

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    if request.api_key != SERVICE_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

    original_url = request.url
    normalized_url = original_url.strip()
    domain = original_url
    page_data = await fetch_page(normalized_url)

    if page_data.get("error"):
        return AnalyzeResponse(
            domain=domain,
            website_behind_url="No",
            redirect="No",
            page_opens_renders="No",
            email_functionality="No",
            last_update="Not applicable (unreachable)",
            content_status="Non-responsive",
            likely_purpose="Unknown",
            defensive_registration_likelihood=detect_defensive_registration(domain, ""),
            release_recommendation="Release / Decommission",
            notes=page_data["error"],
        )

    text = page_data.get("text", "")
    content_type = page_data.get("content_type", "")
    is_html = "html" in content_type.lower() or text.strip().startswith("<")
    soup = BeautifulSoup(text, "lxml") if is_html else BeautifulSoup("", "lxml")

    website_behind_url = "Yes" if page_data.get("status_code") and page_data["status_code"] < 400 and is_html else "No"
    redirect = "Yes" if page_data.get("is_redirect") else "No"
    page_opens_renders = "Yes" if page_data.get("status_code") and 200 <= page_data["status_code"] < 400 else "No"
    email_functionality = "Yes" if detect_email_functionality(soup, text) else "No"
    last_update = extract_last_update(soup, text, page_data.get("headers")) or "Not reported on page"
    content_status = detect_content_status(page_data, text)
    likely_purpose = detect_likely_purpose(domain, text)
    defensive_registration_likelihood = detect_defensive_registration(domain, text)
    release_recommendation = detect_release_recommendation(content_status, likely_purpose, email_functionality == "Yes", last_update)
    
    llm_result = await call_llm(domain, text[:3000])
    if llm_result:
        content_status = llm_result.get("content_status", content_status)
        likely_purpose = llm_result.get("likely_purpose", likely_purpose)
        defensive_registration_likelihood = llm_result.get(
            "defensive_registration_likelihood", defensive_registration_likelihood
        )
        last_update = llm_result.get("last_update", last_update)
        release_recommendation = llm_result.get("release_recommendation", release_recommendation)
    
    notes = "LLM analysis applied" if llm_result else None
    
    return AnalyzeResponse(
        domain=domain,
        website_behind_url=website_behind_url,
        redirect=redirect,
        page_opens_renders=page_opens_renders,
        email_functionality=email_functionality,
        last_update=last_update,
        content_status=content_status,
        likely_purpose=likely_purpose,
        defensive_registration_likelihood=defensive_registration_likelihood,
        release_recommendation=release_recommendation,
        notes=notes,
    )