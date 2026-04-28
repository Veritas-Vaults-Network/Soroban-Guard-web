import type { Finding, Severity } from '@/types/findings'

interface LinearIssueCreateResponse {
  data?: {
    issueCreate?: {
      success: boolean
      issue?: {
        url?: string
      }
    }
  }
  errors?: Array<{ message: string }>
}

const PRIORITY_BY_SEVERITY: Record<Severity, number> = {
  Critical: 1,
  High: 1,
  Medium: 3,
  Low: 4,
}

function findingDescription(finding: Finding): string {
  return [
    `Severity: ${finding.severity}`,
    `Check: ${finding.check_name}`,
    `Function: ${finding.function_name}`,
    `File: ${finding.file_path}`,
    `Line: ${finding.line}`,
    '',
    finding.description,
    ...(finding.remediation ? ['', 'Remediation:', finding.remediation] : []),
  ].join('\n')
}

export async function createLinearIssue(
  apiKey: string,
  teamId: string,
  finding: Finding,
): Promise<string> {
  const response = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        mutation CreateSorobanGuardIssue($input: IssueCreateInput!) {
          issueCreate(input: $input) {
            success
            issue {
              url
            }
          }
        }
      `,
      variables: {
        input: {
          teamId,
          title: `[${finding.severity}] ${finding.check_name} in ${finding.function_name}`,
          description: findingDescription(finding),
          priority: PRIORITY_BY_SEVERITY[finding.severity],
        },
      },
    }),
  })

  const data = (await response.json().catch(() => ({}))) as LinearIssueCreateResponse
  if (!response.ok || data.errors?.length || !data.data?.issueCreate?.success) {
    throw new Error(data.errors?.[0]?.message ?? `Linear API error ${response.status}`)
  }

  return data.data.issueCreate.issue?.url ?? 'Created Linear issue'
}
