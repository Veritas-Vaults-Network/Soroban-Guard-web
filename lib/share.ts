import type { Finding } from '@/types/findings'

export function encodeFindings(findings: Finding[]): string {
  const json = JSON.stringify(findings)
  return encodeURIComponent(btoa(json))
}

export function decodeFindings(param: string): Finding[] {
  try {
    const json = atob(decodeURIComponent(param))
    return JSON.parse(json) as Finding[]
  } catch {
    return []
  }
}

export interface Workspace {
  source: string
  findings: Finding[]
}

export function encodeWorkspace(source: string, findings: Finding[]): string {
  const json = JSON.stringify({ source, findings } satisfies Workspace)
  return encodeURIComponent(btoa(json))
}

export function decodeWorkspace(param: string): Workspace | null {
  try {
    const json = atob(decodeURIComponent(param))
    return JSON.parse(json) as Workspace
  } catch {
    return null
  }
}
