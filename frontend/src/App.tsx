import { useMemo, useRef, useState } from 'react'
import { ProgressPanel } from './components/ProgressPanel'
import { RadarLoadingScreen } from './components/RadarLoadingScreen'
import { ResultsTable } from './components/ResultsTable'
import { UploadPanel } from './components/UploadPanel'
import { analyzeDomain } from './services/analyzeApi'
import type { DomainResult } from './types/domainResult'
import { exportResultsToWorkbook, parseExcelDomains } from './utils/excelParser'

const DEFAULT_BACKEND_URL = '/api'
const DEFAULT_API_KEY = 'supersecretkey123'
const CONCURRENCY = 4

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function App() {
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL)
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY)
  const [domains, setDomains] = useState<string[]>([])
  const [results, setResults] = useState<DomainResult[]>([])
  const [processed, setProcessed] = useState(0)
  const [success, setSuccess] = useState(0)
  const [failed, setFailed] = useState(0)
  const [running, setRunning] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const cancelRef = useRef(false)

  const hasResults = results.length > 0
  const canRun = domains.length > 0 && !running

  const summaryText = useMemo(() => {
    if (!domains.length) {
      return 'Load an Excel file to begin reconnaissance.'
    }

    return `${domains.length} domains staged for analysis.`
  }, [domains.length])

  async function handleFileChange(file: File | null) {
    setError(null)
    setResults([])
    setProcessed(0)
    setSuccess(0)
    setFailed(0)

    if (!file) {
      setDomains([])
      return
    }

    try {
      const parsed = await parseExcelDomains(file)
      setDomains(parsed)
      if (!parsed.length) {
        setError('No valid domain values were found in this workbook.')
      }
    } catch (parseError) {
      setDomains([])
      setError(parseError instanceof Error ? parseError.message : 'Failed to parse the file.')
    }
  }

  function makeFallbackResult(inputDomain: string, err: string): DomainResult {
    return {
      source_input: inputDomain,
      domain: inputDomain,
      website_behind_url: 'Unknown',
      redirect: 'Unknown',
      page_opens_renders: 'Unknown',
      email_functionality: 'Unknown',
      last_update: 'Not retrieved (request failed)',
      content_status: 'Unknown',
      likely_purpose: 'Unknown',
      defensive_registration_likelihood: 'Unknown',
      release_recommendation: 'Needs manual review',
      notes: null,
      error: err,
    }
  }

  async function runSingleDomain(inputDomain: string): Promise<DomainResult> {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const data = await analyzeDomain(backendUrl, { url: inputDomain, api_key: apiKey })
        return {
          ...data,
          source_input: inputDomain,
        }
      } catch (requestError) {
        if (attempt === 2) {
          const message = requestError instanceof Error ? requestError.message : 'Unknown request failure'
          return makeFallbackResult(inputDomain, message)
        }
        await wait(350 * attempt)
      }
    }

    return makeFallbackResult(inputDomain, 'Unexpected failure')
  }

  async function handleRun() {
    if (!canRun) {
      return
    }

    setError(null)
    setResults([])
    setProcessed(0)
    setSuccess(0)
    setFailed(0)
    setRunning(true)
    cancelRef.current = false

    const queue = [...domains]
    const collected: DomainResult[] = []

    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (!cancelRef.current && queue.length > 0) {
        const next = queue.shift()
        if (!next) {
          return
        }

        const row = await runSingleDomain(next)
        collected.push(row)
        setResults([...collected])
        setProcessed((value) => value + 1)
        if (row.error) {
          setFailed((value) => value + 1)
        } else {
          setSuccess((value) => value + 1)
        }
      }
    })

    await Promise.all(workers)
    setRunning(false)

    if (cancelRef.current) {
      setError('Run cancelled. Partial results are shown.')
    }
  }

  function handleCancel() {
    cancelRef.current = true
    setRunning(false)
  }

  function handleReset() {
    cancelRef.current = true
    setDomains([])
    setResults([])
    setProcessed(0)
    setSuccess(0)
    setFailed(0)
    setError(null)
    setRunning(false)
    setSearch('')
  }

  function handleExport() {
    if (!results.length) {
      return
    }

    const output = exportResultsToWorkbook(results)
    const blob = new Blob([output], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `domain_inventory_${new Date().toISOString().slice(0, 10)}.xlsx`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="app-shell">
      {running ? <RadarLoadingScreen processed={processed} total={domains.length} /> : null}

      <header className="header">
        <h1>Global Domain Recon Command</h1>
        <p className="muted">{summaryText}</p>
      </header>

      <section className="panel controls">
        <div className="field">
          <label htmlFor="backend-url">Backend URL</label>
          <input
            id="backend-url"
            value={backendUrl}
            onChange={(event) => setBackendUrl(event.target.value)}
            placeholder="/api (recommended for local dev)"
            disabled={running}
          />
        </div>

        <div className="field">
          <label htmlFor="api-key">API Key</label>
          <input
            id="api-key"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Enter API key"
            disabled={running}
          />
        </div>

        <div className="button-group">
          <button className="btn-primary" onClick={handleRun} disabled={!canRun}>
            Start Analysis
          </button>
          <button onClick={handleCancel} disabled={!running}>
            Cancel
          </button>
          <button onClick={handleReset} disabled={running && !hasResults}>
            Reset
          </button>
          <button onClick={handleExport} disabled={!hasResults}>
            Export Results
          </button>
        </div>
      </section>

      {error ? <p className="alert">{error}</p> : null}

      <section className="layout-grid">
        <UploadPanel totalDomains={domains.length} onFileChange={handleFileChange} disabled={running} />
        <ProgressPanel
          total={domains.length}
          processed={processed}
          success={success}
          failed={failed}
          running={running}
        />
      </section>

      <ResultsTable rows={results} search={search} onSearch={setSearch} />
    </main>
  )
}

export default App
