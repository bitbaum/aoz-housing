/**
 * The provider seam.
 *
 * These tests exist because of a specific failure: the app shipped an AI
 * feature that was green in CI and 503 in production, for the whole life of the
 * feature, because no deployment ever had the one key it was written against.
 * The thing worth pinning is therefore not "does it call the API" but "does the
 * key that is actually present decide the backend".
 */

const ORIGINAL_ENV = process.env

/** Load the module fresh so its lazy '@/lib/env' import sees this env. */
async function loadProvider(env: Record<string, string | undefined>) {
  jest.resetModules()
  process.env = { ...ORIGINAL_ENV, GROQ_API_KEY: undefined, ANTHROPIC_API_KEY: undefined, ...env }
  return import('../provider')
}

afterEach(() => {
  process.env = ORIGINAL_ENV
  jest.restoreAllMocks()
})

describe('which provider a completion uses', () => {
  it('uses Groq when only a Groq key is set', async () => {
    const { getCompletionProvider, hasCompletionProvider } = await loadProvider({ GROQ_API_KEY: 'gsk_test' })
    expect(getCompletionProvider()).toBe('groq')
    expect(hasCompletionProvider()).toBe(true)
  })

  it('uses Anthropic when only an Anthropic key is set', async () => {
    const { getCompletionProvider } = await loadProvider({ ANTHROPIC_API_KEY: 'sk-ant-test' })
    expect(getCompletionProvider()).toBe('anthropic')
  })

  it('prefers Groq when both are set', async () => {
    // Groq is the fleet's configured provider and it is free; a box that has
    // both should not quietly spend money.
    const { getCompletionProvider } = await loadProvider({
      GROQ_API_KEY: 'gsk_test',
      ANTHROPIC_API_KEY: 'sk-ant-test',
    })
    expect(getCompletionProvider()).toBe('groq')
  })

  it('reports unconfigured rather than pretending, when neither is set', async () => {
    // This is the 503 the route answers. It must be decidable BEFORE a request
    // is made, or the failure arrives as a stack trace mid-completion.
    const { getCompletionProvider, hasCompletionProvider, completeText } = await loadProvider({})
    expect(getCompletionProvider()).toBeNull()
    expect(hasCompletionProvider()).toBe(false)
    await expect(
      completeText({ system: 's', prompt: 'p', maxTokens: 10, temperature: 0 })
    ).rejects.toThrow(/GROQ_API_KEY or ANTHROPIC_API_KEY/)
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
    const body = JSON.parse(init.body as string)
    expect(body.model).toBe('test-model')
    expect(body.messages).toEqual([
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'user text' },
    ])
  })

  it('surfaces the provider’s own reason when the call fails', async () => {
    // A decommissioned model and a bad key are both "it stopped working";
    // swallowing the body makes them the same blank wall. This bit us fleet-wide.
    const { completeText } = await loadProvider({ GROQ_API_KEY: 'gsk_test' })
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'model_decommissioned',
    } as Response)

    await expect(
      completeText({ system: 's', prompt: 'p', maxTokens: 10, temperature: 0 })
    ).rejects.toThrow(/400.*model_decommissioned/)
  })

  it('returns empty text rather than crashing on an unexpected body', async () => {
    const { completeText } = await loadProvider({ GROQ_API_KEY: 'gsk_test' })
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({}) } as Response)

    await expect(
      completeText({ system: 's', prompt: 'p', maxTokens: 10, temperature: 0 })
    ).resolves.toBe('')
  })
})
