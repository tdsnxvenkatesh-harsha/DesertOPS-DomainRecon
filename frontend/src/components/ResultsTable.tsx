import type { DomainResult } from '../types/domainResult'

interface ResultsTableProps {
  rows: DomainResult[]
  search: string
  onSearch: (value: string) => void
}

export function ResultsTable({ rows, search, onSearch }: ResultsTableProps) {
  const filtered = rows.filter((row) => {
    const haystack = `${row.domain} ${row.content_status} ${row.likely_purpose} ${row.release_recommendation}`.toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

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
