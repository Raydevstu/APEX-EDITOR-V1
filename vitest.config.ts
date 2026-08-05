import { defineConfig } from 'vitest/config'

// React resolves its production build (which lacks the test-only `act` export)
// when NODE_ENV=production. Force development for tests so React.act exists.
process.env.NODE_ENV = 'development'

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    environment: 'jsdom',
  },
})
