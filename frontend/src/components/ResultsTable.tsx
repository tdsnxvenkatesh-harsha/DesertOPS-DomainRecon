import { useMemo, useState } from 'react'
import type { DomainResult } from '../types/domainResult'

interface ResultsTableProps {
  rows: DomainResult[]
  search: string
  onSearch: (value: string) => void
}

type FilterKey =
  | 'website_behind_url'
  | 'redirect'
  | 'page_opens_renders'
  | 'email_functionality'
  | 'content_status'
  | 'likely_purpose'
  | 'defensive_registration_likelihood'
  | 'release_recommendation'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'website_behind_url', label: 'Website behind URL?' },
  { key: 'redirect', label: 'Redirect?' },
  { key: 'page_opens_renders', label: 'Page opens / renders?' },
  { key: 'email_functionality', label: 'Email functionality?' },
  { key: 'content_status', label: 'Content status' },
  { key: 'likely_purpose', label: 'Likely purpose' },
  { key: 'defensive_registration_likelihood', label: 'Defensive-registration likelihood' },
  { key: 'release_recommendation', label: 'Release recommendation' },
]

const ALL = '__all__'

type FilterState = Record<FilterKey, string>

function emptyFilters(): FilterState {
  return FILTERS.reduce((acc, { key }) => {
    acc[key] = ALL
    return acc
  }, {} as FilterState)
}

export function ResultsTable({ rows, search, onSearch }: ResultsTableProps) {
  const [filters, setFilters] = useState<FilterState>(emptyFilters)

  const optionsByKey = useMemo(() => {
    const map = {} as Record<FilterKey, string[]>
    for (const { key } of FILTERS) {
      const unique = new Set<string>()
      for (const row of rows) {
        const value = row[key]
        if (value) {
          unique.add(value)
        }
      }
      map[key] = Array.from(unique).sort((a, b) => a.localeCompare(b))
    }
    return map
  }, [rows])

  const hasActiveFilters = FILTERS.some(({ key }) => filters[key] !== ALL)

  const filtered = useMemo(() => {
    const needle = search.toLowerCase()
    return rows.filter((row) => {
      const haystack =
        `${row.domain} ${row.content_status} ${row.likely_purpose} ${row.release_recommendation}`.toLowerCase()
      if (!haystack.includes(needle)) {
        return false
      }
      return FILTERS.every(({ key }) => filters[key] === ALL || row[key] === filters[key])
    })
  }, [rows, search, filters])

  function setFilter(key: FilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function clearFilters() {
    setFilters(emptyFilters())
  }

  return (
    <section className="panel">
      <div className="row-between">
        <h2>Domain Findings</h2>
        <input
          className="search-input"
          placeholder="Filter results..."
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
      </div>

      <div className="filter-bar">
        {FILTERS.map(({ key, label }) => (
          <label key={key} className="filter-control">
            <span>{label}</span>
            <select value={filters[key]} onChange={(event) => setFilter(key, event.target.value)}>
              <option value={ALL}>All</option>
              {optionsByKey[key].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button
          type="button"
          className="filter-clear"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
        >
          Clear filters
        </button>
      </div>

      <p className="filter-count muted">
        Showing {filtered.length} of {rows.length} domains
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Domain</th>
              <th>Website behind URL?</th>
              <th>Redirect?</th>
              <th>Page opens / renders?</th>
              <th>Email functionality?</th>
              <th>Date of last update found</th>
              <th>Content status</th>
              <th>Likely purpose</th>
              <th>Fraud-prevention / defensive-registration likelihood</th>
              <th>Release recommendation</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={`${row.source_input}-${row.domain}`}>
                <td>{row.domain || row.source_input}</td>
                <td>{row.website_behind_url}</td>
                <td>{row.redirect}</td>
                <td>{row.page_opens_renders}</td>
                <td>{row.email_functionality}</td>
                <td>{row.last_update || 'Unknown'}</td>
                <td>{row.content_status}</td>
                <td>{row.likely_purpose}</td>
                <td>{row.defensive_registration_likelihood}</td>
                <td>{row.release_recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
