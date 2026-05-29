import { test, expect } from '@playwright/test'

const STORAGE_KEY = 'sg_scan_history'

const records = [
  {
    publicKey: 'GPUB1',
    contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
    network: 'testnet',
    scannedAt: '2024-01-01T10:00:00.000Z',
    findingCount: 2,
    highCount: 1,
    mediumCount: 1,
    lowCount: 0,
  },
  {
    publicKey: 'GPUB1',
    contractId: 'CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    network: 'mainnet',
    scannedAt: '2024-01-02T10:00:00.000Z', // newer
    findingCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
  },
]

async function seedHistory(page: import('@playwright/test').Page) {
  await page.addInitScript(
    ({ key, data }) => localStorage.setItem(key, JSON.stringify(data)),
    { key: STORAGE_KEY, data: records },
  )
}

test.describe('/history page', () => {
  test('renders records sorted newest first', async ({ page }) => {
    await seedHistory(page)
    await page.goto('/history')

    const rows = page.locator('[class*="rounded-xl"][class*="border"]').filter({ hasText: 'Re-scan' })
    await expect(rows).toHaveCount(2)

    // First row should be the newer mainnet record (CBBB...)
    await expect(rows.nth(0)).toContainText('CBBB')
    await expect(rows.nth(1)).toContainText('CAAA')
  })

  test('re-scan navigates to / with source pre-filled', async ({ page }) => {
    await seedHistory(page)
    await page.goto('/history')

    await page.locator('button:has-text("Re-scan")').first().click()

    await page.waitForURL(/\/\?source=/)
    expect(page.url()).toContain('source=')
  })

  test('network filter hides non-matching records', async ({ page }) => {
    await seedHistory(page)
    await page.goto('/history')

    await page.locator('button:has-text("testnet")').click()

    const rows = page.locator('[class*="rounded-xl"][class*="border"]').filter({ hasText: 'Re-scan' })
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText('CAAA')
  })

  test('clear history removes all records and shows empty state', async ({ page }) => {
    await seedHistory(page)
    await page.goto('/history')

    await page.locator('button:has-text("Clear history")').click()
    await page.locator('button:has-text("Yes, clear")').click()

    await expect(page.locator('text=No scans yet')).toBeVisible()
    await expect(page.locator('button:has-text("Re-scan")')).toHaveCount(0)
  })

  test('empty state renders when no history exists', async ({ page }) => {
    await page.goto('/history')
    await expect(page.locator('text=No scans yet — go scan a contract!')).toBeVisible()
    await expect(page.locator('a:has-text("Scan a contract")')).toBeVisible()
  })
})
