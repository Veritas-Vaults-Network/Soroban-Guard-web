import type { Severity } from '@/types/findings'

interface Props {
  severity: Severity
  size?: 'sm' | 'md'
  includeIcon?: boolean
}

const styles: Record<Severity, string> = {
  Critical: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  High: 'bg-red-500/15 text-red-400 border border-red-500/30',
  Medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  Low: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
}

const dots: Record<Severity, string> = {
  Critical: 'bg-rose-400',
  High: 'bg-red-400',
  Medium: 'bg-amber-400',
  Low: 'bg-sky-400',
}

const icons: Record<Severity, string> = {
  High: '!!',
  Medium: '!',
  Low: 'ⓘ',
}

export default function SeverityBadge({ severity, size = 'md', includeIcon = true }: Props) {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide ${padding} ${styles[severity]}`}
      role="status"
      aria-label={`${severity} severity`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[severity]}`} aria-hidden="true" />
      {includeIcon && <span className="font-mono text-[0.7em] font-bold" aria-hidden="true">{icons[severity]}</span>}
      <span>{severity}</span>
    </span>
  )
}
