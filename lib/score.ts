import type { Finding, Severity } from '@/types/findings'

/**
 * Score formula version — bumped when the algorithm changes so that
 * previously-stored scores can be distinguished from current ones.
 */
export const SCORE_VERSION = 2

const WEIGHTS: Record<Severity, number> = {
  Critical: 20,
  High: 15,
  Medium: 7,
  Low: 2,
  Info: 0,
}

/**
 * Calculates a security score (0-100) based on finding counts.
 *
 * Uses exponential decay so the score never bottoms out to a flat 0:
 *   score = round(100 * e^(-totalPenalty / 200))
 *
 * This preserves resolution at the low end — a contract with 5 Critical
 * findings (penalty 100 → score 61) is clearly distinguishable from one
 * with 50 Critical findings (penalty 1000 → score 7).
 *
 * Severity weights:
 *   Critical = 20, High = 15, Medium = 7, Low = 2, Info = 0
 *
 * A score of 100 indicates zero findings.
 */
export function calculateScore(findings: Finding[]): number {
  let penalty = 0
  for (const finding of findings) {
    penalty += WEIGHTS[finding.severity] || 0
  }

  return Math.round(100 * Math.exp(-penalty / 200))
}

/**
 * Returns the color class for a given score.
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-red-400'
}

/**
 * Returns the background color class for a given score.
 */
export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-500/5'
  if (score >= 50) return 'bg-amber-500/5'
  return 'bg-red-500/5'
}

/**
 * Returns the border color class for a given score.
 */
export function getScoreBorder(score: number): string {
  if (score >= 80) return 'border-green-500/20'
  if (score >= 50) return 'border-amber-500/20'
  return 'border-red-500/20'
}
