import type { Finding } from '@/types/findings'

/**
 * Encode findings to a URL-safe base64 string.
 * @param findings - Array of findings to encode
 * @returns URL-safe encoded string
 */
export function encodeFindings(findings: Finding[]): string {
  const json = JSON.stringify(findings)
  return encodeURIComponent(btoa(json))
}

/**
 * Decode findings from a URL-safe base64 string.
 * @param param - Encoded findings string
 * @returns Decoded findings array, or empty array on error
 */
export function decodeFindings(param: string): Finding[] {
  return decodeFindingsParam(param) ?? []
}

export function decodeFindingsParam(param: string): Finding[] | null {
  try {
    const json = atob(decodeURIComponent(param))
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? (parsed as Finding[]) : null
  } catch {
    return null
  }
}

export interface Workspace {
  source: string
  findings: Finding[]
}

/**
 * Encode a source + findings workspace to a URL-safe base64 string.
 * @param source - Contract source code or identifier
 * @param findings - Array of findings
 * @returns URL-safe encoded workspace string
 */
export function encodeWorkspace(source: string, findings: Finding[]): string {
  const json = JSON.stringify({ source, findings } satisfies Workspace)
  return encodeURIComponent(btoa(json))
}

/**
 * Decode a workspace from a URL-safe base64 string.
 * @param param - Encoded workspace string
 * @returns Decoded workspace, or null on error
 */
export function decodeWorkspace(param: string): Workspace | null {
  try {
    const json = atob(decodeURIComponent(param))
    return JSON.parse(json) as Workspace
  } catch {
    return null
  }
}
