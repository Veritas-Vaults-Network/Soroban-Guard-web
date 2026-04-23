import type { Finding } from '@/types/findings'
import SeverityBadge from './SeverityBadge'
import CheckTooltip from './CheckTooltip'

interface Props {
  finding: Finding
}

export default function FindingCard({ finding }: Props) {
  return (
    <div className="slide-down rounded-lg border border-[#2a2d3a] bg-[#12151f] p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SeverityBadge severity={finding.severity} />
        <CheckTooltip checkName={finding.check_name} />
      </div>

      <p className="mb-5 text-sm leading-relaxed text-slate-300">
        {finding.description}
      </p>

      {finding.remediation && (
        <div className="mb-5 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
          <p className="mb-1 text-xs font-semibold text-green-400">Remediation</p>
          <p className="text-sm leading-relaxed text-green-300/90">
            {finding.remediation}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Detail label="Function" value={finding.function_name} mono />
        <Detail label="File" value={finding.file_path} mono />
        <Detail label="Line" value={String(finding.line)} mono />
      </div>
    </div>
  )
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="rounded-md bg-[#1a1d27] px-3 py-2">
      <p className="mb-0.5 text-xs text-slate-500">{label}</p>
      <p
        className={`truncate text-sm text-slate-200 ${mono ? 'font-mono' : ''}`}
        title={value}
      >
        {value}
      </p>
    </div>
  )
}
