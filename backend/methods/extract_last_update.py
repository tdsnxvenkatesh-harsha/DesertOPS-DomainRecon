import re
from typing import Any, Dict, Optional

from bs4 import BeautifulSoup


def extract_last_update(
    soup: BeautifulSoup,
    text: str,
    headers: Optional[Dict[str, Any]] = None,
) -> Optional[str]:
    content_patterns = [
        r"(?:last updated|updated on|updated:|updated)\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})",
        r"(?:last updated|updated on|updated:|updated)\s*[:\-]?\s*(\d{1,2}/\d{1,2}/\d{2,4})",
        r"(?:published|posted|modified|last modified)\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})",
        r"(?:published|posted|modified|last modified).{0,40}(\d{4})",
        r"(?:©|copyright)\s*\d{4}\s*[\-–]\s*(\d{4})",
        r"(?:©|copyright).{0,20}(\d{4})",
    ]
    for pattern in content_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()

    for name in ["last-modified", "date", "dcterms.modified", "article:modified_time", "og:updated_time"]:
        value = soup.find("meta", attrs={"name": name}) or soup.find("meta", attrs={"property": name})
        if value and value.get("content"):
            return value["content"].strip()

    if soup.find("time"):
        time_tag = soup.find("time")
        if time_tag.get("datetime"):
            return time_tag["datetime"].strip()
        if time_tag.get_text(strip=True):
            return time_tag.get_text(strip=True)

    if headers:
        normalized = {str(key).lower(): value for key, value in headers.items()}
        last_modified = normalized.get("last-modified")
        if last_modified:
            return str(last_modified).strip()

    return None
