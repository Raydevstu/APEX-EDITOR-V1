import { expect, test } from '@playwright/test'

test('finds notes by body text from the command palette', async ({ page }) => {
  await page.goto('/')
  const editor = page.locator('.cm-content')
  await expect(editor).toBeVisible()

  await editor.click()
  await page.keyboard.type('alpha unique-search-token body')
  await page.waitForTimeout(200)

  await page.getByRole('button', { name: /create new tab/i }).click()
  await expect(page.locator('nav[aria-label="Open notes"] > div')).toHaveCount(2)
  await page.locator('.cm-content').click()
  await page.keyboard.type('beta other note content')
  await page.waitForTimeout(200)

  await page.getByTitle('Command palette').click()
  const dialog = page.getByRole('dialog', { name: 'Command palette' })
  await expect(dialog).toBeVisible()
  const input = page.getByLabel('Search notes and commands')
  await input.fill('unique-search-token')
  await expect(dialog.getByRole('option').first()).toBeVisible()
  await input.press('Enter')
  await expect(dialog).toBeHidden()
  await expect(page.locator('.cm-content')).toContainText('unique-search-token')
})

test('filters commands and supports keyboard selection', async ({ page }) => {
  await page.goto('/')
  await page.getByTitle('Command palette').click()
  const dialog = page.getByRole('dialog', { name: 'Command palette' })
  await expect(dialog).toBeVisible()
  const input = page.getByLabel('Search notes and commands')
  await input.fill('snapshot')
  await expect(dialog.getByRole('option', { name: /Open snapshots/i })).toBeVisible()
  await input.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Snapshot history' })).toBeVisible()
})
