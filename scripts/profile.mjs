/**
 * Startup performance profiling against the production preview.
 * Seeds a PerformanceObserver before navigation so FCP/LCP are captured,
 * plus Navigation Timing and long-task counts.
 *
 * Run: pnpm preview (on 4173) then: node scripts/profile.mjs
 */
import { chromium } from '@playwright/test'

const baseURL = process.argv[2] ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

// Seed observers before any script runs so paint entries are captured.
await page.addInitScript(() => {
  window.__apexPerf = {
    paints: { firstPaint: null, firstContentfulPaint: null, largestContentfulPaint: null },
    longTasks: [],
    done: false,
  }
  const handler = (list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'paint') {
        if (entry.name === 'first-paint') window.__apexPerf.paints.firstPaint = Math.round(entry.startTime)
        if (entry.name === 'first-contentful-paint') window.__apexPerf.paints.firstContentfulPaint = Math.round(entry.startTime)
      }
      if (entry.entryType === 'largest-contentful-paint') {
        window.__apexPerf.paints.largestContentfulPaint = Math.round(entry.startTime)
      }
    }
  }
  const observer = new PerformanceObserver(handler)
  observer.observe({ type: 'paint', buffered: true })
  observer.observe({ type: 'largest-contentful-paint', buffered: true })
  const ltObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__apexPerf.longTasks.push({ start: Math.round(entry.startTime), duration: Math.round(entry.duration) })
    }
  })
  ltObserver.observe({ type: 'longtask', buffered: true })
})

await page.goto(baseURL, { waitUntil: 'networkidle' })
// Let LCP settle (it can fire up to a few seconds after load).
await page.waitForTimeout(2000)

const result = await page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0]
  return {
    timings: nav
      ? {
          domInteractive: Math.round(nav.domInteractive),
          domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
          load: Math.round(nav.loadEventEnd),
          transferSize: nav.transferSize,
        }
      : null,
    paints: window.__apexPerf.paints,
    longTasks: window.__apexPerf.longTasks,
  }
})

console.log('Navigation timing (ms):')
console.log('  domInteractive:', result.timings?.domInteractive)
console.log('  domContentLoaded:', result.timings?.domContentLoaded)
console.log('  load:', result.timings?.load)
console.log('  transferSize (bytes):', result.timings?.transferSize)
console.log('Paint timing (ms):')
console.log('  firstPaint:', result.paints.firstPaint)
console.log('  firstContentfulPaint:', result.paints.firstContentfulPaint)
console.log('  largestContentfulPaint:', result.paints.largestContentfulPaint)
console.log('Long tasks (first load window):')
if (result.longTasks.length === 0) console.log('  none')
else result.longTasks.forEach((t) => console.log(`  ${t.start}ms duration ${t.duration}ms`))

await browser.close()
