from typing import Optional

from pydantic import BaseModel


class AnalyzeResponse(BaseModel):
    domain: str
    website_behind_url: str
    redirect: str
    page_opens_renders: str
    email_functionality: str
    last_update: Optional[str]
    content_status: str
    likely_purpose: str
    defensive_registration_likelihood: str
    release_recommendation: str
    notes: Optional[str] = None
