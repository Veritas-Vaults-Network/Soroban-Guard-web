/**
 * Real-time progress event types for scan operations.
 * 
 * These types are for FUTURE use when the soroban-guard-core API
 * implements streaming or polling-based progress endpoints.
 * 
 * Currently, progress shown in ScanProgress.tsx is client-side estimated.
 * See docs/PROGRESS_TRACKING_SPEC.md for implementation details.
 */

/**
 * Represents a single progress update during a scan operation.
 * Emitted via Server-Sent Events or polling.
 */
export interface ScanProgressEvent {
  /** Current phase of the scan */
  step: 'uploading' | 'parsing' | 'analyzing' | 'complete' | 'error'

  /** Progress percentage (0-100) */
  pct: number

  /** Elapsed time in milliseconds since scan started */
  elapsed: number

  /** Optional error message if step is 'error' */
  error?: string

  /** Optional detailed message about current operation */
  message?: string
}

/**
 * Response returned when starting an async scan operation.
 * Indicates the client should open a connection to streamUrl for progress updates.
 */
export interface ScanStartResponse {
  /** Unique identifier for this scan operation */
  scanId: string

  /** URL to open for Server-Sent Events progress stream */
  streamUrl?: string

  /** URL to poll for status updates (if using polling instead of SSE) */
  statusUrl?: string

  /** Recommended poll interval in milliseconds (if using polling) */
  pollIntervalMs?: number
}

/**
 * Status response from polling endpoint.
 * Used as an alternative to Server-Sent Events.
 */
export interface ScanStatusResponse {
  /** Whether the scan has completed */
  done: boolean

  /** Current step/phase */
  step: 'uploading' | 'parsing' | 'analyzing' | 'complete'

  /** Progress percentage (0-100) */
  pct: number

  /** Elapsed time in milliseconds */
  elapsed: number

  /** Scan findings (only populated when done=true) */
  findings?: Array<{
    check_name: string
    severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info'
    file_path: string
    line: number
    function_name: string
    description: string
    remediation?: string
  }>

  /** Error message if scan failed */
  error?: string
}

/**
 * Complete scan result returned when operation finishes.
 * Emitted via SSE 'complete' event or returned from polling endpoint.
 */
export interface ScanCompleteEvent {
  /** All findings discovered during scan */
  findings: Array<{
    check_name: string
    severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info'
    file_path: string
    line: number
    function_name: string
    description: string
    remediation?: string
  }>

  /** Total time taken to complete scan in milliseconds */
  totalTime: number

  /** Optional metadata about the scan */
  metadata?: {
    contractId?: string
    network?: string
    version?: string
  }
}

/**
 * Error event emitted if scan operation fails.
 * Emitted via SSE 'error' event or returned from polling endpoint.
 */
export interface ScanErrorEvent {
  /** Error code/type for categorization */
  code: string

  /** Human-readable error message */
  message: string

  /** Whether the error is potentially recoverable (for retry logic) */
  retryable?: boolean

  /** Suggested retry delay in milliseconds (if retryable) */
  retryAfterMs?: number
}
