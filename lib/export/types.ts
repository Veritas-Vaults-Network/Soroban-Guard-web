import type { Finding } from '@/types/findings'

export type TargetCategory = 'chat' | 'issue_tracker'

export interface ExportFormField {
  name: string
  label: string
  type: 'text' | 'url' | 'password' | 'checkbox' | 'select'
  placeholder?: string
  required?: boolean
  defaultValue?: string | boolean
  helpText?: string
  options?: { label: string; value: string }[]
}

export interface ExportPayloadOptions {
  includeSource?: boolean
  source?: string
  contractId?: string
  title?: string
  [key: string]: unknown
}

export interface ExportRequestPayload {
  targetId: string
  config: Record<string, any>
  findings: Finding[]
  options?: ExportPayloadOptions
}

export interface ExportResponse {
  success: boolean
  message: string
  externalUrl?: string
  statusCode?: number
}

export interface ExportTarget {
  id: string
  name: string
  category: TargetCategory
  description: string
  iconName?: string
  fields: ExportFormField[]
  supportsSourceInclusion: boolean
  allowlistDomains: string[]

  /**
   * Constructs the payload object formatted specifically for the target API.
   */
  buildPayload(
    findings: Finding[],
    config: Record<string, any>,
    options?: ExportPayloadOptions
  ): Record<string, any>

  /**
   * Validates target configuration fields prior to export execution.
   */
  validateConfig(config: Record<string, any>): { valid: boolean; error?: string }

  /**
   * Formats HTTP status code and response body into a clear user-actionable error string.
   */
  parseErrorResponse(status: number, responseBody: string): string
}
