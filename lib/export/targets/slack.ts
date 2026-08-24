import type { Finding, Severity } from '@/types/findings'
import type { ExportFormField, ExportPayloadOptions, ExportTarget } from '../types'

const SLACK_ALLOWLIST = ['hooks.slack.com']

const SEVERITY_EMOJI: Record<Severity, string> = {
  Critical: '🚨',
  High: '⚠️',
  Medium: '⚡',
  Low: '🔍',
  Info: 'ℹ️',
}

export const slackTarget: ExportTarget = {
  id: 'slack',
  name: 'Slack Webhook',
  category: 'chat',
  description: 'Send formatted finding reports directly to a Slack channel via Incoming Webhook.',
  fields: [
    {
      name: 'webhookUrl',
      label: 'Slack Webhook URL',
      type: 'url',
      required: true,
      placeholder: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
      helpText: 'Generate an Incoming Webhook URL in your Slack workspace settings.',
    },
    {
      name: 'channel',
      label: 'Channel / Destination Label',
      type: 'text',
      required: false,
      placeholder: '#security-alerts',
      helpText: 'Optional text label for reference in report headers.',
    },
  ],
  supportsSourceInclusion: true,
  allowlistDomains: SLACK_ALLOWLIST,

  validateConfig(config: Record<string, any>) {
    const url = config?.webhookUrl
    if (!url || typeof url !== 'string' || !url.trim()) {
      return { valid: false, error: 'Slack Webhook URL is required.' }
    }

    try {
      const parsed = new URL(url.trim())
      if (parsed.protocol !== 'https:') {
        return { valid: false, error: 'Slack Webhook URL must use HTTPS.' }
      }
      if (!SLACK_ALLOWLIST.includes(parsed.hostname.toLowerCase())) {
        return {
          valid: false,
          error: `Webhook hostname '${parsed.hostname}' is not allowed. Expected domain: ${SLACK_ALLOWLIST.join(', ')}`,
        }
      }
    } catch {
      return { valid: false, error: 'Invalid Slack Webhook URL format.' }
    }

    return { valid: true }
  },

  buildPayload(
    findings: Finding[],
    config: Record<string, any>,
    options?: ExportPayloadOptions
  ): Record<string, any> {
    const title = options?.title || 'Soroban Guard Security Findings'
    const contractId = options?.contractId

    const severityCounts: Record<Severity, number> = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
      Info: 0,
    }

    for (const f of findings) {
      if (f.severity in severityCounts) {
        severityCounts[f.severity]++
      }
    }

    const summaryText = Object.entries(severityCounts)
      .filter(([, count]) => count > 0)
      .map(([sev, count]) => `${SEVERITY_EMOJI[sev as Severity]} *${sev}*: ${count}`)
      .join('  |  ')

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: title,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Total Findings:* ${findings.length}\n${summaryText}${contractId ? `\n*Contract:* \`${contractId}\`` : ''}${config.channel ? `\n*Target Channel:* ${config.channel}` : ''}`,
        },
      },
      { type: 'divider' },
    ]

    // Render individual findings (limit to top 15 to fit within Slack payload size limits)
    const displayFindings = findings.slice(0, 15)
    for (const finding of displayFindings) {
      const emoji = SEVERITY_EMOJI[finding.severity] || '🔍'
      let text = `${emoji} *[${finding.severity.toUpperCase()}] ${finding.check_name}*\n`
      text += `• *File:* \`${finding.file_path}:${finding.line}\`  |  *Function:* \`${finding.function_name}\`\n`
      text += `• *Description:* ${finding.description}`
      if (finding.remediation) {
        text += `\n• *Remediation:* ${finding.remediation}`
      }

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text,
        },
      })
    }

    if (findings.length > 15) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `_...and ${findings.length - 15} more finding(s) omitted for brevity._`,
          },
        ],
      })
    }

    // Include contract source snippet strictly on explicit opt-in
    if (options?.includeSource && options?.source) {
      const truncatedSource =
        options.source.length > 1000
          ? options.source.slice(0, 1000) + '\n... (truncated)'
          : options.source

      blocks.push(
        { type: 'divider' },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Contract Source Code Snippet (Opt-In Included):*\n\`\`\`${truncatedSource}\`\`\``,
          },
        }
      )
    }

    return { blocks }
  },

  parseErrorResponse(status: number, responseBody: string): string {
    const lowerBody = responseBody.toLowerCase()

    if (status === 404 || lowerBody.includes('invalid_token') || lowerBody.includes('no_service') || lowerBody.includes('channel_not_found')) {
      return 'Slack webhook URL is invalid or the target channel/webhook was deleted. Please verify your webhook URL.'
    }
    if (status === 403 || lowerBody.includes('action_prohibited')) {
      return 'Slack webhook request was forbidden. Check your Slack workspace app permissions.'
    }
    if (status === 429) {
      return 'Slack rate limit reached. Please wait a moment before trying again.'
    }
    if (status === 400 || lowerBody.includes('payload_too_large')) {
      return `Slack rejected notification payload: ${responseBody || 'Bad Request'}. Try unchecking contract source code inclusion or exporting fewer findings.`
    }

    return `Slack API error (HTTP ${status}): ${responseBody || 'Failed to post notification to Slack.'}`
  },
}
