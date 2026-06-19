from typing import Any, Dict

import httpx

USER_AGENT = "DomainReconBot/1.0 (+https://example.com)"


def _build_candidates(url: str) -> list[str]:
    if not url.startswith(("http://", "https://")):
        return [f"https://{url}", f"http://{url}"]
    if url.startswith("http://"):
        return [url, url.replace("http://", "https://", 1)]
    return [url]


async def _attempt(client: httpx.AsyncClient, candidate: str) -> Dict[str, Any]:
    response = await client.get(candidate, follow_redirects=True)
    return {
        "status_code": response.status_code,
        "headers": dict(response.headers),
        "url": str(response.url),
        "is_redirect": len(response.history) > 0,
        "redirect_location": str(response.url) if len(response.history) > 0 else None,
        "content_type": response.headers.get("content-type", ""),
        "text": response.text,
    }


async def fetch_page(url: str) -> Dict[str, Any]:
    timeout = httpx.Timeout(20.0, connect=10.0)
    headers = {"User-Agent": USER_AGENT}
    candidates = _build_candidates(url)

    last_error = None
    # First pass verifies TLS certificates; second pass disables verification so
    # that hosts behind corporate SSL inspection / self-signed certs are still reachable.
    for verify in (True, False):
        async with httpx.AsyncClient(timeout=timeout, headers=headers, verify=verify) as client:
            ssl_failure = False
            for candidate in candidates:
                try:
                    return await _attempt(client, candidate)
                except httpx.RequestError as exc:
                    last_error = str(exc)
                    if "certificate" in last_error.lower() or "ssl" in last_error.lower():
                        ssl_failure = True
            if not ssl_failure:
                # No certificate-related error, so retrying without verification won't help.
                break

    return {"error": last_error or "Request failed", "status_code": None}

