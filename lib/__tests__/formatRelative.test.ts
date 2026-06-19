import { formatRelative } from '../formatRelative'

const now = Date.now()

function ts(msAgo: number): number {
  return now - msAgo
}

describe('formatRelative', () => {
  it('returns "just now" for < 60 seconds', () => {
    expect(formatRelative(ts(30_000))).toBe('just now')
    expect(formatRelative(ts(0))).toBe('just now')
  })

  it('returns "1 minute ago" for exactly 1 minute', () => {
    expect(formatRelative(ts(60_000))).toBe('1 minute ago')
  })

  it('returns plural minutes for > 1 minute and < 1 hour', () => {
    expect(formatRelative(ts(5 * 60_000))).toBe('5 minutes ago')
    expect(formatRelative(ts(59 * 60_000))).toBe('59 minutes ago')
  })

  it('returns "1 hour ago" for exactly 1 hour', () => {
    expect(formatRelative(ts(60 * 60_000))).toBe('1 hour ago')
  })

  it('returns plural hours for > 1 hour and < 1 day', () => {
    expect(formatRelative(ts(2 * 60 * 60_000))).toBe('2 hours ago')
    expect(formatRelative(ts(23 * 60 * 60_000))).toBe('23 hours ago')
  })

  it('returns "1 day ago" for exactly 1 day', () => {
    expect(formatRelative(ts(24 * 60 * 60_000))).toBe('1 day ago')
  })

  it('returns plural days for > 1 day and < 30 days', () => {
    expect(formatRelative(ts(2 * 24 * 60 * 60_000))).toBe('2 days ago')
    expect(formatRelative(ts(29 * 24 * 60 * 60_000))).toBe('29 days ago')
  })

  it('returns "1 month ago" for exactly 30 days', () => {
    expect(formatRelative(ts(30 * 24 * 60 * 60_000))).toBe('1 month ago')
  })

  it('returns plural months for > 1 month and < 1 year', () => {
    expect(formatRelative(ts(60 * 24 * 60 * 60_000))).toBe('2 months ago')
    expect(formatRelative(ts(11 * 30 * 24 * 60 * 60_000))).toBe('11 months ago')
  })

  it('returns "1 year ago" for exactly 12 months', () => {
    expect(formatRelative(ts(12 * 30 * 24 * 60 * 60_000))).toBe('1 year ago')
  })

  it('returns plural years for > 1 year', () => {
    expect(formatRelative(ts(24 * 30 * 24 * 60 * 60_000))).toBe('2 years ago')
  })
})
