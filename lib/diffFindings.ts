import type { Finding } from '@/types/findings'

export interface DiffResult {
  resolved: Finding[]
  added: Finding[]
  unchanged: Finding[]
}

/**
 * Diff two sets of findings to identify resolved, new, and unchanged issues.
 * Matches findings deterministically using exact line numbers, function names (to handle line shifts),
 * and check descriptions (to handle function renames).
 * 
 * @param before - Findings from the previous scan
 * @param after - Findings from the current scan
 * @returns Object with resolved, added, and unchanged finding arrays
 */
export function diffFindings(before: Finding[], after: Finding[]): DiffResult {
  const beforeGroups = new Map<string, Finding[]>()
  const afterGroups = new Map<string, Finding[]>()

  function groupKey(f: Finding): string {
    return `${f.file_path}::${f.check_name}`
  }

  for (const f of before) {
    const k = groupKey(f)
    let list = beforeGroups.get(k)
    if (!list) {
      list = []
      beforeGroups.set(k, list)
    }
    list.push(f)
  }

  for (const f of after) {
    const k = groupKey(f)
    let list = afterGroups.get(k)
    if (!list) {
      list = []
      afterGroups.set(k, list)
    }
    list.push(f)
  }

  const matchedBefore = new Set<Finding>()
  const matchedAfter = new Set<Finding>()

  const allKeys = new Set([...beforeGroups.keys(), ...afterGroups.keys()])

  for (const k of allKeys) {
    const beforePool = [...(beforeGroups.get(k) || [])]
    const afterPool = [...(afterGroups.get(k) || [])]

    // Pass 1: Exact line match
    for (let i = 0; i < beforePool.length; i++) {
      const b = beforePool[i]
      const exactIndex = afterPool.findIndex(a => a.line === b.line)
      if (exactIndex !== -1) {
        const a = afterPool[exactIndex]
        matchedBefore.add(b)
        matchedAfter.add(a)
        beforePool.splice(i, 1)
        i--
        afterPool.splice(exactIndex, 1)
      }
    }

    // Helper interface for matching candidates
    interface MatchPair {
      b: Finding
      a: Finding
      diff: number
    }

    // Pass 2: Function name match (handles line shifts within the same function)
    const funcPairs: MatchPair[] = []
    for (const b of beforePool) {
      for (const a of afterPool) {
        if (b.function_name.trim() === a.function_name.trim()) {
          funcPairs.push({ b, a, diff: Math.abs(b.line - a.line) })
        }
      }
    }

    // Sort deterministically to handle line shifts cleanly
    funcPairs.sort((x, y) => {
      if (x.diff !== y.diff) return x.diff - y.diff
      if (x.b.line !== y.b.line) return x.b.line - y.b.line
      return x.a.line - y.a.line
    })

    for (const pair of funcPairs) {
      if (beforePool.includes(pair.b) && afterPool.includes(pair.a)) {
        matchedBefore.add(pair.b)
        matchedAfter.add(pair.a)
        beforePool.splice(beforePool.indexOf(pair.b), 1)
        afterPool.splice(afterPool.indexOf(pair.a), 1)
      }
    }

    // Pass 3: Description match (handles function renaming with same issue description)
    const descPairs: MatchPair[] = []
    for (const b of beforePool) {
      for (const a of afterPool) {
        if (b.description.trim() === a.description.trim()) {
          descPairs.push({ b, a, diff: Math.abs(b.line - a.line) })
        }
      }
    }

    descPairs.sort((x, y) => {
      if (x.diff !== y.diff) return x.diff - y.diff
      if (x.b.line !== y.b.line) return x.b.line - y.b.line
      return x.a.line - y.a.line
    })

    for (const pair of descPairs) {
      if (beforePool.includes(pair.b) && afterPool.includes(pair.a)) {
        matchedBefore.add(pair.b)
        matchedAfter.add(pair.a)
        beforePool.splice(beforePool.indexOf(pair.b), 1)
        afterPool.splice(afterPool.indexOf(pair.a), 1)
      }
    }
  }

  // Build the final arrays, preserving the input list order
  const resolved = before.filter(f => !matchedBefore.has(f))
  const added = after.filter(f => !matchedAfter.has(f))
  const unchanged = after.filter(f => matchedAfter.has(f))

  return { resolved, added, unchanged }
}

