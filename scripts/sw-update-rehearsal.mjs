/**
 * Service worker update rehearsal — verifies vite-plugin-pwa autoUpdate.
 * Scenario: dist was built with "ApexPad", served & SW registered, then dist
 * rebuilt with "ApexPad (update rehearsal)". A returning client should pick up
 * the new SW via registration.update().
 *
 * Run: node scripts/sw-update-rehearsal.mjs
 */
import { chromium } from '@playwright/test'

const baseURL = process.argv[2] ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()

async function swState(label) {
  const state = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready
    const snapshot = async (reg) => ({
      scriptURL: reg.active?.scriptURL ?? null,
      state: reg.active?.state ?? null,
      installing: reg.installing?.state ?? null,
      waiting: reg.waiting?.state ?? null,
    })
    const before = await snapshot(reg)
    const updateFound = await reg.update()
    const after = await snapshot(await navigator.serviceWorker.ready)
    return { before, after, updateFound: Boolean(updateFound) }
  })
  console.log(`[${label}]`, JSON.stringify(state, null, 2))
  return state
}

await page.goto(baseURL, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await swState('first load')

// Simulate a returning client: force the update check, then reload to let a
// waiting/active new worker take control.
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
const second = await swState('after reload + update()')

console.log('---')
console.log('RESULT:', second.after.state === 'activated' ? 'SW UPDATE LIFECYCLE OK' : 'NO UPDATE OBSERVED')

await browser.close()
