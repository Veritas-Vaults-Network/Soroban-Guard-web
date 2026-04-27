import type { Finding } from '@/types/findings'

export interface DiffResult {
  resolved: Finding[]
  added: Finding[]
  unchanged: Finding[]
}

function key(f: Finding): string {
  return `${f.check_name}::${f.file_path}::${f.line}`
}

export function diffFindings(before: Finding[], after: Finding[]): DiffResult {
  const beforeMap = new Map(before.map(f => [key(f), f]))
  const afterMap = new Map(after.map(f => [key(f), f]))

  const resolved = before.filter(f => !afterMap.has(key(f)))
  const added = after.filter(f => !beforeMap.has(key(f)))
  const unchanged = after.filter(f => beforeMap.has(key(f)))

  return { resolved, added, unchanged }
}
