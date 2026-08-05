import { expect, test } from '@playwright/test'

test('autofocuses the editor for instant capture', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('APEXPAD')).toBeVisible()
  await expect(page.locator('.cm-content')).toBeFocused({ timeout: 3000 })
  await page.keyboard.type('instant capture works')
  await expect(page.locator('.cm-content')).toContainText('instant capture works')
})

test('opens a fresh note from the quick-capture query', async ({ page }) => {
  // Cold load with ?new=1 should create a second blank note (seed + new).
  await page.goto('/?new=1')
  await expect(page.getByText('APEXPAD')).toBeVisible()
  await expect(page.locator('nav[aria-label="Open notes"] > div')).toHaveCount(2, { timeout: 5000 })
  await expect(page).not.toHaveURL(/new=1/)
  await expect(page.locator('.cm-content')).toBeFocused({ timeout: 3000 })
  await page.keyboard.type('fresh note from shortcut')
  await expect(page.locator('.cm-content')).toContainText('fresh note from shortcut')
})

test('keeps typed content when saving is flushed on reload', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.cm-content')).toBeFocused({ timeout: 3000 })
  await page.keyboard.type('flush-on-leave content')
  // Crash mirror writes synchronously on setContent; reload immediately.
  await page.waitForTimeout(50)
  await page.reload()
  await expect(page.locator('.cm-content')).toContainText('flush-on-leave content')
})
