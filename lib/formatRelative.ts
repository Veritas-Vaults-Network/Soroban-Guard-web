/**
 * Produce a human-readable relative time string from a timestamp.
 * Hand-rolled to avoid adding a date-fns dependency.
 */
export function formatRelative(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const diffSecs = Math.floor(diffMs / 1000)

  if (diffSecs < 60) return 'just now'

  const diffMins = Math.floor(diffSecs / 60)
  if (diffMins < 60) return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`

  const diffYears = Math.floor(diffMonths / 12)
  return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`
}
