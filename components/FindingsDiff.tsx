'use client'

import type { Finding } from '@/types/findings'
import type { DiffResult } from '@/lib/diffFindings'
import SeverityBadge from './SeverityBadge'

interface Props {
  diff: DiffResult
}

function DiffRow({ finding, variant }: { finding: Finding; variant: 'resolved' | 'added' | 'unchanged' }) {
  const rowClass =
    variant === 'resolved'
      ? 'bg-green-500/10 border-green-500/20'
      : variant === 'added'
        ? 'bg-red-500/10 border-red-500/20'
        : 'border-[var(--border)]'

  const textClass =
    variant === 'resolved' ? 'line-through text-slate-400' : 'text-slate-200'

  const prefix =
    variant === 'resolved' ? '−' : variant === 'added' ? '+' : ' '

  const prefixClass =
    variant === 'resolved'
      ? 'text-green-400 font-bold'
      : variant === 'added'
        ? 'text-red-400 font-bold'
        : 'text-slate-600'

  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${rowClass}`}>
      <span className={`mt-0.5 w-3 shrink-0 text-sm ${prefixClass}`} aria-hidden="true">{prefix}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={finding.severity} size="sm" />
          <span className={`text-sm font-medium ${textClass}`}>{finding.check_name}</span>
        </div>
        <p className={`mt-1 text-xs ${variant === 'resolved' ? 'text-slate-500 line-through' : 'text-slate-400'}`}>
          {finding.file_path}:{finding.line} · {finding.function_name}
        </p>
      </div>
    </div>
  )
}

function Section({
  title,
  findings,
  variant,
  emptyText,
}: {
  title: string
  findings: Finding[]
  variant: 'resolved' | 'added' | 'unchanged'
  emptyText: string
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-400">
        {title}{' '}
        <span className="ml-1 rounded-full bg-[#1a1d27] px-2 py-0.5 text-xs text-slate-500">
          {findings.length}
        </span>
      </h3>
      {findings.length === 0 ? (
        <p className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {findings.map((f, i) => (
            <DiffRow key={i} finding={f} variant={variant} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FindingsDiff({ diff }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Resolved"
        findings={diff.resolved}
        variant="resolved"
        emptyText="No findings were resolved."
      />
      <Section
        title="New"
        findings={diff.added}
        variant="added"
        emptyText="No new findings introduced."
      />
      <Section
        title="Unchanged"
        findings={diff.unchanged}
        variant="unchanged"
        emptyText="No unchanged findings."
      />
    </div>
  )
}
