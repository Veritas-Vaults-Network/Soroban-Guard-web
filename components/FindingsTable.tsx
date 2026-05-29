'use client'

import { useEffect, useState } from 'react'

import type { Finding, Severity } from '@/types/findings'
import type { PageSize } from '@/lib/preferences'
import { getPageSize, setPageSize, getNumericPageSize } from '@/lib/preferences'
import BottomSheet from './BottomSheet'
import SeverityBadge from './SeverityBadge'
import FindingCard from './FindingCard'


interface Props {
  findings: Finding[]
  searchQuery?: string
  pageSize?: number
  forceExpandedIndex?: number | null
  onMuteChange?: () => void
}

export default function FindingsTable({ findings, searchQuery = '', pageSize: propPageSize, forceExpandedIndex, onMuteChange }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [mobileOpenIndex, setMobileOpenIndex] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [isPrint, setIsPrint] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [preferredPageSize, setPreferredPageSize] = useState<PageSize>(20)

  useEffect(() => {
    setPreferredPageSize(getPageSize())
  }, [])


  useEffect(() => {
    if (forceExpandedIndex !== undefined) {
      setExpandedIndex(forceExpandedIndex)
    }
  }, [forceExpandedIndex])

  useEffect(() => {
    const printQuery = window.matchMedia('print')
    const handlePrintChange = (e: MediaQueryListEvent) => setIsPrint(e.matches)
    setIsPrint(printQuery.matches)
    printQuery.addEventListener('change', handlePrintChange)
    return () => printQuery.removeEventListener('change', handlePrintChange)
  }, [])

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 639px)')
    const handleMobileChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    setIsMobile(mobileQuery.matches)
    mobileQuery.addEventListener('change', handleMobileChange)
    return () => mobileQuery.removeEventListener('change', handleMobileChange)
  }, [])

  const q = searchQuery.trim().toLowerCase()
  const sorted = [...findings].sort((a, b) => {
    const order: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4,
}
    return order[a.severity] - order[b.severity]
  })

  const filteredFindings = q
    ? sorted.filter(
        finding =>
          finding.check_name.toLowerCase().includes(q) ||
          finding.function_name.toLowerCase().includes(q) ||
          finding.file_path.toLowerCase().includes(q) ||
          finding.description.toLowerCase().includes(q),
      )
    : sorted

  useEffect(() => {
    setCurrentPage(0)
  }, [q, preferredPageSize])

  // Determine effective page size: prop overrides preference, otherwise use preference
  const numericPageSize = propPageSize ?? getNumericPageSize(preferredPageSize)
  const showAll = numericPageSize === undefined
  const pageSize = numericPageSize ?? filteredFindings.length
  const totalPages = Math.ceil(filteredFindings.length / pageSize)
  const start = currentPage * pageSize
  const end = start + pageSize
  const paginatedFindings = showAll ? filteredFindings : filteredFindings.slice(start, end)

  function handlePageSizeChange(newSize: PageSize) {

    setPreferredPageSize(newSize)
    setPageSize(newSize)
    setCurrentPage(0)
  }


  function handleRowClick(pageIndex: number, globalIndex: number) {
    if (isMobile) {
      setMobileOpenIndex(prev => (prev === pageIndex ? null : pageIndex))
      setExpandedIndex(null)
      return
    }
    setExpandedIndex(prev => (prev === globalIndex ? null : globalIndex))
  }

  return (

    <div>
      {filteredFindings.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-5 py-10 text-center text-sm text-slate-500">
          No findings match your search.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-[var(--border)]">
        {/* Table header */}
        <div className="hidden grid-cols-[120px_1fr_1fr_80px_1fr] gap-4 border-b border-[var(--border)] bg-[var(--bg-tertiary)] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:grid">
          <span>Severity</span>
          <span>Check</span>
          <span>Function</span>
          <span>Line</span>
          <span>Description</span>
        </div>

        {paginatedFindings.map((finding, i) => {
          const globalIndex = start + i
          const isExpanded = !isMobile && expandedIndex === globalIndex
          const isMobileOpen = isMobile && mobileOpenIndex === i
          return (
            <div key={globalIndex} data-finding-index={globalIndex}>
              {/* Row */}
              <button
                onClick={() => handleRowClick(i, globalIndex)}
                className={`w-full border-b border-[var(--border)] px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-[var(--bg-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isExpanded || isMobileOpen ? 'bg-[var(--bg-hover)]' : 'bg-[var(--bg)]'
                }`}
                aria-expanded={isExpanded || isMobileOpen}
              >
                {/* Mobile layout */}
                <div className="flex items-start justify-between gap-3 sm:hidden">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={finding.severity} size="sm" />
                      <span className="font-mono text-xs text-indigo-400">
                        {finding.check_name}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-400">
                      {finding.description}
                    </p>
                  </div>
                  <ChevronIcon expanded={expandedIndex === globalIndex} />
                </div>

                {/* Desktop layout */}
                <div className="hidden grid-cols-[120px_1fr_1fr_80px_1fr] items-center gap-4 sm:grid">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={finding.severity} size="sm" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{finding.severity}</span>
                  </div>
                  <span className="font-mono text-sm text-indigo-400">
                    {finding.check_name}
                  </span>
                  <span className="truncate font-mono text-sm text-slate-300">
                    {finding.function_name}
                  </span>
                  <span className="font-mono text-sm text-slate-400">
                    {finding.line}
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="line-clamp-1 text-sm text-slate-400">
                      {finding.description}
                    </span>
                    <ChevronIcon expanded={expandedIndex === globalIndex} />
                  </div>
                </div>
              </button>

              {/* Expanded detail */}
              {(expandedIndex === globalIndex || isPrint) && (
                <div className="border-b border-[var(--border)] bg-[var(--bg-tertiary)] px-5 py-4 last:border-b-0">
                  <FindingCard finding={finding} onMuteChange={onMuteChange} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Page size selector */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Show</span>
          <select
            value={preferredPageSize}
            onChange={e => handlePageSizeChange(e.target.value as PageSize)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm text-slate-300 transition hover:border-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value="all">All</option>
          </select>
          <span>per page</span>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <p className="text-sm text-slate-500">
              Showing {start + 1}–{Math.min(end, filteredFindings.length)} of {filteredFindings.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-slate-400 transition disabled:opacity-50 hover:enabled:bg-[var(--bg-hover)] hover:enabled:text-white"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-slate-400 transition disabled:opacity-50 hover:enabled:bg-[var(--bg-hover)] hover:enabled:text-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </>)}

      {mobileOpenIndex !== null && paginatedFindings[mobileOpenIndex] && (
        <BottomSheet
          open
          title={paginatedFindings[mobileOpenIndex].check_name}
          onClose={() => setMobileOpenIndex(null)}
        >
          <FindingCard finding={paginatedFindings[mobileOpenIndex]} onMuteChange={onMuteChange} />
        </BottomSheet>
      )}
    </div>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-4 w-4 flex-shrink-0 text-slate-500 transition-transform duration-200 ${
        expanded ? 'rotate-180' : ''
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}
