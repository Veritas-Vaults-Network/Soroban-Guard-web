import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const mockFindings = JSON.stringify({
  findings: [
    {
      check_name: 'unchecked-auth',
      severity: 'Critical',
      file_path: 'src/lib.rs',
      line: 42,
      function_name: 'transfer',
      description: 'Authorization is not verified before executing privileged operation.',
      remediation: 'Require require_auth() before mutating balances.',
    },
    {
      check_name: 'integer-overflow',
      severity: 'Medium',
      file_path: 'src/lib.rs',
      line: 85,
      function_name: 'add_balance',
      description: 'Integer arithmetic may overflow without bounds checking.',
    },
  ],
})

// Skip the first-visit splash screen and onboarding tour overlays — they're
// unrelated to contrast auditing and their animated backdrops intercept clicks.
function skipOnboarding(page: Page) {
  return page.addInitScript(`
    (() => {
      sessionStorage.setItem('sg_splash_seen', '1');
      localStorage.setItem('sg_tour_seen', '1');
    })();
  `)
}

function mockScanFetch(page: Page) {
  return page.addInitScript(`
    (() => {
      if (!navigator.clipboard) {
        navigator.clipboard = { writeText: () => Promise.resolve(), readText: () => Promise.resolve('') };
      }
      const originalFetch = window.fetch;
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input.url;
        if (url.includes('/scan') && init?.method === 'POST') {
          return new Response(JSON.stringify(${mockFindings}), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return originalFetch(input, init);
      };
    })();
  `)
}

// Only the color-contrast rule is asserted here — this suite is a targeted
// regression guard for the WCAG AA contrast audit, not a full a11y sweep.
async function expectNoContrastViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
}

test.describe('WCAG AA color contrast', () => {
  // The app now respects OS color-scheme on first load (#516). Playwright's
  // default browser context is light, so without this the suite would audit
  // the light theme instead of the dark theme it's meant to guard.
  test.use({ colorScheme: 'dark' })

  test('home page (dark theme default)', async ({ page }) => {
    await skipOnboarding(page)
    await page.goto('/')
    await expect(page.locator('text=Find vulnerabilities')).toBeVisible()
    await expectNoContrastViolations(page)
  })

  test('results page with findings', async ({ page }) => {
    await skipOnboarding(page)
    await mockScanFetch(page)
    await page.goto('/')
    await page.locator('textarea').first().fill('pub fn transfer() {}')
    await page.locator('button:has-text("Scan Contract")').click()
    await page.waitForURL(/\/results/)
    await expect(page.locator('text=unchecked-auth:visible').first()).toBeVisible({ timeout: 15000 })

    await expectNoContrastViolations(page)
  })

  test('notification modal (placeholder text, focus states)', async ({ page }) => {
    await skipOnboarding(page)
    await mockScanFetch(page)
    await page.goto('/')
    await page.locator('textarea').first().fill('pub fn transfer() {}')
    await page.locator('button:has-text("Scan Contract")').click()
    await page.waitForURL(/\/results/)

    await page.locator('button:has-text("Notify Discord")').click()
    const webhookInput = page.locator('input[placeholder="Discord Webhook URL"]')
    await expect(webhookInput).toBeVisible()
    await webhookInput.focus()

    await expectNoContrastViolations(page)
  })

  test('history page (empty state)', async ({ page }) => {
    await skipOnboarding(page)
    await page.goto('/history')
    await expectNoContrastViolations(page)
  })
})
