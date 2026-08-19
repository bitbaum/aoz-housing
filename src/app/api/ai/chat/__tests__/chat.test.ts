/**
 * Tests for POST /api/ai/chat
 *
 * Covers: auth guard, API key guard, schema validation, and SSE streaming.
 */

const mockGetCurrentUser = jest.fn()
jest.mock('@/lib/auth', () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}))

const mockHasAIProvider = jest.fn()
jest.mock('@/lib/ai/provider', () => ({
  hasAIProvider: (...args: unknown[]) => mockHasAIProvider(...args),
}))

const mockRunStaffChat = jest.fn()
jest.mock('@/lib/ai/staff-chat', () => ({
  runStaffChat: (...args: unknown[]) => mockRunStaffChat(...args),
}))

import { POST } from '../route'

const STAFF_USER = {
  id: 'user-1',
  name: 'Test Mitarbeiter',
  email: 'test@aoz.ch',
  role: 'ADMIN' as const,
}

const VALID_BODY = {
  messages: [{ role: 'user', content: 'Wie viele Bewohner sind im System?' }],
}

function makeRequest(body: unknown, contentType = 'application/json'): Request {
  return new Request('http://localhost/api/ai/chat', {
    method: 'POST',
    headers: { 'content-type': contentType },
    body: JSON.stringify(body),
  })
}

async function readStream(res: Response): Promise<string> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let text = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    text += decoder.decode(value, { stream: true })
  }
  return text
}

describe('POST /api/ai/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasAIProvider.mockReturnValue(false)
  })

  test('returns 503 when no fleet AI key is configured', async () => {
    const res = await POST(makeRequest(VALID_BODY))

    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.error).toMatch(/GROQ_API_KEY|OPENROUTER_API_KEY/)
  })

  test('returns 401 when user is not authenticated', async () => {
    mockHasAIProvider.mockReturnValue(true)
    mockGetCurrentUser.mockResolvedValue(null)

    const res = await POST(makeRequest(VALID_BODY))

    expect(res.status).toBe(401)
  })

  test('returns 400 for malformed JSON body', async () => {
    mockHasAIProvider.mockReturnValue(true)
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)

    const req = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'this is not json',
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('returns 400 when messages field is missing', async () => {
    mockHasAIProvider.mockReturnValue(true)
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)

    const res = await POST(makeRequest({ notMessages: [] }))
    expect(res.status).toBe(400)
  })

  test('returns 400 when a message has an invalid role', async () => {
    mockHasAIProvider.mockReturnValue(true)
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)

    const res = await POST(makeRequest({
      messages: [{ role: 'system', content: 'hi' }],
    }))
    expect(res.status).toBe(400)
  })

  test('streams SSE text chunks and done event', async () => {
    mockHasAIProvider.mockReturnValue(true)
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)
    mockRunStaffChat.mockResolvedValue('Es gibt 42 Bewohner.')

    const res = await POST(makeRequest(VALID_BODY))

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/event-stream')

    const text = await readStream(res)
    expect(text).toContain('"type":"text"')
    expect(text).toContain('42')
    expect(text).toContain('"type":"done"')
    expect(mockRunStaffChat).toHaveBeenCalledWith(VALID_BODY.messages)
  })

  test('streams error event when runStaffChat throws', async () => {
    mockHasAIProvider.mockReturnValue(true)
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)
    mockRunStaffChat.mockRejectedValue(new Error('Groq chat failed (429): rate limit'))

    const res = await POST(makeRequest(VALID_BODY))
    const text = await readStream(res)

    expect(text).toContain('"type":"error"')
    expect(text).toContain('429')
  })
})
