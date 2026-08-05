import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const WcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

test('has no serious or critical WCAG A/AA violations on the main surface', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('APEXPAD')).toBeVisible()
  const results = await new AxeBuilder({ page }).withTags(WcagTags).analyze()
  const blockers = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
  expect(blockers, JSON.stringify(blockers, null, 2)).toEqual([])
})

test('has no serious or critical WCAG A/AA violations with the command palette open', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Command palette' }).click()
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
  // Let the entrance animation fully settle so axe samples final colors, not mid-fade alpha.
  await page.waitForTimeout(350)
  const results = await new AxeBuilder({ page }).withTags(WcagTags).analyze()
  const blockers = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
  expect(blockers, JSON.stringify(blockers, null, 2)).toEqual([])
})

for (const surface of [
  { trigger: 'Text tools', dialog: 'Text tools' },
  { trigger: 'Create snapshot', dialog: 'Snapshot history' },
  { trigger: 'Encrypted sharing', dialog: 'Encrypted sharing' },
  { trigger: 'Compare latest snapshot', dialog: 'Latest snapshot diff' },
]) {
  test(`has no serious or critical WCAG A/AA violations with the ${surface.dialog} open`, async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: surface.trigger }).click()
    await expect(page.getByRole('dialog', { name: surface.dialog })).toBeVisible()
    await page.waitForTimeout(350)
    const results = await new AxeBuilder({ page }).withTags(WcagTags).analyze()
    const blockers = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    expect(blockers, JSON.stringify(blockers, null, 2)).toEqual([])
  })
}
