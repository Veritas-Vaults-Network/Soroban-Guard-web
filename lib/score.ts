import type { Finding, Severity } from '@/types/findings'

/**
 * Calculates a security score (0-100) based on finding counts.
 * 
 * Formula: score = max(0, 100 - (Critical*20 + High*15 + Medium*7 + Low*2))
 * 
 * - Critical findings penalize 20 points each
 * - High findings penalize 15 points each
 * - Medium findings penalize 7 points each
 * - Low findings penalize 2 points each
 * 
 * A score of 100 indicates zero findings.
 */
export function calculateScore(findings: Finding[]): number {
  const weights: Record<Severity, number> = {
    Critical: 20,
    High: 15,
    Medium: 7,
    Low: 2,
  }
  
  let penalty = 0
  for (const finding of findings) {
    penalty += weights[finding.severity] || 0
  }
  
  return Math.max(0, 100 - penalty)
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
