from typing import Any, Dict

import httpx

USER_AGENT = "DomainReconBot/1.0 (+https://example.com)"


async def fetch_page(url: str) -> Dict[str, Any]:
    timeout = httpx.Timeout(20.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout, headers={"User-Agent": USER_AGENT}) as client:
        candidates = [url]
        if not url.startswith(("http://", "https://")):
            candidates = [f"https://{url}", f"http://{url}"]
        elif url.startswith("http://"):
            candidates = [url, url.replace("http://", "https://", 1)]

        last_error = None
        for candidate in candidates:
            try:
                response = await client.get(candidate, follow_redirects=True)
                result: Dict[str, Any] = {
                    "status_code": response.status_code,
                    "headers": dict(response.headers),
                    "url": str(response.url),
                    "is_redirect": len(response.history) > 0,
                    "redirect_location": str(response.url) if len(response.history) > 0 else None,
                    "content_type": response.headers.get("content-type", ""),
                    "text": response.text,
                }
                return result
            except httpx.RequestError as exc:
                last_error = str(exc)

        return {"error": last_error or "Request failed", "status_code": None}
