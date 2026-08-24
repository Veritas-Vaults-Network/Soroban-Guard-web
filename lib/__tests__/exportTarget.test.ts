import { describe, expect, it, vi } from 'vitest'
import type { Finding } from '@/types/findings'
import { getExportTarget, getAllExportTargets, slackTarget, discordTarget } from '@/lib/export'

const mockFindings: Finding[] = [
  {
    check_name: 'Unprotected Mint',
    severity: 'Critical',
    file_path: 'src/lib.rs',
    line: 42,
    function_name: 'mint_tokens',
    description: 'Mint function lacks administrative authorization check.',
    remediation: 'Require admin signature before executing mint.',
  },
  {
    check_name: 'Unchecked Overflow',
    severity: 'Medium',
    file_path: 'src/token.rs',
    line: 88,
    function_name: 'transfer',
    description: 'Arithmetic operation may overflow without checks.',
  },
]

describe('ExportTarget Framework & Slack Adapter', () => {
  it('registers and retrieves Slack and Discord export targets', () => {
    const targets = getAllExportTargets()
    expect(targets.length).toBeGreaterThanOrEqual(2)

    const slack = getExportTarget('slack')
    expect(slack).toBeDefined()
    expect(slack?.name).toBe('Slack Webhook')
    expect(slack?.category).toBe('chat')
    expect(slack?.allowlistDomains).toContain('hooks.slack.com')

    const discord = getExportTarget('discord')
    expect(discord).toBeDefined()
    expect(discord?.name).toBe('Discord Webhook')
  })

  describe('Slack Config Validation & Security Allowlist', () => {
    it('rejects empty or missing webhook URLs', () => {
      const res = slackTarget.validateConfig({})
      expect(res.valid).toBe(false)
      expect(res.error).toContain('Slack Webhook URL is required')
    })

    it('rejects non-HTTPS URLs', () => {
      const res = slackTarget.validateConfig({
        webhookUrl: 'http://hooks.slack.com/services/test-webhook-path',
      })
      expect(res.valid).toBe(false)
      expect(res.error).toContain('must use HTTPS')
    })

    it('rejects URLs outside the allowlisted domain', () => {
      const res = slackTarget.validateConfig({
        webhookUrl: 'https://evil-attacker.com/services/test-webhook-path',
      })
      expect(res.valid).toBe(false)
      expect(res.error).toContain("is not allowed. Expected domain: hooks.slack.com")
    })

    it('accepts valid Slack webhook URLs', () => {
      const res = slackTarget.validateConfig({
        webhookUrl: 'https://hooks.slack.com/services/test-webhook-path',
      })
      expect(res.valid).toBe(true)
      expect(res.error).toBeUndefined()
    })
  })

  describe('Slack Payload Construction & Privacy Controls', () => {
    it('constructs Slack Block Kit payload with findings breakdown', () => {
      const payload = slackTarget.buildPayload(mockFindings, { channel: '#security' })

      expect(payload).toHaveProperty('blocks')
      expect(Array.isArray(payload.blocks)).toBe(true)

      const headerBlock = payload.blocks[0]
      expect(headerBlock.type).toBe('header')

      const summaryBlock = payload.blocks[1]
      expect(summaryBlock.text.text).toContain('Total Findings:* 2')
      expect(summaryBlock.text.text).toContain('Critical*: 1')
      expect(summaryBlock.text.text).toContain('#security')

      // Check finding section block
      const findingBlock = payload.blocks.find(
        (b: any) => b.type === 'section' && b.text?.text?.includes('Unprotected Mint')
      )
      expect(findingBlock).toBeDefined()
      expect(findingBlock.text.text).toContain('[CRITICAL]')
      expect(findingBlock.text.text).toContain('src/lib.rs:42')
      expect(findingBlock.text.text).toContain('mint_tokens')
      expect(findingBlock.text.text).toContain('Require admin signature')
    })

    it('excludes contract source code by default (privacy requirement)', () => {
      const payload = slackTarget.buildPayload(mockFindings, {}, {
        source: 'fn mint_tokens() { unlimited_mint(); }',
        includeSource: false, // Explicitly false or omitted
      })

      const sourceBlock = payload.blocks.find(
        (b: any) => b.text?.text?.includes('Contract Source Code Snippet')
      )
      expect(sourceBlock).toBeUndefined()
    })

    it('includes contract source snippet ONLY when includeSource is explicitly true (opt-in)', () => {
      const sourceCode = 'pub fn mint_tokens() { unbounded_mint(); }'
      const payload = slackTarget.buildPayload(mockFindings, {}, {
        source: sourceCode,
        includeSource: true,
      })

      const sourceBlock = payload.blocks.find(
        (b: any) => b.text?.text?.includes('Contract Source Code Snippet')
      )
      expect(sourceBlock).toBeDefined()
      expect(sourceBlock.text.text).toContain(sourceCode)
    })
  })

  describe('Slack Destination Error Response Parsing', () => {
    it('formats 404 / invalid token errors into actionable message', () => {
      const msg = slackTarget.parseErrorResponse(404, 'invalid_token')
      expect(msg).toContain('Slack webhook URL is invalid or the target channel/webhook was deleted')
    })

    it('formats 403 forbidden permissions errors', () => {
      const msg = slackTarget.parseErrorResponse(403, 'action_prohibited')
      expect(msg).toContain('Slack webhook request was forbidden')
    })

    it('formats 429 rate limit errors', () => {
      const msg = slackTarget.parseErrorResponse(429, 'rate_limited')
      expect(msg).toContain('Slack rate limit reached')
    })

    it('formats 400 payload error', () => {
      const msg = slackTarget.parseErrorResponse(400, 'payload_too_large')
      expect(msg).toContain('Slack rejected notification payload')
    })
  })

  describe('Discord Export Target Adapter', () => {
    it('validates Discord webhook URL correctly', () => {
      expect(
        discordTarget.validateConfig({ webhookUrl: 'https://discord.com/api/webhooks/123/abc' }).valid
      ).toBe(true)

      expect(
        discordTarget.validateConfig({ webhookUrl: 'https://unauthorized-domain.com/webhook' }).valid
      ).toBe(false)
    })

    it('builds Discord embed payload', () => {
      const payload = discordTarget.buildPayload(mockFindings, {})
      expect(payload).toHaveProperty('embeds')
      expect(payload.embeds[0].fields.length).toBe(2)
      expect(payload.embeds[0].fields[0].name).toContain('Unprotected Mint')
    })
  })
})
