'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Finding, Severity } from '@/types/findings'

const SEVERITY_ORDER: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4,
}
const SEVERITY_COLOR: Record<Severity, string> = {
  Critical: '#f43f5e',
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#38bdf8',
  Info: '#94a3b8',
}

export default function ReportPage() {
  const searchParams = useSearchParams()
  const [findings, setFindings] = useState<Finding[]>([])
  const [source, setSource] = useState('')
  const [scannedAt, setScannedAt] = useState('')
  const [score, setScore] = useState(100)

  useEffect(() => {
    try {
      const f = searchParams.get('f')
      if (f) setFindings(JSON.parse(atob(f)) as Finding[])
      setSource(searchParams.get('source') ?? 'Unknown')
      setScannedAt(searchParams.get('scannedAt') ?? new Date().toISOString())
      setScore(Number(searchParams.get('score') ?? 100))
    } catch {
      // ignore parse errors
    }
  }, [searchParams])

  useEffect(() => {
    if (findings.length >= 0 && source) {
      setTimeout(() => window.print(), 400)
    }
  }, [findings, source])

  const counts: Record<Severity, number> = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0,
}
  for (const f of findings) counts[f.severity as Severity]++

  const sorted = [...findings].sort((a, b) => SEVERITY_ORDER[a.severity as Severity] - SEVERITY_ORDER[b.severity as Severity])

  const date = scannedAt ? new Date(scannedAt).toLocaleString() : ''

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 20mm; }
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body { font-family: system-ui, sans-serif; background: #fff; color: #111; margin: 0; }
        .page { max-width: 900px; margin: 0 auto; padding: 40px 32px; }
        .cover { border-bottom: 2px solid #e5e7eb; padding-bottom: 32px; margin-bottom: 32px; }
        .cover h1 { font-size: 28px; font-weight: 700; margin: 0 0 8px; }
        .cover p { color: #6b7280; margin: 4px 0; font-size: 14px; }
        .score-badge { display: inline-block; padding: 4px 14px; border-radius: 999px; font-weight: 700; font-size: 18px; margin-top: 12px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
        .summary-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
        .summary-card .label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
        .summary-card .value { font-size: 28px; font-weight: 700; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #f9fafb; text-align: left; padding: 8px 12px; border-bottom: 2px solid #e5e7eb; font-weight: 600; }
        td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
        tr:nth-child(even) td { background: #fafafa; }
        .sev { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; color: #fff; }
        h2 { font-size: 18px; font-weight: 600; margin: 0 0 16px; }
      `}</style>

      <div className="page">
        {/* Cover */}
        <div className="cover">
          <h1>Soroban Guard — Security Report</h1>
          <p>Contract: {source}</p>
          <p>Scanned: {date}</p>
          <div
            className="score-badge"
            style={{ background: score >= 80 ? '#dcfce7' : score >= 50 ? '#fef9c3' : '#fee2e2', color: score >= 80 ? '#166534' : score >= 50 ? '#854d0e' : '#991b1b' }}
          >
            Security Score: {score}
          </div>
        </div>

        {/* Summary */}
        <h2>Summary</h2>
        <div className="summary">
          {(['Critical', 'High', 'Medium', 'Low'] as Severity[]).map(s => (
            <div key={s} className="summary-card">
              <div className="label">{s}</div>
              <div className="value" style={{ color: SEVERITY_COLOR[s] }}>{counts[s]}</div>
            </div>
          ))}
        </div>

        {/* Findings table */}
        <h2>Findings ({findings.length})</h2>
        {findings.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: 14 }}>No findings detected.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Check</th>
                <th>Function</th>
                <th>File</th>
                <th>Line</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f, i) => (
                <tr key={i}>
                  <td>
                    <span className="sev" style={{ background: SEVERITY_COLOR[f.severity as Severity] }}>
                      {f.severity}
                    </span>
                  </td>
                  <td>{f.check_name}</td>
                  <td>{f.function_name}</td>
                  <td style={{ wordBreak: 'break-all' }}>{f.file_path}</td>
                  <td>{f.line}</td>
                  <td>{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p style={{ marginTop: 40, fontSize: 12, color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
          Generated by Soroban Guard · Veritas Vaults Network
        </p>
      </div>
    </>
  )
}
