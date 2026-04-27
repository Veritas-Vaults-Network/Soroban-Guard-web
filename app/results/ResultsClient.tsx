'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Finding, Severity } from '@/types/findings'
import { decodeFindings, encodeWorkspace } from '@/lib/share'
import { exportEmail } from '@/lib/export'
import { getAllScanHistory } from '@/lib/history'
import { diffFindings } from '@/lib/diffFindings'
import FindingsTable from '@/components/FindingsTable'
import FindingsDiff from '@/components/FindingsDiff'
import FindingsByFunction from '@/components/FindingsByFunction'
import EmptyState from '@/components/EmptyState'
import SeverityBadge from '@/components/SeverityBadge'
import ThemeToggle from '@/components/ThemeToggle'
import { useToast } from '@/lib/toast'
import GithubExportModal from '@/components/GithubExportModal'
import NotionExportModal from '@/components/NotionExportModal'

export default function ResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { show } = useToast()
  const [findings, setFindings] = useState<Finding[] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showGithubModal, setShowGithubModal] = useState(false)
  const [prevFindings, setPrevFindings] = useState<Finding[] | null>(null)
  const [showDiff, setShowDiff] = useState(false)
  const [groupView, setGroupView] = useState<'flat' | 'function'>('flat')
  const [navIndex, setNavIndex] = useState<number | null>(null)

  useEffect(() => {
    const encoded = searchParams.get('r')
    if (encoded) {
      const decoded = decodeFindings(encoded)
      if (decoded.length > 0) {
        setFindings(decoded)
        return
      }
    }

    const raw = sessionStorage.getItem('sg_findings')
    if (!raw) {
      router.replace('/')
      return
    }
    try {
      setFindings(JSON.parse(raw) as Finding[])
    } catch {
      router.replace('/')
    }
  }, [router, searchParams])

  useEffect(() => {
    if (findings != null) {
      document.title = `${findings.length} findings — Soroban Guard`
    }
    return () => {
      document.title = 'Soroban Guard — Smart Contract Security Scanner'
    }
  }, [findings])

  useEffect(() => {
    if (findings == null) return
    const source = sessionStorage.getItem('sg_last_scan_source')
    if (!source) return
    const history = getAllScanHistory()
    // Find the most recent previous scan for the same source (contractId)
    const prev = history.find(r => r.contractId === source && r.findings.length > 0)
    if (prev) {
      setPrevFindings(prev.findings as Finding[])
    }
  }, [findings])

  function handleScanAnother() {
    sessionStorage.removeItem('sg_findings')
    router.push('/')
  }

  function handleCopyJson() {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    show('Link copied!', 'success')
  }

  async function handleRescan() {
    const source = sessionStorage.getItem('sg_scan_source')
    if (!source) {
      show('No scan source found', 'error')
      return
    }

    setIsRescanning(true)
    try {
      const data = await scanContract(source)
      setFindings(data.findings)
      sessionStorage.setItem('sg_findings', JSON.stringify(data.findings))
      show('Rescan complete!', 'success')
    } catch (error) {
      show('Rescan failed', 'error')
    } finally {
      setIsRescanning(false)
    }
  }

  function handleMuteChange() {
    setMuteRefresh(prev => prev + 1)
  }

  if (findings === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <svg className="spinner h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
        </svg>
      </div>
    )
  }

  const counts: Record<Severity, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  for (const f of findings) counts[f.severity]++

  const score = calculateScore(findings)
  const hasSource = !!sessionStorage.getItem('sg_scan_source')

  const q = searchQuery.toLowerCase()
  let filteredFindings = q
    ? findings.filter(
        f =>
          f.check_name.toLowerCase().includes(q) ||
          f.function_name.toLowerCase().includes(q) ||
          f.file_path.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q),
      )
    : findings

  // Apply muted filter
  if (!showMuted) {
    filteredFindings = filteredFindings.filter(f => !isMuted(f))
  }

  const groupedFindings = groupByFile(filteredFindings)

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
            {hasSource && (
              <button
                onClick={handleRescan}
                disabled={isRescanning}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-slate-400 transition hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRescanning ? 'Rescanning...' : 'Rescan'}
              </button>
            )}
            <a
              href={exportEmail(findings)}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-slate-400 transition hover:text-white"
            >
              Email summary
            </a>
            {findings.length > 0 && (
              <button
                onClick={() => setShowNotionModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-slate-400 transition hover:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
                </svg>
                Export to Notion
              </button>
            )}
            {findings.length > 0 && (
              <button
                onClick={() => setShowGithubModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-slate-400 transition hover:text-white"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                Create GitHub Issues
              </button>
            )}
            <button
              onClick={handleShareWorkspace}
              disabled={!canCopy}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-slate-400 transition hover:text-white disabled:opacity-40"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Share workspace
            </button>
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {/* Summary bar */}
        <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Scan Results</h1>
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
            </div>
          <p className="mb-6 text-sm text-slate-500">
            {findings.length === 0
              ? 'No issues detected.'
              : `${findings.length} finding${findings.length !== 1 ? 's' : ''} detected across your contract.`}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <SummaryCard
              label="Security Score"
              value={score}
              color={getScoreColor(score)}
              bg={getScoreBg(score)}
              border={getScoreBorder(score)}
            />
            <SummaryCard
              label="Total Findings"
              value={findings.length}
              color="text-white"
              bg="bg-[#1a1d27]"
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

        {/* Findings or empty state */}
        {findings.length === 0 ? (
          <EmptyState onScanAnother={handleScanAnother} />
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-400">
                Findings — click a row to expand details
              </h2>
              <div className="flex items-center gap-2">
                {prevFindings && (
                  <button
                    onClick={() => setShowDiff(v => !v)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      showDiff
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                        : 'border-[var(--border)] text-slate-400 hover:text-white'
                    }`}
                  >
                    {showDiff ? 'Hide diff' : 'Show diff from last scan'}
                  </button>
                )}
                {!showDiff && (
                  <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-xs font-medium">
                    <button
                      onClick={() => setGroupView('flat')}
                      className={`px-3 py-1.5 transition ${groupView === 'flat' ? 'bg-indigo-500/10 text-indigo-300' : 'text-slate-400 hover:text-white'}`}
                    >
                      Flat
                    </button>
                    <button
                      onClick={() => setGroupView('function')}
                      className={`px-3 py-1.5 border-l border-[var(--border)] transition ${groupView === 'function' ? 'bg-indigo-500/10 text-indigo-300' : 'text-slate-400 hover:text-white'}`}
                    >
                      Group by function
                    </button>
                  </div>
                )}
                {(['High', 'Medium', 'Low'] as Severity[]).map(s =>
                  counts[s] > 0 ? (
                    <SeverityBadge key={s} severity={s} size="sm" />
                  ) : null,
                )}
              </div>
            </div>

            {showDiff && prevFindings ? (
              <FindingsDiff diff={diffFindings(prevFindings, findings)} />
            ) : (
              <>
                {/* Search input */}
                <div className="relative mb-4">
                  <label htmlFor="findings-search" className="sr-only">Search findings</label>
                  <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <input
                    id="findings-search"
                    type="search"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by check, function, file, or description…"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] py-2 pl-9 pr-9 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {/* Sort: High → Medium → Low */}
                {filteredFindings.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500">No findings match your search.</p>
                ) : groupView === 'function' ? (
                  <FindingsByFunction findings={filteredFindings} />
                ) : (
                  <FindingsTable
                    findings={[...filteredFindings].sort((a, b) => {
                      const order: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
                      return order[a.severity] - order[b.severity]
                    })}
                  />
                )}
              </>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-slate-600">
        Soroban Guard · Veritas Vaults Network
      </footer>

      {showGithubModal && (
        <GithubExportModal findings={findings} onClose={() => setShowGithubModal(false)} />
      )}
      {showNotionModal && (
        <NotionExportModal findings={findings} onClose={() => setShowNotionModal(false)} />
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  color,
  bg,
  border = 'border-[var(--border)]',
}: {
  label: string
  value: number
  color: string
  bg: string
  border?: string
}) {
  return (
    <div className={`rounded-xl border ${border} ${bg} px-5 py-4`}>
      <p className="mb-1 text-xs text-slate-500">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
