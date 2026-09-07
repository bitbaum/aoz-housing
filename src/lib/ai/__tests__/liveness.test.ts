import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Everything that reaches a model here is behind staff auth, so checking the
 * provider meant signing in as a Betreuer and using the form assistant on a
 * real client's record. This route answers it without either — and without any
 * client data.
 *
 * ai-kit owns the gating, the caching and the never-cache-a-failure rule. What
 * is app-specific, and what these hold, is the WIRING: an ordinary poll is
 * free, the gate is really connected to AI_PROBE_SECRET, the probe goes through
 * THIS app's `completeText`, and it carries nothing about anybody.
 */

/**
 * Each test loads the module FRESH: the handler is a module-level singleton
 * (the probe's cache lives in it) and a success is cached ten minutes, so a
 * shared instance would let the first success answer every later case.
 */
async function loadHandler() {
  vi.resetModules()
  return (await import('../liveness')).aiLivenessHandler
}

const ORIGINAL_ENV = { ...process.env }

/** Built PER CALL: one Response body can be read only once. */
function completion(content: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  process.env.GROQ_API_KEY = 'gsk_test'
  delete process.env.AI_PROBE_SECRET
  fetchMock = vi.fn(async () => completion('blue'))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  process.env = { ...ORIGINAL_ENV }
})

describe('GET /api/health/ai', () => {
  it('an ordinary poll costs nothing', async () => {
    const handler = await loadHandler()
    const res = await handler(new Request('https://a.test/api/health/ai'))

    expect(res.status).toBe(200)
    expect((await res.json()).probed).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses to probe without the secret, and spends nothing while refusing', async () => {
    process.env.AI_PROBE_SECRET = 'right'
    const handler = await loadHandler()

    expect((await handler(new Request('https://a.test/api/health/ai?probe=1'))).status).toBe(401)
    expect(
      (await handler(new Request('https://a.test/api/health/ai?probe=1&secret=nope'))).status,
    ).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('with AI_PROBE_SECRET unset, probing is OFF (501) rather than open', async () => {
    const handler = await loadHandler()
    const res = await handler(new Request('https://a.test/api/health/ai?probe=1&secret=anything'))

    expect(res.status).toBe(501)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("probes through THIS app's completeText and returns the answer", async () => {
    process.env.AI_PROBE_SECRET = 'right'
    const handler = await loadHandler()

    const res = await handler(new Request('https://a.test/api/health/ai?probe=1&secret=right'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.answer).toBe('blue')
    expect(fetchMock).toHaveBeenCalled()
  })

  it('carries NO client data — only a fixed, meaningless question', async () => {
    process.env.AI_PROBE_SECRET = 'right'
    const handler = await loadHandler()

    await handler(new Request('https://a.test/api/health/ai?probe=1&secret=right'))

    const [, init] = fetchMock.mock.calls[0]
    const body = String(init.body)
    // It runs unattended on a schedule. The real features summarise housing
    // records for named people; anything of that shape in here would be sent to
    // a third party on a timer, with nobody watching.
    expect(body).toContain('clear midday sky')
    expect(body).not.toMatch(/klient|client|bewohner|wohnung|betreuer|dossier/i)
  })

  it('no provider configured is 503 and says so, rather than looking healthy', async () => {
    process.env.AI_PROBE_SECRET = 'right'
    delete process.env.GROQ_API_KEY
    const handler = await loadHandler()

    const res = await handler(new Request('https://a.test/api/health/ai?probe=1&secret=right'))

    expect(res.status).toBe(503)
    // "not configured" and "the vendor refused" want different fixes.
    expect(JSON.stringify(await res.json())).toMatch(/No AI provider is configured/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('a refusing provider is 503', async () => {
    process.env.AI_PROBE_SECRET = 'right'
    fetchMock.mockImplementation(async () => new Response('upstream exploded', { status: 500 }))
    const handler = await loadHandler()

    const res = await handler(new Request('https://a.test/api/health/ai?probe=1&secret=right'))

    expect(res.status).toBe(503)
  })

  it('an EMPTY 200 is a failure, not a healthy-looking silence', async () => {
    process.env.AI_PROBE_SECRET = 'right'
    fetchMock.mockImplementation(async () => completion('   '))
    const handler = await loadHandler()

    const res = await handler(new Request('https://a.test/api/health/ai?probe=1&secret=right'))

    expect(res.status).toBe(503)
  })
})
