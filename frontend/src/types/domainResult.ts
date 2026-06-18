export interface AnalyzeResponse {
  domain: string
  website_behind_url: string
  redirect: string
  page_opens_renders: string
  email_functionality: string
  last_update: string | null
  content_status: string
  likely_purpose: string
  defensive_registration_likelihood: string
  release_recommendation: string
  notes?: string | null
}

export interface DomainResult extends AnalyzeResponse {
  source_input: string
  error?: string
}
