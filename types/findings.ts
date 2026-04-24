export type Severity = 'Critical' | 'High' | 'Medium' | 'Low'

export interface Finding {
  check_name: string
  severity: Severity
  file_path: string
  line: number
  function_name: string
  description: string
  remediation?: string
}

export interface ScanResponse {
  findings: Finding[]
}

export interface ScanRequest {
  source: string
}
