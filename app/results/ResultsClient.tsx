'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { Finding, Severity } from '@/types/findings'
import { decodeFindings, encodeWorkspace } from '@/lib/share'
import { exportEmail } from '@/lib/export'
import { exportSarif } from '@/lib/sarif'
import { getAllScanHistory } from '@/lib/history'
import { diffFindings } from '@/lib/diffFindings'
import FindingsTable from '@/components/FindingsTable'
import FindingsDiff from '@/components/FindingsDiff'
import FindingsByFunction from '@/components/FindingsByFunction'
import FindingsWordCloud from '@/components/FindingsWordCloud'
import EmptyState from '@/components/EmptyState'
import SeverityBadge from '@/components/SeverityBadge'
import SeverityDonut from '@/components/SeverityDonut'
import FindingsSkeleton from '@/components/FindingsSkeleton'
import ThemeToggle from '@/components/ThemeToggle'
import { useToast } from '@/lib/toast'
import { useWallet } from '@/lib/WalletContext'
import GithubExportModal from '@/components/GithubExportModal'
import JiraExportModal from '@/components/JiraExportModal'
import NotionExportModal from '@/components/NotionExportModal'

export default function ResultsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { show } = useToast()
  const { publicKey: walletKey, network: walletNetwork } = useWallet()
  const [findings, setFindings] = useState<Finding[] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showGithubModal, setShowGithubModal] = useState(false)
  const [showJiraModal, setShowJiraModal] = useState(false)
  const [showNotionModal, setShowNotionModal] = useState(false)
  const [showEmbedModal, setShowEmbedModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isRescanning, setIsRescanning] = useState(false)
  const [isAttesting, setIsAttesting] = useState(false)
  const [showWordCloud, setShowWordCloud] = useState(false)
  const [duration, setDuration] = useState<string | null>(null)
  const [scanSource, setScanSource] = useState<string | null>(null)
  const [prevFindings, setPrevFindings] = useState<Finding[] | null>(null)
  const [showDiff, setShowDiff] = useState(false)
  const [groupView, setGroupView] = useState<'flat' | 'function'>('flat')
  const [navIndex, setNavIndex] = useState<number | null>(null)
  const hasSource = Boolean(scanSource)

  useEffect(() => {
    const raw = sessionStorage.getItem('sg_findings')
    if (!raw) {
      router.replace('/')
      return
    }
    try {
      setFindings(JSON.parse(raw) as Finding[])
      const rawDuration = sessionStorage.getItem('sg_scan_duration')
      if (rawDuration) {
        const ms = Number(rawDuration)
        if (!Number.isNaN(ms)) {
          setDuration((ms / 1000).toFixed(2))
        }
      }
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
    sessionStorage.removeItem('sg_scan_duration')
    router.push('/')
  }

  function handleCopyJson() {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    show('Link copied!', 'success')
  }

  function getEmbedToken(): string {
    return searchParams.get('r') ?? ''
  }

  function getEmbedSnippet(): string {
    const token = getEmbedToken()
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `<iframe src="${origin}/embed/${token}" width="300" height="150" frameborder="0" style="border-radius:12px;overflow:hidden;" title="Soroban Guard Security Status"></iframe>`
  }

  function handleCopyEmbed() {
    navigator.clipboard.writeText(getEmbedSnippet())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

  function handleCopyCli() {
    if (!scanSource) return
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const truncatedSource = scanSource.length > 200 
      ? `${scanSource.slice(0, 200)}...` 
      : scanSource
    
    const command = `curl -X POST ${apiUrl}/scan -H 'Content-Type: application/json' -d '{"source":"${scanSource.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"}'`
    
    navigator.clipboard.writeText(command)
    show('CLI command copied to clipboard', 'success')
  }

  function handleShareWorkspace() {
    if (!canCopy) return
    const url = window.location.href
    navigator.clipboard.writeText(url)
    show('Link copied!', 'success')
  }

  function handleAttest() {
    show('Attest feature is not enabled in this build.', 'info')
  }

  function handleDownloadSarif() {
    const content = exportSarif(findings ?? [])
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'soroban-guard.sarif'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
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

  const q = searchQuery.toLowerCase()
  const filteredFindings = q
    ? findings.filter(
        f =>
          f.check_name.toLowerCase().includes(q) ||
          f.function_name.toLowerCase().includes(q) ||
          f.file_path.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q),
      )
    : findings

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
            {findings !== null && findings.length === 0 && walletKey && (
              <button
                onClick={handleAttest}
                disabled={isAttesting}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAttesting ? (
                  <svg className="spinner h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )}
                Attest on Stellar
              </button>
            )}
            <a
              href={exportEmail(findings)}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-slate-400 transition hover:text-white"
            >
              Email summary
            </a>
            <button
              onClick={handleDownloadSarif}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-slate-400 transition hover:text-white"
            >
              Download SARIF
            </button>
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
            {findings.some(finding => finding.severity === 'Critical' || finding.severity === 'High') && (
              <button
                onClick={() => setShowJiraModal(true)}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-slate-400 transition hover:text-white"
              >
                Export to Jira
              </button>
            )}
            {getEmbedToken() && (
              <button
                onClick={() => setShowEmbedModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-slate-400 transition hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Get embed code
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
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
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
                {duration && (
                  <SummaryCard
                    label="Scan Time"
                    value={duration}
                    color="text-indigo-400"
                    bg="bg-indigo-500/5"
                    border="border-indigo-500/20"
                  />
                )}
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
            {/* Word cloud collapsible panel */}
            <div className="mb-6">
              <button
                onClick={() => setShowWordCloud(v => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-[var(--bg-hover)]"
                aria-expanded={showWordCloud}
              >
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Vulnerability themes
                </span>
                <svg
                  className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${showWordCloud ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showWordCloud && (
                <div className="mt-2">
                  <FindingsWordCloud
                    findings={findings}
                    onTermClick={term => setSearchQuery(term)}
                  />
                </div>
              )}
            </div>

            <div className="mb-3 flex items-center justify-between">              <h2 className="text-sm font-semibold text-slate-400">
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
                    searchQuery={searchQuery}
                  />
                )}
              </>
            )}
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

      {showGithubModal && (
        <GithubExportModal findings={findings} onClose={() => setShowGithubModal(false)} />
      )}
      {showJiraModal && (
        <JiraExportModal findings={findings} onClose={() => setShowJiraModal(false)} />
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
  border,
}: {
  label: string
  value: number | string
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
