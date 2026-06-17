import re
from typing import Optional

from bs4 import BeautifulSoup


def extract_last_update(soup: BeautifulSoup, text: str) -> Optional[str]:
    date_patterns = [
        r"(last updated|updated on|updated:|updated\b).{0,40}(\d{4}-\d{2}-\d{2})",
        r"(last updated|updated on|updated:|updated\b).{0,40}(\d{1,2}/\d{1,2}/\d{2,4})",
        r"(©|copyright).{0,40}(\d{4})",
        r"(published|posted|modified|last modified).{0,40}(\d{4})",
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(2).strip()

    meta_dates = []
    for name in ["last-modified", "date", "dcterms.modified", "article:modified_time"]:
        value = soup.find("meta", attrs={"name": name}) or soup.find("meta", attrs={"property": name})
        if value and value.get("content"):
            meta_dates.append(value["content"].strip())
    return meta_dates[0] if meta_dates else None
