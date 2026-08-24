import type { Finding, Severity } from '@/types/findings'
import type { ExportFormField, ExportPayloadOptions, ExportTarget } from '../types'

const DISCORD_ALLOWLIST = ['discord.com', 'discordapp.com']

const SEVERITY_COLORS: Record<Severity, number> = {
  Critical: 0xd97706, // Orange/Red
  High: 0xef4444,     // Red
  Medium: 0xf59e0b,   // Amber
  Low: 0x3b82f6,      // Blue
  Info: 0x6b7280,     // Gray
}

export const discordTarget: ExportTarget = {
  id: 'discord',
  name: 'Discord Webhook',
  category: 'chat',
  description: 'Send color-coded security finding embeds directly to a Discord channel.',
  fields: [
    {
      name: 'webhookUrl',
      label: 'Discord Webhook URL',
      type: 'url',
      required: true,
      placeholder: 'https://discord.com/api/webhooks/...',
      helpText: 'Create a Webhook in Discord Channel Settings > Integrations.',
    },
  ],
  supportsSourceInclusion: true,
  allowlistDomains: DISCORD_ALLOWLIST,

  validateConfig(config: Record<string, any>) {
    const url = config?.webhookUrl
    if (!url || typeof url !== 'string' || !url.trim()) {
      return { valid: false, error: 'Discord Webhook URL is required.' }
    }

    try {
      const parsed = new URL(url.trim())
      if (parsed.protocol !== 'https:') {
        return { valid: false, error: 'Discord Webhook URL must use HTTPS.' }
      }
      if (!DISCORD_ALLOWLIST.includes(parsed.hostname.toLowerCase())) {
        return {
          valid: false,
          error: `Webhook hostname '${parsed.hostname}' is not allowed. Expected domains: ${DISCORD_ALLOWLIST.join(', ')}`,
        }
      }
    } catch {
      return { valid: false, error: 'Invalid Discord Webhook URL format.' }
    }

    return { valid: true }
  },

  buildPayload(
    findings: Finding[],
    _config: Record<string, any>,
    options?: ExportPayloadOptions
  ): Record<string, any> {
    const title = options?.title || 'Soroban Guard Security Report'
    const topFinding = findings[0]
    const highestSeverity = topFinding ? topFinding.severity : 'Info'

    const embeds: any[] = [
      {
        title,
        description: `Found **${findings.length}** security finding(s) in contract scan.`,
        color: SEVERITY_COLORS[highestSeverity] || 0x6b7280,
        fields: findings.slice(0, 10).map((f) => ({
          name: `[${f.severity}] ${f.check_name}`,
          value: `**File:** \`${f.file_path}:${f.line}\` | **Function:** \`${f.function_name}\`\n${f.description}${f.remediation ? `\n*Remediation:* ${f.remediation}` : ''}`,
          inline: false,
        })),
        timestamp: new Date().toISOString(),
      },
    ]

    if (options?.includeSource && options?.source) {
      const snippet = options.source.length > 1000 ? options.source.slice(0, 1000) + '\n...' : options.source
      embeds.push({
        title: 'Contract Source Code Snippet',
        description: `\`\`\`rust\n${snippet}\n\`\`\``,
        color: 0x4f46e5,
      })
    }

    return { embeds }
  },

  parseErrorResponse(status: number, responseBody: string): string {
    if (status === 404) {
      return 'Discord webhook URL not found or webhook was deleted.'
    }
    if (status === 401 || status === 403) {
      return 'Discord webhook unauthorized. Please check your webhook URL permissions.'
    }
    if (status === 429) {
      return 'Discord rate limit exceeded. Please wait a moment before sending more messages.'
    }
    return `Discord API error (HTTP ${status}): ${responseBody || 'Failed to post message'}`
  },
}
