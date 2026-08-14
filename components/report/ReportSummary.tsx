import type { Severity } from '@/types/findings'

export const SEVERITY_COLOR: Record<Severity, string> = {
  Critical: '#f43f5e',
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#38bdf8',
  Info: '#94a3b8',
}

interface ReportSummaryProps {
  counts: Record<Severity, number>
}

const SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low', 'Info']

export default function ReportSummary({ counts }: ReportSummaryProps) {
  return (
    <>
      <h2>Summary</h2>
      <div className="summary">
        {SEVERITIES.map(s => (
          <div key={s} className="summary-card">
            <div className="label">{s}</div>
            <div className="value" style={{ color: SEVERITY_COLOR[s] }}>{counts[s]}</div>
          </div>
        ))}
      </div>
    </>
  )
}
