import { test, expect } from '@playwright/test'

const STORAGE_KEY = 'sg_history'

// Newest first — matches the order stored by addScanRecord
const records = [
  {
    id: '2',
    date: '2024-01-02T10:00:00.000Z', // newer
    source: 'CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    findings: [{ check_name: 'unchecked-auth', severity: 'High', file_path: 'src/lib.rs', line: 10, function_name: 'transfer', description: '' }],
  },
  {
    id: '1',
    date: '2024-01-01T10:00:00.000Z', // older
    source: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
    findings: [],
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

    const rows = page.locator('li').filter({ hasText: 'CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' })
    await expect(rows).toHaveCount(1)
  })

  test('renders all entries when no date filter is active', async ({ page }) => {
    await seedHistory(page)
    await page.goto('/history')

    const items = page.locator('ul[class*="space-y"] li')
    await expect(items).toHaveCount(2)
  })

  test('clear history removes all records and shows empty state', async ({ page }) => {
    await seedHistory(page)
    await page.goto('/history')

    await page.locator('button:has-text("Clear history")').click()
    await page.locator('button:has-text("Yes, clear")').click()

    await expect(page.locator('text=No scan history yet')).toBeVisible()
  })

  test('empty state renders when no history exists', async ({ page }) => {
    await page.goto('/history')
    await expect(page.locator('text=No scan history yet')).toBeVisible()
    await expect(page.locator('a:has-text("Run first scan")')).toBeVisible()
  })
})
