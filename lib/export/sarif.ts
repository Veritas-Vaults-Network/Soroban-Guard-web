import type { Finding, Severity } from '@/types/findings'
import { checkDescriptions } from '@/lib/checkDescriptions'

export type SarifLevel = 'error' | 'warning' | 'note' | 'none'

export interface SarifMessage {
  text: string
  markdown?: string
}

export interface SarifArtifactLocation {
  uri: string
  uriBaseId?: string
  index?: number
}

export interface SarifRegion {
  startLine: number
  startColumn?: number
  endLine?: number
  endColumn?: number
}

export interface SarifPhysicalLocation {
  artifactLocation: SarifArtifactLocation
  region: SarifRegion
}

export interface SarifLogicalLocation {
  name: string
  kind?: string
  fullyQualifiedName?: string
}

export interface SarifLocation {
  physicalLocation: SarifPhysicalLocation
  logicalLocations?: SarifLogicalLocation[]
  message?: SarifMessage
}

export interface SarifFix {
  description: SarifMessage
}

export interface SarifRuleConfiguration {
  level: SarifLevel
}

export interface SarifRule {
  id: string
  name: string
  shortDescription: SarifMessage
  fullDescription: SarifMessage
  defaultConfiguration: SarifRuleConfiguration
  help?: SarifMessage
  helpUri?: string
  properties?: {
    tags?: string[]
    precision?: 'low' | 'medium' | 'high' | 'very-high'
    'problem.severity'?: 'error' | 'warning' | 'recommendation'
    [key: string]: unknown
  }
}

export interface SarifDriver {
  name: string
  version?: string
  semanticVersion?: string
  informationUri?: string
  rules: SarifRule[]
}

export interface SarifTool {
  driver: SarifDriver
}

export interface SarifResult {
  ruleId: string
  ruleIndex?: number
  level: SarifLevel
  message: SarifMessage
  locations: SarifLocation[]
  fixes?: SarifFix[]
  properties?: Record<string, unknown>
}

export interface SarifRun {
  tool: SarifTool
  results: SarifResult[]
  columnKind?: 'utf16CodeUnits' | 'unicodeCodePoints'
}

export interface SarifLog {
  $schema: string
  version: '2.1.0'
  runs: SarifRun[]
}

export interface SarifExportOptions {
  toolName?: string
  toolVersion?: string
  informationUri?: string
  contractId?: string
  pretty?: boolean
}

/**
 * Maps Soroban Guard severity levels to SARIF 2.1.0 levels.
 * Critical & High -> 'error'
 * Medium -> 'warning'
 * Low & Info -> 'note'
 */
export function mapSeverityToSarifLevel(severity: Severity | string): SarifLevel {
  const norm = (severity || '').toLowerCase()
  switch (norm) {
    case 'critical':
    case 'high':
      return 'error'
    case 'medium':
      return 'warning'
    case 'low':
    case 'info':
      return 'note'
    default:
      return 'warning'
  }
}

/**
 * Normalizes file path to a clean relative URI suitable for SARIF %SRCROOT%.
 */
export function normalizeSarifFilePath(filePath?: string): string {
  if (!filePath || typeof filePath !== 'string' || !filePath.trim()) {
    return 'src/lib.rs'
  }
  let cleaned = filePath.trim().replace(/\\/g, '/')
  // Remove leading './' or '/'
  while (cleaned.startsWith('./')) {
    cleaned = cleaned.slice(2)
  }
  while (cleaned.startsWith('/')) {
    cleaned = cleaned.slice(1)
  }
  return cleaned || 'src/lib.rs'
}

/**
 * Generates rule metadata descriptors for all unique checks present or known.
 */
function buildRuleDescriptors(findings: Finding[]): SarifRule[] {
  const ruleMap = new Map<string, SarifRule>()

  for (const finding of findings) {
    const id = finding.check_name || 'unknown-check'
    if (!ruleMap.has(id)) {
      const level = mapSeverityToSarifLevel(finding.severity)
      const desc = checkDescriptions[id] || finding.description || `Soroban Guard check: ${id}`
      const shortDesc = desc.length > 150 ? `${desc.slice(0, 147)}...` : desc
      
      const helpMarkdown = [
        `### ${id}`,
        '',
        desc,
        finding.remediation ? `\n**Remediation:**\n${finding.remediation}` : '',
      ].filter(Boolean).join('\n')

      ruleMap.set(id, {
        id,
        name: id,
        shortDescription: {
          text: shortDesc,
        },
        fullDescription: {
          text: desc,
        },
        defaultConfiguration: {
          level,
        },
        help: {
          text: desc + (finding.remediation ? `\nRemediation: ${finding.remediation}` : ''),
          markdown: helpMarkdown,
        },
        properties: {
          tags: ['security', 'smart-contract', 'soroban', 'stellar'],
          precision: 'high',
          'problem.severity': level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'recommendation',
        },
      })
    }
  }

  return Array.from(ruleMap.values())
}

/**
 * Converts a Soroban Guard Finding array into a complete SARIF 2.1.0 log document.
 */
export function generateSarifLog(findings: Finding[] = [], options: SarifExportOptions = {}): SarifLog {
  const toolName = options.toolName || 'Soroban Guard'
  const toolVersion = options.toolVersion || '1.0.0'
  const informationUri = options.informationUri || 'https://sorobanguard.com'

  const safeFindings = Array.isArray(findings) ? findings : []
  const rules = buildRuleDescriptors(safeFindings)
  const ruleIndexMap = new Map<string, number>()
  rules.forEach((rule, idx) => {
    ruleIndexMap.set(rule.id, idx)
  })

  const results: SarifResult[] = safeFindings.map(finding => {
    const ruleId = finding.check_name || 'unknown-check'
    const level = mapSeverityToSarifLevel(finding.severity)
    const ruleIndex = ruleIndexMap.get(ruleId)
    const rawLine = typeof finding.line === 'number' ? finding.line : parseInt(String(finding.line), 10)
    const startLine = Number.isFinite(rawLine) && rawLine > 0 ? Math.floor(rawLine) : 1
    const fileUri = normalizeSarifFilePath(finding.file_path)

    const location: SarifLocation = {
      physicalLocation: {
        artifactLocation: {
          uri: fileUri,
          uriBaseId: '%SRCROOT%',
        },
        region: {
          startLine,
          startColumn: 1,
        },
      },
    }

    if (finding.function_name && finding.function_name.trim()) {
      location.logicalLocations = [
        {
          name: finding.function_name.trim(),
          kind: 'function',
          fullyQualifiedName: finding.function_name.trim(),
        },
      ]
    }

    const result: SarifResult = {
      ruleId,
      ...(ruleIndex !== undefined ? { ruleIndex } : {}),
      level,
      message: {
        text: finding.description || `Potential security issue detected: ${ruleId}`,
      },
      locations: [location],
      properties: {
        severity: finding.severity,
        ...(finding.remediation ? { remediation: finding.remediation } : {}),
      },
    }

    if (finding.remediation && finding.remediation.trim()) {
      result.fixes = [
        {
          description: {
            text: finding.remediation.trim(),
          },
        },
      ]
    }

    return result
  })

  return {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: toolName,
            version: toolVersion,
            semanticVersion: toolVersion,
            informationUri,
            rules,
          },
        },
        columnKind: 'utf16CodeUnits',
        results,
      },
    ],
  }
}

/**
 * Serializes findings into a valid SARIF 2.1.0 JSON string.
 */
export function serializeSarif(findings: Finding[] = [], options: SarifExportOptions = {}): string {
  const sarifLog = generateSarifLog(findings, options)
  return JSON.stringify(sarifLog, null, options.pretty !== false ? 2 : undefined)
}
