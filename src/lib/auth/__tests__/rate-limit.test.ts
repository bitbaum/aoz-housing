import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import {
  checkRateLimit,
  clearLoginAttempts,
  consumeRateLimit,
  recordLoginAttempt,
} from '@/lib/auth/rate-limit'
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

describe('consumeRateLimit — check and record in one call', () => {
  test('trips on its own, without a second call', () => {
    // The whole point. checkRateLimit alone never raises the counter, so a
    // caller that only checks is a throttle that cannot trip.
    const id = `test-consume-${Date.now()}`

    for (let i = 0; i < AUTH_CONFIG.rateLimit.maxAttempts; i++) {
      expect(consumeRateLimit(id).allowed).toBe(true)
    }

    const result = consumeRateLimit(id)
    expect(result.allowed).toBe(false)
    if (!result.allowed) expect(result.retryAfter).toBeGreaterThan(0)

    clearLoginAttempts(id)
  })

  test('does not keep counting once it has blocked', () => {
    // A blocked caller must not extend its own window by retrying, or a client
    // that retries in a loop locks itself out indefinitely.
    const id = `test-consume-blocked-${Date.now()}`
    for (let i = 0; i < AUTH_CONFIG.rateLimit.maxAttempts; i++) consumeRateLimit(id)

    const first = consumeRateLimit(id)
    const second = consumeRateLimit(id)
    expect([first.allowed, second.allowed]).toEqual([false, false])
    if (!first.allowed && !second.allowed) {
      expect(second.retryAfter).toBeLessThanOrEqual(first.retryAfter)
    }

    clearLoginAttempts(id)
  })
})

describe('no route may gate on a counter nothing increments', () => {
  // The class-ender for this bug. /api/ai/chat gated on checkRateLimit and
  // nothing on that path ever called recordLoginAttempt, so the throttle read
  // as working in review and could not trip in production. It looks identical
  // to a correct one at the call site — the only difference is a line
  // somewhere else — so a person is the wrong check for it.
  const API_DIR = join(process.cwd(), 'src/app/api')

  const routeFiles = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) return routeFiles(path)
      return entry.name === 'route.ts' ? [path] : []
    })

  test('every route that checks a rate limit also records against it', () => {
    const offenders = routeFiles(API_DIR).filter((file) => {
      const source = readFileSync(file, 'utf8')
      if (!source.includes('checkRateLimit(')) return false
      // Either it records directly, or it delegates to loginByCode, which
      // records failed attempts itself.
      return !source.includes('recordLoginAttempt(') && !source.includes('loginByCode(')
    })

    expect(offenders.map((f) => f.replace(process.cwd() + '/', ''))).toEqual([])
  })
})
