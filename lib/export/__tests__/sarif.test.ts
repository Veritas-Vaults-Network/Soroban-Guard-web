import { describe, expect, it } from 'vitest'
import type { Finding } from '@/types/findings'
import {
  generateSarifLog,
  serializeSarif,
  mapSeverityToSarifLevel,
  normalizeSarifFilePath,
} from '@/lib/export/sarif'

const mockFindings: Finding[] = [
  {
    check_name: 'missing-require-auth',
    severity: 'Critical',
    file_path: 'src/lib.rs',
    line: 42,
    function_name: 'mint_tokens',
    description: 'A contract method writes to storage without calling env.require_auth().',
    remediation: 'Add env.require_auth() before mutating storage.',
  },
  {
    check_name: 'integer-overflow',
    severity: 'High',
    file_path: './contracts/token.rs',
    line: 88,
    function_name: 'transfer',
    description: 'Integer arithmetic may overflow without proper bounds checking.',
    remediation: 'Use checked_add or checked_sub.',
  },
  {
    check_name: 'precision-loss',
    severity: 'Medium',
    file_path: '/src/math.rs',
    line: 15,
    function_name: 'calculate_fee',
    description: 'Fixed-point or integer division discards fractional bits.',
  },
  {
    check_name: 'missing-event',
    severity: 'Low',
    file_path: 'src/events.rs',
    line: 3,
    function_name: 'emit_transfer',
    description: 'A state-changing operation does not emit an event.',
  },
  {
    check_name: 'custom-info-check',
    severity: 'Info',
    file_path: 'src/info.rs',
    line: 10,
    function_name: 'version_info',
    description: 'Information regarding contract versioning.',
  },
]

describe('SARIF 2.1.0 Serializer', () => {
  describe('mapSeverityToSarifLevel', () => {
    it('maps Critical and High severities to error', () => {
      expect(mapSeverityToSarifLevel('Critical')).toBe('error')
      expect(mapSeverityToSarifLevel('High')).toBe('error')
    })

    it('maps Medium severity to warning', () => {
      expect(mapSeverityToSarifLevel('Medium')).toBe('warning')
    })

    it('maps Low and Info severities to note', () => {
      expect(mapSeverityToSarifLevel('Low')).toBe('note')
      expect(mapSeverityToSarifLevel('Info')).toBe('note')
    })

    it('defaults unknown severity to warning', () => {
      expect(mapSeverityToSarifLevel('Unknown' as unknown as Severity)).toBe('warning')
      expect(mapSeverityToSarifLevel('')).toBe('warning')
    })
  })

  describe('normalizeSarifFilePath', () => {
    it('strips leading ./ and /', () => {
      expect(normalizeSarifFilePath('./src/lib.rs')).toBe('src/lib.rs')
      expect(normalizeSarifFilePath('/src/lib.rs')).toBe('src/lib.rs')
      expect(normalizeSarifFilePath('.//src/lib.rs')).toBe('src/lib.rs')
    })

    it('converts Windows backslashes to forward slashes', () => {
      expect(normalizeSarifFilePath('src\\contracts\\token.rs')).toBe('src/contracts/token.rs')
    })

    it('falls back to default path when undefined or empty', () => {
      expect(normalizeSarifFilePath(undefined)).toBe('src/lib.rs')
      expect(normalizeSarifFilePath('')).toBe('src/lib.rs')
      expect(normalizeSarifFilePath('   ')).toBe('src/lib.rs')
    })
  })

  describe('generateSarifLog Schema Compliance', () => {
    it('produces standard SARIF 2.1.0 root structure', () => {
      const sarif = generateSarifLog(mockFindings)

      expect(sarif.$schema).toBe(
        'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json'
      )
      expect(sarif.version).toBe('2.1.0')
      expect(sarif.runs).toHaveLength(1)

      const run = sarif.runs[0]
      expect(run.tool.driver.name).toBe('Soroban Guard')
      expect(run.tool.driver.version).toBe('1.0.0')
      expect(run.tool.driver.informationUri).toBe('https://sorobanguard.com')
      expect(run.columnKind).toBe('utf16CodeUnits')
    })

    it('generates rule descriptors in tool.driver.rules', () => {
      const sarif = generateSarifLog(mockFindings)
      const rules = sarif.runs[0].tool.driver.rules

      expect(rules.length).toBe(mockFindings.length)

      const authRule = rules.find(r => r.id === 'missing-require-auth')
      expect(authRule).toBeDefined()
      expect(authRule?.name).toBe('missing-require-auth')
      expect(authRule?.defaultConfiguration.level).toBe('error')
      expect(authRule?.shortDescription.text).toBeTruthy()
      expect(authRule?.fullDescription.text).toContain('env.require_auth()')
      expect(authRule?.help?.markdown).toContain('### missing-require-auth')
      expect(authRule?.properties?.tags).toContain('soroban')
      expect(authRule?.properties?.precision).toBe('high')
    })

    it('correctly maps each finding to a SARIF result', () => {
      const sarif = generateSarifLog(mockFindings)
      const results = sarif.runs[0].results

      expect(results).toHaveLength(5)

      // Finding 0: Critical missing-require-auth
      const r0 = results[0]
      expect(r0.ruleId).toBe('missing-require-auth')
      expect(r0.level).toBe('error')
      expect(r0.message.text).toBe(
        'A contract method writes to storage without calling env.require_auth().'
      )
      expect(r0.locations).toHaveLength(1)
      expect(r0.locations[0].physicalLocation.artifactLocation.uri).toBe('src/lib.rs')
      expect(r0.locations[0].physicalLocation.artifactLocation.uriBaseId).toBe('%SRCROOT%')
      expect(r0.locations[0].physicalLocation.region.startLine).toBe(42)
      expect(r0.locations[0].physicalLocation.region.startColumn).toBe(1)
      expect(r0.locations[0].logicalLocations?.[0].name).toBe('mint_tokens')
      expect(r0.locations[0].logicalLocations?.[0].kind).toBe('function')
      expect(r0.fixes?.[0].description.text).toBe('Add env.require_auth() before mutating storage.')
      expect(r0.properties?.severity).toBe('Critical')

      // Finding 1: High integer-overflow (relative path normalized)
      const r1 = results[1]
      expect(r1.ruleId).toBe('integer-overflow')
      expect(r1.level).toBe('error')
      expect(r1.locations[0].physicalLocation.artifactLocation.uri).toBe('contracts/token.rs')
      expect(r1.locations[0].physicalLocation.region.startLine).toBe(88)

      // Finding 2: Medium precision-loss (leading slash normalized)
      const r2 = results[2]
      expect(r2.ruleId).toBe('precision-loss')
      expect(r2.level).toBe('warning')
      expect(r2.locations[0].physicalLocation.artifactLocation.uri).toBe('src/math.rs')

      // Finding 3: Low missing-event
      const r3 = results[3]
      expect(r3.ruleId).toBe('missing-event')
      expect(r3.level).toBe('note')

      // Finding 4: Info custom check
      const r4 = results[4]
      expect(r4.ruleId).toBe('custom-info-check')
      expect(r4.level).toBe('note')
    })

    it('matches ruleId and ruleIndex with driver.rules array', () => {
      const sarif = generateSarifLog(mockFindings)
      const run = sarif.runs[0]

      run.results.forEach(result => {
        expect(result.ruleIndex).toBeDefined()
        const rule = run.tool.driver.rules[result.ruleIndex!]
        expect(rule.id).toBe(result.ruleId)
      })
    })
  })

  describe('Edge Cases and Large Datasets', () => {
    it('handles empty findings array cleanly', () => {
      const sarif = generateSarifLog([])

      expect(sarif.version).toBe('2.1.0')
      expect(sarif.runs).toHaveLength(1)
      expect(sarif.runs[0].results).toEqual([])
      expect(sarif.runs[0].tool.driver.rules).toEqual([])

      const jsonStr = serializeSarif([])
      expect(() => JSON.parse(jsonStr)).not.toThrow()
      const parsed = JSON.parse(jsonStr)
      expect(parsed.runs[0].results).toHaveLength(0)
    })

    it('handles line numbers <= 0 or invalid line numbers safely by defaulting to 1', () => {
      const irregularFindings: Finding[] = [
        {
          check_name: 'test-zero-line',
          severity: 'Medium',
          file_path: 'src/lib.rs',
          line: 0,
          function_name: 'test',
          description: 'Zero line number test',
        },
        {
          check_name: 'test-negative-line',
          severity: 'Low',
          file_path: 'src/lib.rs',
          line: -10,
          function_name: 'test',
          description: 'Negative line number test',
        },
        {
          check_name: 'test-nan-line',
          severity: 'Info',
          file_path: '',
          line: NaN as unknown as number,
          function_name: '',
          description: 'NaN line test',
        },
      ]

      const sarif = generateSarifLog(irregularFindings)
      expect(sarif.runs[0].results[0].locations[0].physicalLocation.region.startLine).toBe(1)
      expect(sarif.runs[0].results[1].locations[0].physicalLocation.region.startLine).toBe(1)
      expect(sarif.runs[0].results[2].locations[0].physicalLocation.region.startLine).toBe(1)
      expect(sarif.runs[0].results[2].locations[0].logicalLocations).toBeUndefined()
    })

    it('handles large finding datasets (e.g. 500+ findings) efficiently', () => {
      const largeFindings: Finding[] = Array.from({ length: 500 }, (_, i) => ({
        check_name: `check-rule-${i % 20}`,
        severity: (['Critical', 'High', 'Medium', 'Low', 'Info'] as const)[i % 5],
        file_path: `src/contract_${i % 10}.rs`,
        line: (i % 200) + 1,
        function_name: `func_${i % 15}`,
        description: `Finding description for iteration ${i}`,
        remediation: i % 2 === 0 ? `Remediation advice ${i}` : undefined,
      }))

      const start = performance.now()
      const jsonStr = serializeSarif(largeFindings)
      const elapsed = performance.now() - start

      expect(elapsed).toBeLessThan(1000) // Must process 500 items in well under a second
      const parsed = JSON.parse(jsonStr)
      expect(parsed.runs[0].results).toHaveLength(500)
      expect(parsed.runs[0].tool.driver.rules.length).toBeLessThanOrEqual(20)
    })

    it('handles custom tool options and pretty print options', () => {
      const jsonCompact = serializeSarif(mockFindings.slice(0, 1), {
        toolName: 'Custom Scanner',
        toolVersion: '2.5.0',
        informationUri: 'https://example.com/scanner',
        pretty: false,
      })

      expect(jsonCompact).not.toContain('\n')
      const parsed = JSON.parse(jsonCompact)
      expect(parsed.runs[0].tool.driver.name).toBe('Custom Scanner')
      expect(parsed.runs[0].tool.driver.version).toBe('2.5.0')
      expect(parsed.runs[0].tool.driver.informationUri).toBe('https://example.com/scanner')
    })
  })
})
