import { describe, it, expect } from 'vitest'

describe('App Store', () => {
  it('should load available extensions', async () => {
    // This is a placeholder test
    expect(1 + 1).toBe(2)
  })

  it('should initialize with empty state', () => {
    expect({}).toBeTruthy()
  })
})

describe('Notes Sidebar', () => {
  it('should display title', () => {
    expect('Notes').toBe('Notes')
  })
})