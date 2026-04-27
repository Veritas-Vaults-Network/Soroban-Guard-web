import type { Finding } from '@/types/findings'

const TELEGRAM_API = 'https://api.telegram.org'

export async function postToTelegram(
  botToken: string,
  chatId: string,
  findings: Finding[],
  source: string,
): Promise<void> {
  const counts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  for (const f of findings) counts[f.severity] = (counts[f.severity] ?? 0) + 1

  const top3 = findings
    .sort((a, b) => {
      const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4)
    })
    .slice(0, 3)

  const lines = [
    `🛡 *Soroban Guard Scan Results*`,
    `Source: \`${source}\``,
    '',
    `*Critical:* ${counts.Critical}  *High:* ${counts.High}  *Medium:* ${counts.Medium}  *Low:* ${counts.Low}`,
    `*Total findings:* ${findings.length}`,
  ]

  if (top3.length > 0) {
    lines.push('', '*Top findings:*')
    for (const f of top3) {
      lines.push(`• *[${f.severity}]* ${f.check_name} — \`${f.function_name}\``)
    }
  }

  const text = lines.join('\n')

  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Telegram API error ${res.status}: ${body}`)
  }
}
