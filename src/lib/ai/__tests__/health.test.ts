/**
 * `/api/health` checked only the database until now — an AI outage was
 * invisible to it despite `withProviderFallback` already degrading
 * gracefully when every provider fails. This pins the state machine that
 * check now depends on. Mirrors kivvi/evig/hirnli/botsmann's own copy.
 */
import { getAIHealth, recordAIHealthFailure, recordAIHealthSuccess, resetAIHealth } from '../health'

beforeEach(() => resetAIHealth())

describe('ai health tracker', () => {
  it('starts unknown, before anything has been observed', () => {
    expect(getAIHealth().status).toBe('unknown')
  })

  it('is ok after a success', () => {
    recordAIHealthSuccess()
    expect(getAIHealth().status).toBe('ok')
  })

  it('is degraded on the first failures, not down', () => {
    recordAIHealthFailure(new Error('every configured AI provider failed'))
    expect(getAIHealth().status).toBe('degraded')
  })

  it('is down once failures are consistent', () => {
    for (let i = 0; i < 3; i += 1) recordAIHealthFailure(new Error('boom'))
    const health = getAIHealth()
    expect(health.status).toBe('down')
    expect(health.consecutiveFailures).toBe(3)
    expect(health.lastError).toBe('boom')
  })

  it('recovers to ok on the next success', () => {
    for (let i = 0; i < 5; i += 1) recordAIHealthFailure(new Error('boom'))
    expect(getAIHealth().status).toBe('down')
    recordAIHealthSuccess()
    const health = getAIHealth()
    expect(health.status).toBe('ok')
    expect(health.consecutiveFailures).toBe(0)
    expect(health.lastError).toBeNull()
  })
})
