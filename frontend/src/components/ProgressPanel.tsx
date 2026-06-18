interface ProgressPanelProps {
  total: number
  processed: number
  success: number
  failed: number
  running: boolean
}

export function ProgressPanel({ total, processed, success, failed, running }: ProgressPanelProps) {
  const progress = total > 0 ? Math.round((processed / total) * 100) : 0

  return (
    <section className="panel">
      <h2>Recon Progress</h2>
      <p className="muted">{running ? 'Active sweep in progress' : 'Awaiting mission start'}</p>
      <div className="progress-track" aria-label="progress">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="grid-metrics">
        <p className="kpi">Processed: {processed}/{total}</p>
        <p className="kpi">Success: {success}</p>
        <p className="kpi">Failed: {failed}</p>
      </div>
    </section>
  )
}
