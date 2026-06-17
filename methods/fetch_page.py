from typing import Any, Dict

import httpx

USER_AGENT = "DomainReconBot/1.0 (+https://example.com)"


async def fetch_page(url: str) -> Dict[str, Any]:
    timeout = httpx.Timeout(20.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout, headers={"User-Agent": USER_AGENT}) as client:
        try:
            response = await client.get(url, follow_redirects=False)
        except httpx.RequestError as exc:
            return {"error": str(exc), "status_code": None}

        result: Dict[str, Any] = {
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "url": str(response.url),
            "is_redirect": response.is_redirect or response.is_permanent_redirect,
            "redirect_location": response.headers.get("location"),
            "content_type": response.headers.get("content-type", ""),
            "text": response.text,
        }
        return result
