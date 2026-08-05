/**
 * Visual QA screenshots for the design system.
 * Run against a built preview:  pnpm preview (or dev) then:
 *   node scripts/screenshot.mjs <baseURL>
 * Default baseURL: http://127.0.0.1:4173
 * Outputs to test-results/design/
 */
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const baseURL = process.argv[2] ?? 'http://127.0.0.1:4173'
const outDir = join(process.cwd(), 'test-results', 'design')
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()

async function capture(page, name) {
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: false })
  console.log(`wrote ${name}.png`)
}

// Dark desktop
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.setItem('apexpad-theme', 'dark'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.cm-content').fill('# Welcome to ApexPad\n\nThis is a **markdown** note.\n\n- item one\n- item two\n')
  await capture(page, 'dark-main')

  await page.getByRole('button', { name: 'Command palette' }).click()
  await page.waitForTimeout(400)
  await capture(page, 'dark-palette')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Text tools' }).click()
  await page.waitForTimeout(400)
  await capture(page, 'dark-tools')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Encrypted sharing' }).click()
  await page.waitForTimeout(400)
  await capture(page, 'dark-share')
  await page.keyboard.press('Escape')
  await page.close()
}

// Light desktop
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.setItem('apexpad-theme', 'light'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.cm-content').fill('# Light mode\n\nA clean surface.\n')
  await capture(page, 'light-main')
  await page.getByRole('button', { name: 'Command palette' }).click()
  await page.waitForTimeout(400)
  await capture(page, 'light-palette')
  await page.close()
}

// Mobile dark
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true })
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.setItem('apexpad-theme', 'dark'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.cm-content').fill('Mobile note content')
  await capture(page, 'mobile-main')
  await page.getByRole('button', { name: 'Command palette' }).click()
  await page.waitForTimeout(400)
  await capture(page, 'mobile-palette')
  await page.close()
}

await browser.close()
console.log('Done. Screenshots in', outDir)
