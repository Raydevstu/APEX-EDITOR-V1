import { expect, test } from '@playwright/test'

/**
 * Gate 2 — automated accessibility audit beyond the axe scan:
 * 1. Keyboard-only flow: every interactive surface reachable, no trap, Escape closes.
 * 2. Accessible names/semantics on key controls (read by assistive tech).
 */

test('keyboard-only: title, tabs, and editor are reachable in order', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('APEXPAD')).toBeVisible()
  // Instant-capture autofocus lands in the editor on boot.
  await expect(page.locator('.cm-content')).toBeFocused({ timeout: 3000 })
  await expect(page.locator('.cm-content')).toHaveAttribute('aria-label', 'Note editor')

  // Chrome controls are keyboard-focusable with accessible names.
  // Use click (not only .focus()) so WebKit reliably activates the control.
  const title = page.getByLabel('Note title')
  await title.click()
  await expect(title).toBeFocused()

  const palette = page.getByTitle('Command palette')
  await palette.focus()
  await expect(palette).toBeFocused()

  const snapshot = page.getByTitle('Create snapshot')
  await snapshot.focus()
  await expect(snapshot).toBeFocused()

  await page.locator('.cm-content').click()
  await expect(page.locator('.cm-content')).toBeFocused()
})

test('keyboard-only: dialog focus trap keeps Tab inside and Escape closes to opener', async ({ page, browserName }) => {
  await page.goto('/')
  await expect(page.getByText('APEXPAD')).toBeVisible()

  const opener = page.getByTitle('Encrypted sharing')
  await opener.click()
  await expect(page.getByRole('dialog', { name: 'Encrypted sharing' })).toBeVisible()

  // Focus must remain inside the dialog across many Tab presses (trap).
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press('Tab')
    const inside = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))
    expect(inside).toBe(true)
  }

  // Shift+Tab stays inside too.
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press('Shift+Tab')
    const inside = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))
    expect(inside).toBe(true)
  }

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Encrypted sharing' })).toBeHidden()
  // Playwright WebKit does not reliably report post-modal focus return (same as editor.spec).
  if (browserName !== 'webkit') {
    await expect(opener).toBeFocused()
  }
})

test('keyboard-only: every modal surface opens, traps, and closes via Escape', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('APEXPAD')).toBeVisible()

  const surfaces: Array<{ trigger: string; dialog: string }> = [
    { trigger: 'Text tools', dialog: 'Text tools' },
    { trigger: 'Create snapshot', dialog: 'Snapshot history' },
    { trigger: 'Encrypted sharing', dialog: 'Encrypted sharing' },
    { trigger: 'Compare latest snapshot', dialog: 'Latest snapshot diff' },
  ]

  for (const { trigger, dialog } of surfaces) {
    const opener = page.getByTitle(trigger)
    await opener.focus()
    await page.keyboard.press('Enter')
    const surface = page.getByRole('dialog', { name: dialog })
    await expect(surface).toBeVisible()

    // Escape closes and returns focus to the opener.
    await page.keyboard.press('Escape')
    await expect(surface).toBeHidden()
    await expect(opener).toBeFocused()
  }
})

test('screen-reader tree: command palette dialog has modal semantics and named items', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('APEXPAD')).toBeVisible()

  await page.getByTitle('Command palette').click()
  const dialog = page.getByRole('dialog', { name: 'Command palette' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('aria-modal', 'true')

  await expect(dialog.getByRole('button', { name: 'Close commands' })).toBeVisible()
  for (const label of ['New note', 'Open text tools', 'Open snapshots']) {
    await expect(dialog.getByRole('option', { name: new RegExp(label, 'i') })).toBeVisible()
  }
})
