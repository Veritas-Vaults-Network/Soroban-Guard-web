import type { Finding } from '@/types/findings'

export function groupByFunction(findings: Finding[]): Record<string, Finding[]> {
  const groups: Record<string, Finding[]> = {}
  for (const f of findings) {
    const key = f.function_name.trim() || 'Unknown function'
    ;(groups[key] ??= []).push(f)
  }
  return groups
}
