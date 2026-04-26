import type { Finding } from '@/types/findings'

/**
 * Groups findings by their file_path.
 * Returns a record where keys are file paths and values are arrays of findings.
 */
export function groupByFile(findings: Finding[]): Record<string, Finding[]> {
  const grouped: Record<string, Finding[]> = {}
  
  for (const finding of findings) {
    const path = finding.file_path
    if (!grouped[path]) {
      grouped[path] = []
    }
    grouped[path].push(finding)
  }
  
  return grouped
}
