import { rateLimit, resetRateLimits } from '@/lib/rate-limit'

describe('rateLimit', () => {
  beforeEach(() => resetRateLimits())

  it('allows up to the limit', () => {
    expect(rateLimit('k', 3, 60_000)).toBe(true)
    expect(rateLimit('k', 3, 60_000)).toBe(true)
    expect(rateLimit('k', 3, 60_000)).toBe(true)
    expect(rateLimit('k', 3, 60_000)).toBe(false)
  })

  it('keys are independent', () => {
    expect(rateLimit('a', 1, 60_000)).toBe(true)
    expect(rateLimit('a', 1, 60_000)).toBe(false)
    expect(rateLimit('b', 1, 60_000)).toBe(true)
  })
})
