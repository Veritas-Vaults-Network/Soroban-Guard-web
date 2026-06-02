import { test, expect } from '@playwright/test'

const HISTORY_KEY = 'sg_history'
const SCHEDULE_KEY = 'sg_scheduled_scans'

test('add and remove scheduled scan from history', async ({ page }) => {
  // Pre-populate localStorage with a history entry
  await page.addInitScript(() => {
    const entry = [{ id: '1', date: new Date().toISOString(), source: 'GTEST-CONTRACT-ABC', findings: [{ check_name: 'sched-check', severity: 'Low', file_path: 'a.rs', line: 1, function_name: 'f', description: 'x' }] }]
    localStorage.setItem('sg_history', JSON.stringify(entry))
    localStorage.setItem('sg_scheduled_scans', JSON.stringify([]))
  })

  await page.goto('/history')

  // Ensure the entry is visible
  const item = page.locator('li', { hasText: 'GTEST-CONTRACT-ABC' }).first()
  await expect(item).toBeVisible()

  // Click Daily to schedule
  await item.locator('button:has-text("Daily")').click()

  // Verify schedule stored
  const schedules = await page.evaluate(() => JSON.parse(localStorage.getItem('sg_scheduled_scans') || '[]'))
  expect(Array.isArray(schedules)).toBeTruthy()
  expect(schedules.length).toBe(1)
  expect(schedules[0].contractId).toBe('GTEST-CONTRACT-ABC')

  // Click Never to remove
  await item.locator('button:has-text("Never")').click()
  const schedules2 = await page.evaluate(() => JSON.parse(localStorage.getItem('sg_scheduled_scans') || '[]'))
  expect(Array.isArray(schedules2)).toBeTruthy()
  expect(schedules2.length).toBe(0)
})
