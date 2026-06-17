from typing import Any, Dict


def detect_content_status(response: Dict[str, Any], text: str) -> str:
    status_code = response.get("status_code")
    if status_code is None:
        return "Non-responsive"
    if status_code >= 500:
        return "Broken / Server error"
    if status_code == 404:
        return "Dead / Not found"
    if status_code in (301, 302, 307, 308):
        return "Redirect"

    lower = text.lower()
    parked_signals = ["parked domain", "this domain is parked", "buy this domain", "for sale", "domain parking"]
    placeholder_signals = ["coming soon", "under construction", "site is under construction", "placeholder"]
    inactive_signals = ["no content", "page not found", "not available"]
    if any(signal in lower for signal in parked_signals):
        return "Parked / Placeholder"
    if any(signal in lower for signal in placeholder_signals):
        return "Placeholder / Coming soon"
    if any(signal in lower for signal in inactive_signals):
        return "Inactive / Abandoned"
    return "Active / Live"
