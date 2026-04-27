import type { Finding, Severity } from '@/types/findings'

const LEVEL_MAP: Record<Severity, 'error' | 'warning' | 'note'> = {
  Critical: 'error',
  High: 'error',
  Medium: 'warning',
  Low: 'note',
}

export function exportSarif(findings: Finding[]): string {
  const ruleIds = new Set<string>()
  const rules = findings
    .filter(f => { if (ruleIds.has(f.check_name)) return false; ruleIds.add(f.check_name); return true })
    .map(f => ({
    id: f.check_name,
    name: f.check_name,
    shortDescription: { text: f.check_name },
    fullDescription: { text: f.description },
    defaultConfiguration: { level: LEVEL_MAP[f.severity as Severity] },
  }))

  const results = findings.map(f => ({
    ruleId: f.check_name,
    level: LEVEL_MAP[f.severity as Severity],
    message: { text: f.description },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: f.file_path, uriBaseId: '%SRCROOT%' },
          region: { startLine: f.line },
        },
        logicalLocations: [
          { name: f.function_name, kind: 'function' },
        ],
      },
    ],
  }))

  const sarif = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'Soroban Guard',
            version: '1.0.0',
            informationUri: 'https://soroban-guard.vercel.app',
            rules,
          },
        },
        results,
      },
    ],
  }

  return JSON.stringify(sarif, null, 2)
}
