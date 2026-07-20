import { test, expect } from '@playwright/test'

const mockFindings = JSON.stringify({ findings: [] })

function mockScanFetch(page: import('@playwright/test').Page) {
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

test.describe('Attestation Flow', () => {
  test('successfully completes attestation flow', async ({ page }) => {
    // Mock environment variable to enable attestation
    await page.addInitScript(() => {
      // @ts-ignore
      window.process = { env: { NEXT_PUBLIC_FEATURE_ATTESTATION: 'true' } }
    })

    // Mock Freighter
    await page.addInitScript(() => {
      (window as any).freighter = {
        isConnected: async () => true,
        getPublicKey: async () => 'GTESTPUBLICKEYABCDEFGHIJKLMNOP',
        getNetworkDetails: async () => ({
          networkPassphrase: 'Test SDF Network ; September 2015',
          networkUrl: '',
        }),
        signTransaction: async (xdr: string) => `signed_${xdr}`,
      }
    })

    // Mock Horizon and Soroban RPC
    await page.route('https://horizon-testnet.stellar.org/accounts/*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          sequence: '1234567890',
        },
      })
    })

    await page.route('https://soroban-testnet.stellar.org/', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          jsonrpc: '2.0',
          id: 1,
          result: {
            hash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          },
        },
      })
    })

    await mockScanFetch(page)
    await page.goto('/')

    // Fill and scan to get to results page
    const codeInput = page.locator('textarea').first()
    await codeInput.fill('pub fn transfer() {}')
    await page.locator('button:has-text("Scan Contract")').click()
    await page.waitForURL(/\/results/)

    // Connect wallet
    const connectButton = page.locator('button:has-text("Connect Freighter")')
    await expect(connectButton).toBeVisible()
    await connectButton.click()
    await expect(page.locator('button:has-text("Disconnect")')).toBeVisible()

    // Attest
    const attestButton = page.locator('button:has-text("Attest on Stellar")')
    await expect(attestButton).toBeVisible()
    await attestButton.click()

    // Wait for success and check explorer link
    await expect(page.locator('a:has-text("View on Stellar.expert")')).toBeVisible()
    await expect(page.locator('text=Attestation successful!')).toBeVisible()
  })

  test('handles failed attestation (signature rejected)', async ({ page }) => {
    // Mock environment variable to enable attestation
    await page.addInitScript(() => {
      // @ts-ignore
      window.process = { env: { NEXT_PUBLIC_FEATURE_ATTESTATION: 'true' } }
    })

    // Mock Freighter that rejects signature
    await page.addInitScript(() => {
      (window as any).freighter = {
        isConnected: async () => true,
        getPublicKey: async () => 'GTESTPUBLICKEYABCDEFGHIJKLMNOP',
        getNetworkDetails: async () => ({
          networkPassphrase: 'Test SDF Network ; September 2015',
          networkUrl: '',
        }),
        signTransaction: async () => { throw new Error('User rejected') },
      }
    })

    // Mock Horizon
    await page.route('https://horizon-testnet.stellar.org/accounts/*', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          sequence: '1234567890',
        },
      })
    })

    await mockScanFetch(page)
    await page.goto('/')

    const codeInput = page.locator('textarea').first()
    await codeInput.fill('pub fn transfer() {}')
    await page.locator('button:has-text("Scan Contract")').click()
    await page.waitForURL(/\/results/)

    const connectButton = page.locator('button:has-text("Connect Freighter")')
    await connectButton.click()

    const attestButton = page.locator('button:has-text("Attest on Stellar")')
    await attestButton.click()

    await expect(page.locator('text=Transaction was rejected or Freighter is not available')).toBeVisible()
  })
})
