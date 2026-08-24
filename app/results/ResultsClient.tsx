'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Finding, Severity, MultiNetworkResults } from '@/types/findings'
import NetworkBadge from '@/components/NetworkBadge'
import EmptyState from '@/components/EmptyState'
import SeverityBadge from '@/components/SeverityBadge'
import ThemeToggle from '@/components/ThemeToggle'
import FindingsFilterBar from '@/components/FindingsFilterBar'
import FindingsTable from '@/components/FindingsTable'
import FindingsDiff from '@/components/FindingsDiff'
import FindingsByFile from '@/components/FindingsByFile'
import FindingsByFunction from '@/components/FindingsByFunction'
import FindingsSkeleton from '@/components/FindingsSkeleton'
import { decodeFindingsParam } from '@/lib/share'
import { getAllScanHistory } from '@/lib/history'
import { diffFindings } from '@/lib/diffFindings'
import { filterFindings, type FilterState } from '@/lib/filterFindings'
import { groupByFile } from '@/lib/groupFindings'
import { calculateScore, getScoreColor } from '@/lib/score'
import { scanContract } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { NETWORKS } from '@/types/stellar'
import ExportModal from '@/components/ExportModal'

const ALL_SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low', 'Info']

type GroupView = 'flat' | 'function' | 'file'

export default function ResultsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { show } = useToast()

  const [findings, setFindings] = useState<Finding[] | null>(null)
  const [prevFindings, setPrevFindings] = useState<Finding[] | null>(null)
  const [multiNetworkResults, setMultiNetworkResults] = useState<MultiNetworkResults | null>(null)
  const [activeNetwork, setActiveNetwork] = useState<string | null>(null)

  const [scanSource, setScanSource] = useState<string | null>(null)
  const [duration, setDuration] = useState<string | null>(null)
  const [resultsUrl, setResultsUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isRescanning, setIsRescanning] = useState(false)

  const [groupView, setGroupView] = useState<GroupView>('flat')
  const [showDiff, setShowDiff] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [muteTrigger, setMuteTrigger] = useState(0)
  const [navIndex, setNavIndex] = useState<number | null>(null)

  const [filterState, setFilterState] = useState<FilterState>(() => {
    const severityParam = searchParams.get('severity')
    const fileParam = searchParams.get('file')
    const mutedParam = searchParams.get('muted')
    return {
      severities: severityParam
        ? new Set(
            severityParam
              .split(',')
              .map(s => (s.charAt(0).toUpperCase() + s.slice(1)) as Severity),
          )
        : new Set<Severity>(ALL_SEVERITIES),
      fileFilter: fileParam || '',
      showMuted: mutedParam === 'show',
    }
  })

  // Load findings from a share link (?r=) or from the last scan in sessionStorage.
  useEffect(() => {
    const storedFindings = sessionStorage.getItem('sg_findings')
    const sharedParam = searchParams.get('r')
    const isMultiNetwork = searchParams.get('multi') === '1'

    if (sharedParam) {
      const decoded = decodeFindingsParam(sharedParam)
      if (decoded === null) {
        router.replace('/')
        return
      }
      setFindings(decoded)

      const shareableUrl = new URL('/results', window.location.origin)
      shareableUrl.searchParams.set('r', sharedParam)
      setResultsUrl(shareableUrl.toString())

      if (isMultiNetwork) {
        const storedMulti = sessionStorage.getItem('sg_multi_network_results')
        if (storedMulti) {
          try {
            const parsed = JSON.parse(storedMulti) as MultiNetworkResults
            setMultiNetworkResults(parsed)
            if (parsed.length > 0) setActiveNetwork(parsed[0].network)
          } catch {
            // ignore malformed session payloads
          }
        }
      }
    } else if (storedFindings) {
      try {
        setFindings(JSON.parse(storedFindings) as Finding[])
      } catch {
        router.replace('/')
        return
      }
    } else {
      router.replace('/')
      return
    }

    const source =
      sessionStorage.getItem('sg_last_scan_source') ?? sessionStorage.getItem('sg_scan_source')
    if (source) setScanSource(source)

    const d = sessionStorage.getItem('sg_scan_duration')
    if (d) setDuration(d)
  }, [router, searchParams])

  // Pull the previous scan of the same contract so the diff view has a baseline.
  useEffect(() => {
    if (findings == null) return
    const source =
      sessionStorage.getItem('sg_last_scan_source') ?? sessionStorage.getItem('sg_scan_source')
    if (!source) return

    const prev = getAllScanHistory().find(
      record => record.contractId === source && record.findings.length > 0,
    )
    if (prev) setPrevFindings(prev.findings as Finding[])
  }, [findings])

  // Keep the active filters reflected in the URL so results stay linkable.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.delete('severity')
    params.delete('file')
    params.delete('muted')

    if (filterState.severities.size < ALL_SEVERITIES.length) {
      params.set('severity', [...filterState.severities].map(s => s.toLowerCase()).join(','))
    }
    if (filterState.fileFilter) params.set('file', filterState.fileFilter)
    if (filterState.showMuted) params.set('muted', 'show')

    const query = params.toString()
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname)
  }, [filterState])

  // j/k move through findings, matching the shortcuts advertised in the docs.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!findings || (e.key !== 'j' && e.key !== 'k')) return

      e.preventDefault()
      const current = navIndex ?? -1
      const next =
        e.key === 'j' ? Math.min(current + 1, findings.length - 1) : Math.max(current - 1, 0)
      setNavIndex(next)
      document.querySelector(`[data-finding-index="${next}"]`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [findings, navIndex])

  const activeFindings = useMemo(() => {
    if (multiNetworkResults && activeNetwork) {
      return multiNetworkResults.find(r => r.network === activeNetwork)?.findings ?? []
    }
    return findings ?? []
  }, [findings, multiNetworkResults, activeNetwork])

  const visibleFindings = useMemo(
    () => filterFindings(activeFindings, filterState),
    [activeFindings, filterState],
  )

  const score = useMemo(() => calculateScore(activeFindings), [activeFindings])

  const severityCounts = useMemo(() => {
    const counts = Object.fromEntries(ALL_SEVERITIES.map(s => [s, 0])) as Record<Severity, number>
    for (const f of activeFindings) {
      if (f.severity in counts) counts[f.severity] += 1
    }
    return counts
  }, [activeFindings])

  const diff = useMemo(
    () => (prevFindings ? diffFindings(prevFindings, activeFindings) : null),
    [prevFindings, activeFindings],
  )

  const handleMuteChange = useCallback(() => setMuteTrigger(prev => prev + 1), [])

  async function handleCopyLink() {
    if (!resultsUrl) return
    try {
      await navigator.clipboard.writeText(resultsUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      show('Could not copy the link to your clipboard', 'error')
    }
  }

  async function handleRescan() {
    if (!scanSource || isRescanning) return
    setIsRescanning(true)
    try {
      const network = NETWORKS[sessionStorage.getItem('sg_network') ?? 'testnet'] ?? NETWORKS.testnet
      const result = await scanContract(scanSource, network)
      setFindings(result.findings)
      sessionStorage.setItem('sg_findings', JSON.stringify(result.findings))
      show('Rescan complete', 'success')
    } catch (err) {
      show(err instanceof Error ? err.message : 'Rescan failed', 'error')
    } finally {
      setIsRescanning(false)
    }
  }

  if (findings === null) return <FindingsSkeleton />
  if (activeFindings.length === 0 && !multiNetworkResults) {
    return <EmptyState onScanAnother={() => router.push('/')} />
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Scan results</h1>
          {scanSource && (
            <p className="mt-1 break-all text-sm text-slate-400">
              {scanSource}
              {duration && <span className="ml-2 text-slate-500">· {duration}</span>}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Score</div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <section aria-label="Severity summary" className="mb-6 flex flex-wrap gap-3">
        {ALL_SEVERITIES.map(severity => (
          <div key={severity} className="flex items-center gap-2">
            <SeverityBadge severity={severity} size="sm" />
            <span className="text-sm text-slate-400">{severityCounts[severity]}</span>
          </div>
        ))}
      </section>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={handleRescan}
          disabled={!scanSource || isRescanning}
          className="rounded-md border border-slate-700 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {isRescanning ? 'Rescanning…' : 'Rescan'}
        </button>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="rounded-md border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-sm font-medium text-indigo-300 transition hover:bg-indigo-500/20"
        >
          Export findings
        </button>
        {resultsUrl && (
          <button
            onClick={handleCopyLink}
            className="rounded-md border border-slate-700 px-3 py-1.5 text-sm"
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
        )}
        {diff && (
          <button
            onClick={() => setShowDiff(v => !v)}
            className="rounded-md border border-slate-700 px-3 py-1.5 text-sm"
          >
            {showDiff ? 'Hide diff' : 'Compare with previous'}
          </button>
        )}
        <button
          onClick={() => router.push('/history')}
          className="rounded-md border border-slate-700 px-3 py-1.5 text-sm"
        >
          View history & trend
        </button>
        <button
          onClick={() => router.push('/')}
          className="rounded-md border border-slate-700 px-3 py-1.5 text-sm"
        >
          Scan another
        </button>
      </div>

      {multiNetworkResults && (
        <div role="tablist" aria-label="Networks" className="mb-6 flex gap-2">
          {multiNetworkResults.map(result => (
            <button
              key={result.network}
              role="tab"
              aria-selected={activeNetwork === result.network}
              onClick={() => setActiveNetwork(result.network)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                activeNetwork === result.network
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'text-slate-400'
              }`}
            >
              {NETWORKS[result.network] ? (
                <NetworkBadge network={NETWORKS[result.network]} />
              ) : (
                result.network
              )}
              <span className="ml-2">{result.findings.length}</span>
            </button>
          ))}
        </div>
      )}

      {showDiff && diff && <FindingsDiff diff={diff} />}

      <FindingsFilterBar
        findings={activeFindings}
        filterState={filterState}
        onFilterChange={setFilterState}
        muteTrigger={muteTrigger}
      />

      <div role="tablist" aria-label="Grouping" className="my-4 flex gap-2">
        {(['flat', 'function', 'file'] as GroupView[]).map(view => (
          <button
            key={view}
            role="tab"
            aria-selected={groupView === view}
            onClick={() => setGroupView(view)}
            className={`rounded-md px-3 py-1.5 text-sm capitalize ${
              groupView === view ? 'bg-slate-800 text-slate-100' : 'text-slate-400'
            }`}
          >
            {view === 'flat' ? 'All findings' : `By ${view}`}
          </button>
        ))}
      </div>

      {groupView === 'flat' && (
        <FindingsTable
          findings={visibleFindings}
          forceExpandedIndex={navIndex}
          onMuteChange={handleMuteChange}
        />
      )}
      {groupView === 'function' && (
        <FindingsByFunction findings={visibleFindings} onMuteChange={handleMuteChange} />
      )}
      {groupView === 'file' && (
        <FindingsByFile
          groupedFindings={groupByFile(visibleFindings)}
          onMuteChange={handleMuteChange}
        />
      )}

      <ExportModal
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        findings={visibleFindings}
        scanSource={scanSource}
      />
    </main>
  )
}
