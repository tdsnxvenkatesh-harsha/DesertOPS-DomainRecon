import type { AnalyzeResponse } from '../types/domainResult'

interface AnalyzeRequest {
  url: string
  api_key: string
}

function buildEndpoint(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '')
  if (!trimmed) {
    return '/analyze'
  }

  return `${trimmed}/analyze`
}

export async function analyzeDomain(
  baseUrl: string,
  payload: AnalyzeRequest,
  signal?: AbortSignal,
): Promise<AnalyzeResponse> {
  const response = await fetch(buildEndpoint(baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Request failed (${response.status}): ${detail || response.statusText}`)
  }

  return (await response.json()) as AnalyzeResponse
}
