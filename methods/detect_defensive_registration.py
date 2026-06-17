import re

BRAND_KEYWORDS = ["td", "techdata", "synnex", "tech data", "tdsynnex", "synnexcorp"]


def detect_defensive_registration(domain: str, text: str) -> str:
    lowered = domain.lower()
    if any(keyword in lowered for keyword in BRAND_KEYWORDS):
        if any(kw in lowered for kw in ["support", "service", "portal", "login"]):
            return "Possible defensive / Brand protection"
        if any(kw in lowered for kw in ["promo", "deal", "offer"]):
            return "Possible campaign / Brand-related"
        if re.search(r"\b(td|techdata|synnex)\b", lowered):
            if re.search(r"[^a-z0-9](td|techdata|synnex)[^a-z0-9]", lowered) or lowered.count(".") > 1:
                return "Likely defensive registration"
    return "Low"
