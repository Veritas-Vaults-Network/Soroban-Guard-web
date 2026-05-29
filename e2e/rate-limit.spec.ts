import { test, expect } from '@playwright/test'

/**
 * Helpers to mock fetch with a given response factory.
 * The factory receives the call count so tests can simulate
 * 429 on the first call and 200 on the retry.
 */
function mockFetch(
  page: import('@playwright/test').Page,
  factory: (callCount: number) => { status: number; body: string; headers?: Record<string, string> },
) {
  return page.addInitScript(`
    (() => {
      let callCount = 0;
      const originalFetch = window.fetch;
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input.url;
        if (url.includes('/scan') && init?.method === 'POST') {
          const n = callCount++;
          const factory = ${factory.toString()};
          const { status, body, headers = {} } = factory(n);
          return new Response(body, { status, headers: { 'Content-Type': 'application/json', ...headers } });
        }
        return originalFetch(input, init);
      };
    })();
  `)
}

const mockFindings = JSON.stringify({ findings: [] })

test.describe('Rate limit (429) handling', () => {
  test('shows countdown banner when API returns 429', async ({ page }) => {
    await mockFetch(page, () => ({
      status: 429,
      body: 'Rate limited',
      headers: { 'Retry-After': '5' },
    }))

    await page.goto('/')
    await page.locator('textarea').first().fill('pub fn test() {}')
    await page.locator('button:has-text("Scan Contract")').click()

    await expect(page.locator('text=Rate limited — retrying automatically in')).toBeVisible()
  })

  test('scan button is disabled during countdown', async ({ page }) => {
    await mockFetch(page, () => ({
      status: 429,
      body: 'Rate limited',
      headers: { 'Retry-After': '10' },
    }))

    await page.goto('/')
    await page.locator('textarea').first().fill('pub fn test() {}')
    await page.locator('button:has-text("Scan Contract")').click()

    // Button should now show the countdown and be disabled
    const btn = page.locator('button:has-text("Rate limited — retry in")')
    await expect(btn).toBeVisible()
    await expect(btn).toBeDisabled()
  })

  test('auto-retries exactly once when countdown reaches zero', async ({ page }) => {
    // First call → 429 with 2s retry, second call → 200
    await mockFetch(page, (n) =>
      n === 0
        ? { status: 429, body: 'Rate limited', headers: { 'Retry-After': '2' } }
        : { status: 200, body: mockFindings },
    )

    await page.goto('/')
    await page.locator('textarea').first().fill('pub fn test() {}')
    await page.locator('button:has-text("Scan Contract")').click()

    // Countdown banner appears
    await expect(page.locator('text=Rate limited — retrying automatically in')).toBeVisible()

    // After countdown expires the retry fires and navigates to /results
    await page.waitForURL(/\/results/, { timeout: 10_000 })
    await expect(page).toHaveURL(/\/results/)
  })

  test('non-429 errors still show generic error message', async ({ page }) => {
    await mockFetch(page, () => ({
      status: 500,
      body: 'Internal Server Error',
    }))

    await page.goto('/')
    await page.locator('textarea').first().fill('pub fn test() {}')
    await page.locator('button:has-text("Scan Contract")').click()

    // Generic error banner should appear, no countdown
    await expect(page.locator('text=Internal Server Error')).toBeVisible()
    await expect(page.locator('text=Rate limited')).not.toBeVisible()
  })
})
