import { test, expect } from '@playwright/test'

const mockFindings = [
  {
    check_name: 'unchecked-auth',
    severity: 'High',
    file_path: 'src/lib.rs',
    line: 42,
    function_name: 'transfer',
    description: 'Authorization is not verified before executing privileged operation.',
  },
  {
    check_name: 'integer-overflow',
    severity: 'Medium',
    file_path: 'src/lib.rs',
    line: 85,
    function_name: 'add_balance',
    description: 'Integer arithmetic may overflow without bounds checking.',
  },
]

test.describe('Soroban Guard E2E Smoke Tests', () => {
  test('home page loads with scan form visible', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Soroban Guard/)
    await expect(page.locator('text=Find vulnerabilities')).toBeVisible()
    await expect(page.locator('button:has-text("Scan Contract")')).toBeVisible()
  })

  test('scan flow with mocked API', async ({ page }) => {
    // Mock the /scan API endpoint
    await page.route('**/api/scan', route => {
      route.abort('blockedbyclient')
    })

    // Intercept POST /scan and return mock findings
    await page.route('**/scan', route => {
      if (route.request().method() === 'POST') {
        route.continue()
      }
    })

    // Use context API to mock fetch
    await page.addInitScript(() => {
      const originalFetch = window.fetch
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : (input as Request).url
        if (url.includes('/scan') && init?.method === 'POST') {
          return new Response(JSON.stringify({ findings: mockFindings }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return originalFetch(input, init)
      }
    })

    await page.goto('/')

    // Paste code
    const codeInput = page.locator('textarea').first()
    await codeInput.fill('pub fn transfer() {}')

    // Click scan button
    await page.locator('button:has-text("Scan Contract")').click()

    // Wait for navigation to results page
    await page.waitForURL(/\/results/)
    await expect(page).toHaveURL(/\/results/)

    // Verify findings are displayed
    await expect(page.locator('text=2 findings detected')).toBeVisible()
    await expect(page.locator('text=unchecked-auth')).toBeVisible()
    await expect(page.locator('text=integer-overflow')).toBeVisible()

    // Verify severity badges
    await expect(page.locator('text=High').first()).toBeVisible()
    await expect(page.locator('text=Medium')).toBeVisible()
  })

  test('results page renders findings with severity badges', async ({ page }) => {
    // Mock fetch for results page
    await page.addInitScript(() => {
      const originalFetch = window.fetch
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : (input as Request).url
        if (url.includes('/scan') && init?.method === 'POST') {
          return new Response(JSON.stringify({ findings: mockFindings }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return originalFetch(input, init)
      }
    })

    await page.goto('/')
    const codeInput = page.locator('textarea').first()
    await codeInput.fill('pub fn test() {}')
    await page.locator('button:has-text("Scan Contract")').click()
    await page.waitForURL(/\/results/)

    // Verify summary cards
    await expect(page.locator('text=Total Findings')).toBeVisible()
    await expect(page.locator('text=2')).toBeVisible()

    // Verify findings table
    const table = page.locator('button').filter({ has: page.locator('text=unchecked-auth') })
    await expect(table).toBeVisible()

    // Click to expand finding
    await table.first().click()
    await expect(page.locator('text=Authorization is not verified')).toBeVisible()
  })

  test('scan another contract button returns to home', async ({ page }) => {
    // Mock fetch
    await page.addInitScript(() => {
      const originalFetch = window.fetch
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : (input as Request).url
        if (url.includes('/scan') && init?.method === 'POST') {
          return new Response(JSON.stringify({ findings: mockFindings }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return originalFetch(input, init)
      }
    })

    await page.goto('/')
    const codeInput = page.locator('textarea').first()
    await codeInput.fill('pub fn test() {}')
    await page.locator('button:has-text("Scan Contract")').click()
    await page.waitForURL(/\/results/)

    // Click "Scan another contract"
    await page.locator('button:has-text("Scan another contract")').click()
    await page.waitForURL('/')
    await expect(page).toHaveURL('/')
    await expect(page.locator('text=Find vulnerabilities')).toBeVisible()
  })

  test('share results button copies URL', async ({ page, context }) => {
    // Grant clipboard permission
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    // Mock fetch
    await page.addInitScript(() => {
      const originalFetch = window.fetch
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : (input as Request).url
        if (url.includes('/scan') && init?.method === 'POST') {
          return new Response(JSON.stringify({ findings: mockFindings }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return originalFetch(input, init)
      }
    })

    await page.goto('/')
    const codeInput = page.locator('textarea').first()
    await codeInput.fill('pub fn test() {}')
    await page.locator('button:has-text("Scan Contract")').click()
    await page.waitForURL(/\/results/)

    // Click share button
    const shareButton = page.locator('button:has-text("Share results")')
    await expect(shareButton).toBeVisible()
    await shareButton.click()

    // Verify button shows "Copied"
    await expect(page.locator('button:has-text("✓ Copied")')).toBeVisible()
  })
})
