import { expect, test } from '@playwright/test'

test('opens the editor shell and creates a second tab', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('APEXPAD')).toBeVisible()
  await page.getByRole('button', { name: /create new tab/i }).click()
  await expect(page.locator('nav[aria-label="Open notes"] > div')).toHaveCount(2)
})

test('remains usable at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByText('APEXPAD')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
  await page.getByRole('button', { name: /create new tab/i }).click()
  await expect(page.locator('nav[aria-label="Open notes"] > div')).toHaveCount(2)
})

// Playwright's WebKit driver throws "WebKit encountered an internal error"
// when reloading while the context is offline (engine limitation). Offline
// reload is verified in Chromium and Firefox.
test('loads the cached app shell while offline after first visit', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit cannot reload offline pages (engine limitation)')
  await page.goto('/')
  await expect(page.getByText('APEXPAD')).toBeVisible()
  await page.waitForTimeout(500)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText('APEXPAD')).toBeVisible()
  await expect(page.getByRole('button', { name: /create new tab/i })).toBeVisible()
})

test('registers an installable PWA and restores persisted content offline', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit cannot reload offline pages (engine limitation)')
  await page.goto('/')
  await expect(page.getByText('APEXPAD')).toBeVisible()
  const pwa = await page.evaluate(async () => {
    const manifest = document.querySelector('link[rel="manifest"]')?.getAttribute('href')
    const registration = await navigator.serviceWorker.ready
    return { manifest, active: Boolean(registration.active), scope: registration.scope }
  })
  expect(pwa.manifest).toContain('manifest.webmanifest')
  expect(pwa.active).toBe(true)
  expect(pwa.scope).toContain('127.0.0.1:4173')

  const editor = page.locator('.cm-content')
  await editor.click()
  await page.keyboard.type('offline recovery note')
  await page.waitForTimeout(700)
  await context.setOffline(true)
  await page.reload()
  await expect(editor).toContainText('offline recovery note')
})

test('persists edited content after reload', async ({ page }) => {
  await page.goto('/')
  const editor = page.locator('.cm-content')
  await editor.click()
  await page.keyboard.type('release note')
  await page.waitForTimeout(700)
  await page.reload()
  await expect(page.locator('.cm-content')).toContainText('release note')
})

test('creates, compares, restores, and closes snapshot history', async ({ page }) => {
  await page.goto('/')
  const editor = page.locator('.cm-content')
  await editor.click()
  await page.keyboard.type('snapshot baseline')
  await page.getByRole('button', { name: 'Create snapshot' }).click()

  const snapshotDialog = page.getByRole('dialog', { name: 'Snapshot history' })
  await expect(snapshotDialog).toBeVisible()
  await expect(snapshotDialog.getByRole('button', { name: 'Restore' })).toHaveCount(1)
  await snapshotDialog.getByRole('button', { name: 'Close snapshots' }).click()
  await expect(snapshotDialog).toBeHidden()

  await editor.click()
  await page.keyboard.type(' changed')
  await page.getByRole('button', { name: 'Compare latest snapshot' }).click()
  const diffDialog = page.getByRole('dialog')
  await expect(diffDialog.getByText('- snapshot baseline')).toBeVisible()
  await expect(diffDialog.getByText('+ snapshot baseline changed')).toBeVisible()
  await diffDialog.getByRole('button', { name: 'Close diff' }).click()

  await page.getByRole('button', { name: 'Create snapshot' }).click()
  await expect(snapshotDialog.getByRole('button', { name: 'Restore' })).toHaveCount(2)
  await snapshotDialog.getByRole('button', { name: 'Restore' }).first().click()
  await expect(snapshotDialog).toBeHidden()
  await expect(editor).toContainText('snapshot baseline changed')
})

test('opens command palette and runs text tools', async ({ page }) => {
  await page.goto('/')
  await page.locator('.cm-content').click()
  await page.keyboard.type('{"b": 1}\n\n')
  await page.getByTitle('Command palette').click({ force: true })
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
  await page.getByRole('button', { name: 'Open text tools' }).click()
  await page.getByRole('button', { name: 'Format JSON' }).click()
  await expect(page.locator('.cm-content')).toContainText('"b": 1')
  await page.keyboard.press('Escape')
})

test('generates and imports an encrypted share', async ({ page }) => {
  await page.goto('/')
  await page.locator('.cm-content').click()
  await page.keyboard.type('secret release content')
  await page.getByTitle('Encrypted sharing').click({ force: true })
  const dialog = page.getByRole('dialog', { name: 'Encrypted sharing' })
  await dialog.getByRole('button', { name: 'Generate encrypted link' }).click({ force: true })
  const link = await dialog.getByLabel('Generated encrypted share').inputValue()
  await dialog.getByLabel('Import encrypted share').fill(link)
  await dialog.getByRole('button', { name: 'Decrypt and import' }).click()
  await expect(dialog.getByRole('status')).toContainText('Imported successfully')
  await dialog.getByRole('button', { name: 'Close sharing' }).click()
  await expect(page.locator('.cm-content')).toContainText('secret release content')
})

// Playwright's WebKit driver does not report the opener as focused after a
// modal closes (focus-return is verified in Chromium and Firefox, and the
// focus-return logic is covered by the keyboard-a11y spec).
test('supports modal Escape, focus return, and mobile layout', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit does not track post-modal focus return (engine limitation)')
  await page.goto('/')
  const shareButton = page.getByTitle('Encrypted sharing')
  await shareButton.focus()
  await shareButton.click({ force: true })
  await expect(page.getByRole('dialog', { name: 'Encrypted sharing' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Encrypted sharing' })).toBeHidden()
  await expect(shareButton).toBeFocused()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByText('APEXPAD')).toBeVisible()
})
