import type { Finding } from '@/types/findings'

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'B60205',
  High: 'D93F0B',
  Medium: 'E4E669',
  Low: '0075CA',
}

async function ensureLabel(owner: string, repo: string, token: string, severity: string) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }
  // Create label — ignore 422 (already exists)
  await fetch(`https://api.github.com/repos/${owner}/${repo}/labels`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: severity, color: SEVERITY_COLORS[severity] ?? 'CCCCCC' }),
  })
}

export async function createIssuesForFindings(
  findings: Finding[],
  owner: string,
  repo: string,
  token: string,
  onProgress: (done: number, total: number) => void,
): Promise<string[]> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }

  // Pre-create severity labels (best-effort)
  const severities = [...new Set(findings.map(f => f.severity))]
  await Promise.all(severities.map(s => ensureLabel(owner, repo, token, s)))

  const urls: string[] = []
  for (let i = 0; i < findings.length; i++) {
    const f = findings[i]
    const body = [
      `**Severity:** ${f.severity}`,
      `**File:** \`${f.file_path}\` — line ${f.line}`,
      `**Function:** \`${f.function_name}\``,
      '',
      f.description,
      ...(f.remediation ? ['', '**Remediation:**', f.remediation] : []),
    ].join('\n')

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: `[${f.severity}] ${f.check_name}`, body, labels: [f.severity] }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message ?? `GitHub API error ${res.status}`)
    }
    const data = await res.json()
    urls.push(data.html_url as string)
    onProgress(i + 1, findings.length)
  }
  return urls
}
