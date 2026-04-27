import type { Metadata } from 'next'
import type { Finding, Severity } from '@/types/findings'
import { notFound } from 'next/navigation'
import FindingsTable from '@/components/FindingsTable'
import SeverityBadge from '@/components/SeverityBadge'
import ThemeToggle from '@/components/ThemeToggle'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

async function getFindings(id: string): Promise<Finding[] | null> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/results?id=${id}`, { next: { revalidate: 0 } })
    if (!res.ok) return null
    const data = await res.json()
    return data.findings as Finding[]
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const findings = await getFindings(params.id)
  if (!findings) return { title: 'Soroban Guard — Results Not Found' }

  const counts: Record<Severity, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  for (const f of findings) counts[f.severity]++

  const description = `${findings.length} finding${findings.length !== 1 ? 's' : ''} — Critical: ${counts.Critical}, High: ${counts.High}, Medium: ${counts.Medium}, Low: ${counts.Low}`

  return {
    title: `Soroban Guard Scan — ${findings.length} findings`,
    description,
    openGraph: {
      title: `Soroban Guard Scan — ${findings.length} findings`,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `Soroban Guard Scan — ${findings.length} findings`,
      description,
    },
  }
}

export default async function PermalinkPage({ params }: Props) {
  const findings = await getFindings(params.id)
  if (!findings) notFound()

  const list = findings as Finding[]
  const counts: Record<Severity, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  for (const f of list) counts[f.severity]++

  const sorted = [...list].sort((a, b) => {
    const order: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
    return order[a.severity] - order[b.severity]
  })

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Soroban Guard
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold text-white">Scan Results</h1>
          <p className="mb-6 text-sm text-slate-500">
            {list.length === 0
              ? 'No issues detected.'
              : `${list.length} finding${list.length !== 1 ? 's' : ''} detected.`}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['Critical', 'High', 'Medium', 'Low'] as Severity[]).map(s => (
              <div key={s} className="rounded-xl border border-[var(--border)] bg-[#1a1d27] px-5 py-4">
                <p className="mb-1 text-xs text-slate-500">{s}</p>
                <p className="text-3xl font-bold text-white">{counts[s]}</p>
              </div>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No findings to display.</p>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-400">Findings</h2>
              <div className="flex gap-2">
                {(['Critical', 'High', 'Medium', 'Low'] as Severity[]).map(s =>
                  counts[s] > 0 ? <SeverityBadge key={s} severity={s} size="sm" /> : null,
                )}
              </div>
            </div>
            <FindingsTable findings={sorted} />
          </>
        )}
      </main>

      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-slate-600">
        Soroban Guard · Veritas Vaults Network
      </footer>
    </div>
  )
}
