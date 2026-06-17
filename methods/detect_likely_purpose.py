def detect_likely_purpose(domain: str, text: str) -> str:
    lower = text.lower()
    if any(kw in domain for kw in ["support", "help", "customer", "service"]):
        return "Support / Customer service"
    if any(kw in domain for kw in ["promo", "campaign", "offer", "sale"]):
        return "Campaign / Marketing"
    if any(kw in domain for kw in ["partner", "vendor", "reseller"]):
        return "Partner / Vendor"
    if any(kw in domain for kw in ["blog", "news", "press"]):
        return "Content / News"
    if any(kw in lower for kw in ["login", "signin", "sign in", "portal"]):
        return "Portal / Login"
    if any(kw in lower for kw in ["download", "docs", "documentation"]):
        return "Documentation / Downloads"
    if any(kw in lower for kw in ["careers", "jobs"]):
        return "Recruiting / Careers"
    if any(kw in lower for kw in ["archive", "old", "legacy"]):
        return "Legacy / Archived content"
    if any(kw in lower for kw in ["mail", "email", "contact"]):
        return "Contact / Email"
    return "General / Unknown"
