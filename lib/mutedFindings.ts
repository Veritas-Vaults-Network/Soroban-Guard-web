import type { Finding } from '@/types/findings'

const STORAGE_KEY = 'sg_muted_findings'

/**
 * Generates a unique key for a finding based on check_name, file_path, and line.
 */
function getFindingKey(finding: Finding): string {
  return `${finding.check_name}:${finding.file_path}:${finding.line}`
}

/**
 * Retrieves all muted finding keys from localStorage.
 */
function getMutedKeys(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

/**
 * Saves muted finding keys to localStorage.
 */
function saveMutedKeys(keys: Set<string>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...keys]))
  } catch {
    // Silently fail
  }
}

/**
 * Mutes a finding by storing its key.
 */
export function mute(finding: Finding): void {
  const keys = getMutedKeys()
  keys.add(getFindingKey(finding))
  saveMutedKeys(keys)
}

/**
 * Unmutes a finding by removing its key.
 */
export function unmute(finding: Finding): void {
  const keys = getMutedKeys()
  keys.delete(getFindingKey(finding))
  saveMutedKeys(keys)
}

/**
 * Checks if a finding is muted.
 */
export function isMuted(finding: Finding): boolean {
  const keys = getMutedKeys()
  return keys.has(getFindingKey(finding))
}
