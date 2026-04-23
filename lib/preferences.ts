/**
 * Utility functions for managing user preferences in localStorage
 */

const STORAGE_KEYS = {
  PAGE_SIZE: 'soroban-guard-page-size',
} as const

export type PageSize = 10 | 20 | 50 | 'all'

/**
 * Get the user's preferred page size from localStorage
 * @returns The stored page size or 20 as default
 */
export function getPageSize(): PageSize {
  if (typeof window === 'undefined') return 20

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PAGE_SIZE)
    if (!stored) return 20

    const parsed = JSON.parse(stored)
    const validSizes: PageSize[] = [10, 20, 50, 'all']

    return validSizes.includes(parsed) ? parsed : 20
  } catch {
    return 20
  }
}

/**
 * Set the user's preferred page size in localStorage
 * @param size The page size to store
 */
export function setPageSize(size: PageSize): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEYS.PAGE_SIZE, JSON.stringify(size))
  } catch (error) {
    console.warn('Failed to save page size preference:', error)
  }
}

/**
 * Get the actual numeric page size for pagination calculations
 * @param size The page size preference
 * @returns The numeric page size, or undefined for 'all'
 */
export function getNumericPageSize(size: PageSize): number | undefined {
  return size === 'all' ? undefined : size
}