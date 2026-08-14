import type { Finding } from '@/types/findings'

/**
 * Group findings by their function name.
 * @param findings - Array of scan findings
 * @returns Object mapping function name to its findings
 */
export function groupByFunction(findings: Finding[]): Record<string, Finding[]> {
  const groups: Record<string, Finding[]> = {}
  for (const f of findings) {
    const key = f.function_name.trim() || 'Unknown function'
    ;(groups[key] ??= []).push(f)
  }
  return groups
}

/**
 * Group findings by their file path.
 * @param findings - Array of scan findings
 * @returns Object mapping file path to its findings
 */
export function groupByFile(findings: Finding[]): Record<string, Finding[]> {
  const groups: Record<string, Finding[]> = {}
  for (const f of findings) {
    const key = f.file_path.trim() || 'Unknown file'
    ;(groups[key] ??= []).push(f)
  }
  return groups
}

