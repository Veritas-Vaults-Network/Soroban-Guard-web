'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { Finding, Severity } from '@/types/findings'
import FindingsTable from '@/components/FindingsTable'
import FindingsSkeleton from '@/components/FindingsSkeleton'
import EmptyState from '@/components/EmptyState'
import SeverityBadge from '@/components/SeverityBadge'
import SeverityDonut from '@/components/SeverityDonut'
import ThemeToggle from '@/components/ThemeToggle'
import { useToast } from '@/lib/toast'

export default function ResultsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const [findings, setFindings] = useState<Finding[] | null>(null)
  const [copied, setCopied] = useState(false)
  const [duration, setDuration] = useState<string | null>(null)
  const [navIndex, setNavIndex] = useState<number | null>(null)
  const [scanSource, setScanSource] = useState<string | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('sg_findings')
    if (!raw) {
      router.replace('/')
      return
    }
    try {
      setFindings(JSON.parse(raw) as Finding[])
      setDuration(sessionStorage.getItem('sg_duration'))
      setScanSource(sessionStorage.getItem('sg_scan_source'))
    } catch {
      router.replace('/')
    }
  }, [router])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (findings && (e.key === 'j' || e.key === 'k')) {
        e.preventDefault()
        const current = navIndex ?? -1
        let next
        if (e.key === 'j') {
          next = Math.min(current + 1, findings.length - 1)
        } else {
          next = Math.max(current - 1, 0)
        }
        setNavIndex(next)
        const element = document.querySelector(`[data-finding-index="${next}"]`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [findings, navIndex])

  function handleScanAnother() {
    sessionStorage.removeItem('sg_findings')
    router.push('/')
  }

  function handleCopyJson() {
    if (!canCopy || !findings) return
    navigator.clipboard.writeText(JSON.stringify(findings, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleCopyCli() {
    if (!scanSource) return
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const truncatedSource = scanSource.length > 200 
      ? `${scanSource.slice(0, 200)}...` 
      : scanSource
    
    const command = `curl -X POST ${apiUrl}/scan -H 'Content-Type: application/json' -d '{"source":"${scanSource.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"}'`
    
    navigator.clipboard.writeText(command)
    toast.show('CLI command copied to clipboard', 'success')
  }

  if (findings === null) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <FindingsSkeleton />
      </div>
    )
  }

  const counts: Record<Severity, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  for (const f of findings) counts[f.severity]++

  const canCopy = typeof navigator !== 'undefined' && navigator.clipboard

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            onClick={handleScanAnother}
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Soroban Guard
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleScanAnother}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Scan another contract
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-10 sm:pb-10 sm:px-6">
        {/* Summary bar */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Scan Results</h1>
            <div className="flex items-center gap-2">
              {scanSource && (
                <button
                  onClick={handleCopyCli}
                  disabled={!canCopy}
                  title="Copy CLI command"
                  className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-sm text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy CLI command
                </button>
              )}
              <button
                onClick={handleCopyJson}
                disabled={!canCopy}
                title={canCopy ? 'Copy findings as JSON' : 'Clipboard API unavailable'}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-[#1a1d27] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              {copied && (
                <div className="absolute right-0 top-full mt-2 whitespace-nowrap rounded-lg bg-green-600 px-3 py-1 text-xs text-white">
                  Copied!
                </div>
              )}
            </div>
          </div>
          <p className="mb-6 text-sm text-slate-500">
            {findings.length === 0
              ? 'No issues detected.'
              : `${findings.length} finding${findings.length !== 1 ? 's' : ''} detected across your contract.`}
            {duration && (
              <span className="ml-2 text-slate-600">Scanned in {duration}s</span>
            )}
          </p>

          <div className="flex gap-6">
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCard
                  label="Critical"
                  value={counts.Critical}
                  color="text-rose-400"
                  bg="bg-rose-500/5"
                  border="border-rose-500/20"
                />
                <SummaryCard
                  label="High"
                  value={counts.High}
                  color="text-red-400"
                  bg="bg-red-500/5"
                  border="border-red-500/20"
                />
                <SummaryCard
                  label="Medium"
                  value={counts.Medium}
                  color="text-amber-400"
                  bg="bg-amber-500/5"
                  border="border-amber-500/20"
                />
                <SummaryCard
                  label="Low"
                  value={counts.Low}
                  color="text-sky-400"
                  bg="bg-sky-500/5"
                  border="border-sky-500/20"
                />
              </div>
            </div>
            {findings.length > 0 && (
              <div className="flex-shrink-0">
                <SeverityDonut counts={counts} />
              </div>
            )}
          </div>
        </div>

        {/* Findings or empty state */}
        {findings.length === 0 ? (
          <EmptyState onScanAnother={handleScanAnother} />
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-400">
                Findings — click a row to expand details
              </h2>
              <div className="flex gap-2">
                {(['Critical', 'High', 'Medium', 'Low'] as Severity[]).map(s =>
                  counts[s] > 0 ? (
                    <SeverityBadge key={s} severity={s} size="sm" />
                  ) : null,
                )}
              </div>
            </div>
            <FindingsTable
              findings={[...findings].sort((a, b) => {
                const order: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
                return order[a.severity] - order[b.severity]
              })}
              forceExpandedIndex={navIndex}
            />
          </div>
        )}
      </main>

      {/* Mobile FAB */}
      <button
        onClick={handleScanAnother}
        aria-label="Scan another contract"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500 sm:hidden"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        New scan
      </button>

      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-slate-600">
        Soroban Guard · Veritas Vaults Network
      </footer>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  color,
  bg,
  border,
}: {
  label: string
  value: number
  color: string
  bg: string
  border?: string
}) {
  return (
    <div className={`rounded-xl border ${border || 'border-[var(--border)]'} ${bg} p-4`}>
      <p className="mb-1 text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
