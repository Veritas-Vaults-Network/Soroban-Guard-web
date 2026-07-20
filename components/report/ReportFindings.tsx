import type { Finding, Severity } from '@/types/findings'
import { SEVERITY_COLOR } from './ReportSummary'

interface ReportFindingsProps {
  findings: Finding[]
  sorted: Finding[]
}

export default function ReportFindings({ findings, sorted }: ReportFindingsProps) {
  return (
    <>
      <h2>Findings ({findings.length})</h2>
      {findings.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: 14 }}>No findings detected.</p>
      ) : (
        <div className="findings-list">
          {sorted.map((f, i) => (
            <div key={i} className="finding-block">
              <div className="finding-header">
                <span className="sev" style={{ background: SEVERITY_COLOR[f.severity as Severity] }}>
                  {f.severity}
                </span>
                <div className="finding-title">{f.check_name}</div>
              </div>
              <div className="finding-location">
                {f.file_path}:{f.line} — {f.function_name}
              </div>
              <div className="finding-description">{f.description}</div>
              {f.remediation && (
                <div className="finding-remediation">
                  <strong>Recommended Fix</strong>
                  {f.remediation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
