import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const WcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function scanClean(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).withTags(WcagTags).analyze()
  const blockers = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
  expect(blockers, JSON.stringify(blockers, null, 2)).toEqual([])
}

test('has no serious or critical WCAG A/AA violations on the light main surface', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('apexpad-theme', 'light'))
  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.getByText('APEXPAD')).toBeVisible()
  await scanClean(page)
})

test('has no serious or critical WCAG A/AA violations on light share modal after settle', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('apexpad-theme', 'light'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Encrypted sharing' }).click()
  await expect(page.getByRole('dialog', { name: 'Encrypted sharing' })).toBeVisible()
  await page.waitForTimeout(350)
  await scanClean(page)
})
