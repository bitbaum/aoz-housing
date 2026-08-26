/**
 * The fleet AI provider seam.
 *
 * Groq → OpenRouter. No Anthropic on the box.
 */

const ORIGINAL_ENV = process.env

async function loadProvider(env: Record<string, string | undefined>) {
  jest.resetModules()
  process.env = {
    ...ORIGINAL_ENV,
    GROQ_API_KEY: undefined,
    OPENROUTER_API_KEY: undefined,
    ANTHROPIC_API_KEY: undefined,
    ...env,
  }
  return import('../provider')
}

afterEach(() => {
  process.env = ORIGINAL_ENV
  jest.restoreAllMocks()
})

describe('which provider a completion uses', () => {
  it('uses Groq when only a Groq key is set', async () => {
    const { getAIProvider, hasAIProvider } = await loadProvider({ GROQ_API_KEY: 'gsk_test' })
    expect(getAIProvider()).toBe('groq')
    expect(hasAIProvider()).toBe(true)
  })

  it('uses OpenRouter when only an OpenRouter key is set', async () => {
    const { getAIProvider } = await loadProvider({ OPENROUTER_API_KEY: 'sk-or-test' })
    expect(getAIProvider()).toBe('openrouter')
  })

  it('prefers Groq when both fleet keys are set', async () => {
    const { getAIProvider } = await loadProvider({
      GROQ_API_KEY: 'gsk_test',
      OPENROUTER_API_KEY: 'sk-or-test',
    })
    expect(getAIProvider()).toBe('groq')
  })

  it('reports unconfigured when neither fleet key is set', async () => {
    const { getAIProvider, hasAIProvider, completeText } = await loadProvider({})
    expect(getAIProvider()).toBeNull()
    expect(hasAIProvider()).toBe(false)
    // The chain is empty rather than "one provider that is null": with no key
    // there is no vendor to ask, which is a different fact from a vendor that
    // refused. `userFacingAIError` turns it into the configuration message.
    await expect(
      completeText({ system: 's', prompt: 'p', maxTokens: 10, temperature: 0 })
    ).rejects.toThrow(/every configured AI provider failed/)
  })
})

describe('the Groq call', () => {
  const okResponse = (content: string) =>
    ({ ok: true, json: async () => ({ choices: [{ message: { content } }] }) }) as Response

  it('sends the system prompt and returns the text', async () => {
    const { completeText } = await loadProvider({ GROQ_API_KEY: 'gsk_test', GROQ_MODEL: 'test-model' })
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(okResponse('{"values":{}}'))

    const text = await completeText({ system: 'sys', prompt: 'user text', maxTokens: 64, temperature: 0.2 })

    expect(text).toBe('{"values":{}}')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer gsk_test')
  })

  it('carries the provider body on the error for LOGS, not in the message', async () => {
    // This test used to assert the opposite — that the body appeared in
    // `error.message` — and that assertion is exactly how the vendor's JSON,
    // organisation id included, ended up rendered in the staff UI. The body
    // must still be reachable for `logger.errorWithCause`, just not by
    // anything that formats a response. @see lib/ai/errors.ts
    const { completeText } = await loadProvider({ GROQ_API_KEY: 'gsk_test' })
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'model_decommissioned',
    } as Response)

    const failure = await completeText({
      system: 's',
      prompt: 'p',
      maxTokens: 10,
      temperature: 0,
    }).catch((error: unknown) => error)

    const { AIChainExhaustedError } = await import('@/lib/ai/errors')
    expect(failure).toBeInstanceOf(AIChainExhaustedError)

    const last = (failure as InstanceType<typeof AIChainExhaustedError>).last
    expect(last?.body).toBe('model_decommissioned')
    expect(last?.message).not.toContain('model_decommissioned')
  })
})

describe('the OpenRouter call', () => {
  it('uses OpenRouter when Groq is absent', async () => {
    const { completeText } = await loadProvider({
      OPENROUTER_API_KEY: 'sk-or-test',
      OPENROUTER_MODEL: 'test/openrouter-model',
    })
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
    } as Response)

    await completeText({ system: 's', prompt: 'p', maxTokens: 10, temperature: 0 })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions')
    const body = JSON.parse(init.body as string)
    expect(body.model).toBe('test/openrouter-model')
  })
})
