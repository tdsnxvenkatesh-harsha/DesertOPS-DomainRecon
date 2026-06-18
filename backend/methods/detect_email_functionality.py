import re

from bs4 import BeautifulSoup


def detect_email_functionality(soup: BeautifulSoup, text: str) -> bool:
    if soup.find("a", href=re.compile(r"mailto:", re.IGNORECASE)):
        return True
    contact_keywords = ["contact", "support", "help@", "info@", "sales@", "customer service"]
    if any(kw in text.lower() for kw in contact_keywords):
        return True
    if soup.find("form") and any(field in str(soup) for field in ["email", "mail", "contact"]):
        return True
    return False
