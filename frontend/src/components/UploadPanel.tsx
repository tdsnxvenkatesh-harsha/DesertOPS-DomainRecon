interface UploadPanelProps {
  totalDomains: number
  onFileChange: (file: File | null) => void
  disabled?: boolean
}

export function UploadPanel({ totalDomains, onFileChange, disabled = false }: UploadPanelProps) {
  return (
    <section className="panel">
      <h2>Mission File Intake</h2>
      <p className="muted">Select an Excel file containing domains. The first sheet is used for extraction.</p>
      <label className="upload-control">
        <input
          type="file"
          accept=".xlsx,.xls"
          disabled={disabled}
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
      </label>
      <p className="kpi">Detected Domains: {totalDomains}</p>
    </section>
  )
}
