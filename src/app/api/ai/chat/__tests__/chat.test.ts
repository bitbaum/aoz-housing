/**
 * Tests for POST /api/ai/chat
 *
 * Covers: auth guard, API key guard, schema validation, and SSE streaming.
 */

import { NextRequest } from 'next/server'

// --- Mocks (hoisted before imports) ---

const mockGetCurrentUser = jest.fn()
jest.mock('@/lib/auth', () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}))

// Prisma mock — used by executeTool inside the route
const mockResident = { count: jest.fn(), findMany: jest.fn() }
const mockHousingUnit = { count: jest.fn(), findMany: jest.fn() }
const mockPlacement = { count: jest.fn() }
const mockIncident = { count: jest.fn(), findMany: jest.fn() }
const mockTransferRequest = { count: jest.fn() }
const mockMaintenanceRequest = { count: jest.fn() }

jest.mock('@/lib/db', () => ({
  prisma: {
    resident: mockResident,
    housingUnit: mockHousingUnit,
    placement: mockPlacement,
    incident: mockIncident,
    transferRequest: mockTransferRequest,
    maintenanceRequest: mockMaintenanceRequest,
  },
}))

// Anthropic SDK mock — must be set up before the route module is imported
const mockFinalMessage = jest.fn()
const mockMessagesStream = jest.fn()

jest.mock('@anthropic-ai/sdk', () => {
  const MockAnthropic = jest.fn().mockImplementation(() => ({
    messages: { stream: mockMessagesStream },
  }))
  return { __esModule: true, default: MockAnthropic }
})

// --- Import route after mocks ---
import { POST } from '../route'

// --- Helpers ---

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

/** Creates an async iterable from an array of events. */
async function* makeAsyncIterable<T>(items: T[]): AsyncIterable<T> {
  for (const item of items) yield item
}

/** Reads all text from a ReadableStream response. */
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

// --- Tests ---

describe('POST /api/ai/chat', () => {
  const originalKey = process.env.ANTHROPIC_API_KEY

  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.ANTHROPIC_API_KEY
  })

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.ANTHROPIC_API_KEY = originalKey
    }
  })

  // ── Auth & config guards ──────────────────────────────────────────────────

  test('returns 503 when ANTHROPIC_API_KEY is not configured', async () => {
    const res = await POST(makeRequest(VALID_BODY))

    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.error).toContain('ANTHROPIC_API_KEY')
  })

  test('returns 401 when user is not authenticated', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-key'
    mockGetCurrentUser.mockResolvedValue(null)

    const res = await POST(makeRequest(VALID_BODY))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  // ── Schema validation ─────────────────────────────────────────────────────

  test('returns 400 for malformed JSON body', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-key'
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
    process.env.ANTHROPIC_API_KEY = 'sk-test-key'
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)

    const res = await POST(makeRequest({ notMessages: [] }))
    expect(res.status).toBe(400)
  })

  test('returns 400 when messages is not an array', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-key'
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)

    const res = await POST(makeRequest({ messages: 'not an array' }))
    expect(res.status).toBe(400)
  })

  test('returns 400 when a message has an invalid role', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-key'
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)

    const res = await POST(makeRequest({
      messages: [{ role: 'system', content: 'hi' }],
    }))
    expect(res.status).toBe(400)
  })

  // ── SSE streaming ─────────────────────────────────────────────────────────

  test('streams SSE with text events for a simple end_turn response', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-key'
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)

    const events = [
      { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hallo' } },
      { type: 'content_block_delta', delta: { type: 'text_delta', text: ' Welt' } },
    ]

    const streamObj = Object.assign(makeAsyncIterable(events), {
      finalMessage: mockFinalMessage,
    })
    mockMessagesStream.mockReturnValue(streamObj)
    mockFinalMessage.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: 'Hallo Welt' }],
    })

    const res = await POST(makeRequest(VALID_BODY))

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/event-stream')

    const text = await readStream(res)
    expect(text).toContain('"type":"text"')
    expect(text).toContain('"text":"Hallo"')
    expect(text).toContain('"text":" Welt"')
    expect(text).toContain('"type":"done"')
  })

  test('does not stream thinking blocks — only text deltas', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-key'
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)

    const events = [
      // Thinking block — should be skipped
      { type: 'content_block_delta', delta: { type: 'thinking_delta', thinking: 'reasoning...' } },
      // Text block — should be streamed
      { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Antwort' } },
    ]

    const streamObj = Object.assign(makeAsyncIterable(events), {
      finalMessage: mockFinalMessage,
    })
    mockMessagesStream.mockReturnValue(streamObj)
    mockFinalMessage.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: 'Antwort' }],
    })

    const res = await POST(makeRequest(VALID_BODY))
    const text = await readStream(res)

    expect(text).not.toContain('thinking_delta')
    expect(text).toContain('"text":"Antwort"')
  })

  test('executes tool use loop and streams final text', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-key'
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)

    // Round 1: model requests a tool
    const round1Events = [
      { type: 'content_block_delta', delta: { type: 'text_delta', text: '' } },
    ]
    const round1Stream = Object.assign(makeAsyncIterable(round1Events), {
      finalMessage: jest.fn().mockResolvedValue({
        stop_reason: 'tool_use',
        content: [{
          type: 'tool_use',
          id: 'tool-123',
          name: 'get_dashboard_stats',
          input: {},
        }],
      }),
    })

    // Round 2: model gives final text answer
    const round2Events = [
      { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Es gibt 42 Bewohner.' } },
    ]
    const round2Stream = Object.assign(makeAsyncIterable(round2Events), {
      finalMessage: jest.fn().mockResolvedValue({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Es gibt 42 Bewohner.' }],
      }),
    })

    mockMessagesStream
      .mockReturnValueOnce(round1Stream)
      .mockReturnValueOnce(round2Stream)

    // Mock DB calls for get_dashboard_stats
    mockResident.count.mockResolvedValue(42)
    mockPlacement.count.mockResolvedValue(35)
    mockHousingUnit.count.mockResolvedValue(10)
    mockIncident.count.mockResolvedValue(2)
    mockTransferRequest.count.mockResolvedValue(1)

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)

    const text = await readStream(res)
    expect(text).toContain('"text":"Es gibt 42 Bewohner."')
    expect(text).toContain('"type":"done"')
    expect(mockMessagesStream).toHaveBeenCalledTimes(2)
  })

  test('streams error event when Anthropic SDK throws', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-key'
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)

    const failingStream = Object.assign(
      (async function* () { throw new Error('API down') })(),
      { finalMessage: jest.fn() }
    )
    mockMessagesStream.mockReturnValue(failingStream)

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200) // SSE always returns 200, errors are in the stream

    const text = await readStream(res)
    expect(text).toContain('"type":"error"')
  })
})
