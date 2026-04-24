export default function FindingsSkeleton() {
  const rows = Array.from({ length: 5 })
  return (
    <div className="overflow-hidden rounded-xl border border-[#2a2d3a]">
      {/* Table header visually present to preserve layout */}
      <div className="hidden grid-cols-[120px_1fr_1fr_80px_1fr] gap-4 border-b border-[#2a2d3a] bg-[#12151f] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:grid">
        <span>Severity</span>
        <span>Check</span>
        <span>Function</span>
        <span>Line</span>
        <span>Description</span>
      </div>

      {rows.map((_, i) => (
        <div key={i} className="w-full border-b border-[#2a2d3a] px-5 py-4 bg-[#0f1117] last:border-b-0">
          {/* Mobile layout */}
          <div className="flex items-start justify-between gap-3 sm:hidden">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-6 w-20 rounded-full bg-[#1a1d27] animate-pulse" />
                <span className="h-4 w-32 rounded bg-[#1a1d27] animate-pulse" />
              </div>
              <div className="h-4 w-full rounded bg-[#1a1d27] animate-pulse" />
            </div>
            <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Desktop layout */}
          <div className="hidden grid-cols-[120px_1fr_1fr_80px_1fr] items-center gap-4 sm:grid">
            <span className="h-6 w-20 rounded-full bg-[#1a1d27] animate-pulse" />
            <span className="h-4 w-48 rounded bg-[#1a1d27] animate-pulse" />
            <span className="h-4 w-40 rounded bg-[#1a1d27] animate-pulse" />
            <span className="h-4 w-12 rounded bg-[#1a1d27] animate-pulse" />
            <div className="flex items-center justify-between gap-2">
              <span className="h-4 w-full rounded bg-[#1a1d27] animate-pulse" />
              <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
