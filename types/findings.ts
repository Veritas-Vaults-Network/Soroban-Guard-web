export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info'

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

export interface NetworkScanResult {
  network: string
  findings: Finding[]
  status: 'success' | 'not_found' | 'error'
  error?: string
}

export type MultiNetworkResults = NetworkScanResult[]
