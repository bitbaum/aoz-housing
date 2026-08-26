/**
 * What a provider failure is allowed to say to a caseworker.
 *
 * The bug this pins: `/api/ai/chat` streamed `err.message` to the browser, and
 * that message was built by interpolating the vendor's response body. A Groq
 * rate limit rendered inside the German staff UI as a JSON blob containing the
 * organisation id `org_01jy16rk1yffks8jdsmfn4s7rj`.
 *
 * So the assertions are two-sided on purpose: the right German text appears,
 * AND nothing from the vendor body survives into it.
 */

import {
  AIChainExhaustedError,
  AIProviderError,
  userFacingAIError,
  shouldTryNextProvider,
} from '@/lib/ai/errors'

/** The exact body from the incident, org id included. */
const CAPACITY_429 = JSON.stringify({
  error: {
    message:
      'Rate limit reached for model `openai/gpt-oss-120b` in organization ' +
      '`org_01jy16rk1yffks8jdsmfn4s7rj` service tier `on_demand` on tokens per ' +
      'minute (TPM): Limit 8000, Used 4940, Requested 4816. Please try again in 13.17s.',
    type: 'tokens',
    code: 'rate_limit_exceeded',
  },
})

const DAILY_429 = JSON.stringify({
  error: {
    message:
      'Rate limit reached for model `openai/gpt-oss-120b` in organization `org_x` ' +
      'on tokens per day (TPD): Limit 100000, Used 100000, Requested 500. ' +
      'Please try again in 3h21m.',
    type: 'tokens',
    code: 'rate_limit_exceeded',
  },
})

describe('nothing from the vendor reaches the user', () => {
  const LEAKS = ['org_01jy16rk1yffks8jdsmfn4s7rj', 'openai/gpt-oss-120b', 'TPM', 'on_demand', '{']

  it.each([
    ['capacity', CAPACITY_429, 429],
    ['daily', DAILY_429, 429],
    ['server error', 'upstream exploded', 500],
  ])('%s: no vendor text survives', (_name, body, status) => {
    const message = userFacingAIError(new AIProviderError('groq', status, body))

    expect(LEAKS.filter((leak) => message.includes(leak))).toEqual([])
    // And it is not empty or English-by-accident.
    expect(message.startsWith('Der KI-Assistent') || message.startsWith('Das Tagesbudget')).toBe(
      true
    )
  })
})

describe('the three kinds of 429 say different things', () => {
  it('capacity invites a retry, with the wait', () => {
    const message = userFacingAIError(new AIProviderError('groq', 429, CAPACITY_429))
    expect(message).toMatch(/ausgelastet/)
    expect(message).toMatch(/\d+ Sekunden/)
  })

  it('daily does NOT invite a retry — waiting is measured in hours', () => {
    const message = userFacingAIError(new AIProviderError('groq', 429, DAILY_429))
    expect(message).toMatch(/Tagesbudget/)
    // The capacity phrasing here would send someone into a retry loop that is
    // guaranteed to fail until the budget resets.
    expect(message).not.toMatch(/Sekunden/)
  })
})

describe('when to try a different vendor', () => {
  it('does for a capacity limit — a different vendor has a different meter', () => {
    expect(shouldTryNextProvider(new AIProviderError('groq', 429, CAPACITY_429))).toBe(true)
  })

  it('does for a daily exhaustion — the budget is org-wide, not per model', () => {
    expect(shouldTryNextProvider(new AIProviderError('groq', 429, DAILY_429))).toBe(true)
  })

  it('does for a 5xx', () => {
    expect(shouldTryNextProvider(new AIProviderError('groq', 503, ''))).toBe(true)
  })

  it('does NOT for a 400 — a malformed request fails identically everywhere', () => {
    expect(shouldTryNextProvider(new AIProviderError('groq', 400, 'bad request'))).toBe(false)
  })
})

describe('an exhausted chain reports its last real failure', () => {
  it('surfaces the final provider error, not a generic shrug', () => {
    const last = new AIProviderError('openrouter', 429, DAILY_429)
    expect(userFacingAIError(new AIChainExhaustedError(last))).toMatch(/Tagesbudget/)
  })

  it('falls back to a generic message when there was no provider at all', () => {
    expect(userFacingAIError(new AIChainExhaustedError(null))).toMatch(/nicht erreichbar/)
  })
})
