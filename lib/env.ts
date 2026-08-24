/**
 * Validates required environment variables at startup.
 * Logs a warning for any that are missing or malformed.
 * Safe to call in both server and client contexts.
 */
export function validateEnv(): void {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  if (!apiUrl) {
    console.warn(
      '[Soroban Guard] NEXT_PUBLIC_API_URL is not set. Defaulting to http://localhost:3001. ' +
        'Set this variable in .env.local for production use.',
    )
    return
  }

  try {
    new URL(apiUrl)
  } catch {
    console.warn(
      `[Soroban Guard] NEXT_PUBLIC_API_URL is malformed: "${apiUrl}". ` +
        'Expected a valid URL (e.g. https://api.example.com).',
    )
  }
}

/**
 * Client-side reachability check for the scanner backend.
 * Returns a user-facing warning string if the backend appears unreachable,
 * or null if it is healthy.
 */
export async function checkBackendReachability(): Promise<string | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  if (!apiUrl) {
    return 'NEXT_PUBLIC_API_URL is not configured. The scanner backend is unreachable.'
  }

  try {
    new URL(apiUrl)
  } catch {
    return `NEXT_PUBLIC_API_URL is malformed: "${apiUrl}". The scanner backend is unreachable.`
  }

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, '')}/health`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      return `The scanner backend responded with status ${res.status}.`
    }
  } catch {
    return 'The scanner backend is unavailable.'
  }

  return null
}
