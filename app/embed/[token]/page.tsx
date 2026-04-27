import type { Metadata } from 'next'
import { decodeFindings } from '@/lib/share'
import type { Finding } from '@/types/findings'

interface Props {
  params: { token: string }
}

export const metadata: Metadata = {
  title: 'Soroban Guard — Security Status',
}

function score(findings: Finding[]): number {
  if (findings.length === 0) return 100
  const weights: Record<string, number> = { Critical: 25, High: 15, Medium: 7, Low: 2 }
  const deduction = findings.reduce((sum, f) => sum + (weights[f.severity] ?? 0), 0)
  return Math.max(0, 100 - deduction)
}

export default function EmbedPage({ params }: Props) {
  const findings = decodeFindings(params.token)
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  for (const f of findings) {
    if (f.severity in counts) counts[f.severity as keyof typeof counts]++
  }
  const s = score(findings)
  const scoreColor = s >= 80 ? '#22c55e' : s >= 50 ? '#f59e0b' : '#ef4444'
  const scanDate = new Date().toLocaleDateString()

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0d0f17', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{
          width: 300,
          height: 150,
          background: 'linear-gradient(135deg, #12151f 0%, #1a1d27 100%)',
          border: '1px solid #2a2d3a',
          borderRadius: 12,
          padding: '12px 16px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, background: '#4f46e5', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600 }}>Soroban Guard</span>
            </div>
            <span style={{ color: scoreColor, fontSize: 22, fontWeight: 800 }}>{s}</span>
          </div>

          {/* Counts */}
          <div style={{ display: 'flex', gap: 6 }}>
            {(['High', 'Medium', 'Low'] as const).map(sev => {
              const colors: Record<string, string> = { High: '#ef4444', Medium: '#f59e0b', Low: '#38bdf8' }
              return (
                <div key={sev} style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 6,
                  padding: '4px 6px',
                  textAlign: 'center',
                }}>
                  <div style={{ color: colors[sev], fontSize: 14, fontWeight: 700 }}>{counts[sev]}</div>
                  <div style={{ color: '#64748b', fontSize: 9, marginTop: 1 }}>{sev}</div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#475569', fontSize: 9 }}>Scanned {scanDate}</span>
            <a
              href="https://github.com/Veritas-Vaults-Network/soroban-guard-web"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#6366f1', fontSize: 9, textDecoration: 'none' }}
            >
              Powered by Soroban Guard
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
