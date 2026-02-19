import { checkRateLimit, clearLoginAttempts, recordLoginAttempt } from '@/lib/auth/rate-limit'
import { AUTH_CONFIG } from '@/lib/auth/config'

describe('auth rate-limit', () => {
  test('allows initial attempts', () => {
    const id = `test-initial-${Date.now()}`
    expect(checkRateLimit(id).allowed).toBe(true)
    clearLoginAttempts(id)
  })

  test('blocks after max attempts reached', () => {
    const id = `test-block-${Date.now()}`

    for (let i = 0; i < AUTH_CONFIG.rateLimit.maxAttempts; i++) {
      recordLoginAttempt(id)
    }

    const result = checkRateLimit(id)
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.retryAfter).toBeGreaterThan(0)
    }

    clearLoginAttempts(id)
  })

  test('clearing attempts removes block', () => {
    const id = `test-clear-${Date.now()}`

    for (let i = 0; i < AUTH_CONFIG.rateLimit.maxAttempts; i++) {
      recordLoginAttempt(id)
    }

    expect(checkRateLimit(id).allowed).toBe(false)
    clearLoginAttempts(id)
    expect(checkRateLimit(id).allowed).toBe(true)
  })
})
