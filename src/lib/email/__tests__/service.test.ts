/**
 * Tests for the Resend email service: graceful no-op when disabled, success,
 * retry behaviour on transient failures, and bail-out on client errors.
 */

// Mutable mock config — service.ts reads EMAIL_CONFIG at call time, so tests
// can flip these fields between cases. (Name starts with `mock` so the
// jest.mock factory may reference it despite hoisting.)
const mockEmailConfig = {
  apiKey: 'test-key',
  fromName: 'AOZ Housing',
  fromAddress: 'noreply@aoz-housing.ch',
  staffRecipients: ['staff@aoz-housing.ch'] as string[],
  enabled: true,
}

jest.mock('../config', () => ({ EMAIL_CONFIG: mockEmailConfig }))
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    errorWithCause: jest.fn(),
  },
}))

import { sendEmail, notifyStaff } from '../service'

const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

function okResponse() {
  return { ok: true, status: 200, text: async () => '' }
}
function errorResponse(status: number) {
  return { ok: false, status, text: async () => `error ${status}` }
}

// Drive a sendEmail call that may sleep between retries (delays 0/1000/4000ms).
async function runWithTimers<T>(promise: Promise<T>): Promise<T> {
  // Flush all pending timers + microtasks until the promise settles.
  await jest.advanceTimersByTimeAsync(10_000)
  return promise
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  mockEmailConfig.enabled = true
  mockEmailConfig.apiKey = 'test-key'
  mockEmailConfig.staffRecipients = ['staff@aoz-housing.ch']
})

afterEach(() => {
  jest.useRealTimers()
})

describe('sendEmail', () => {
  it('no-ops and returns false when email is disabled', async () => {
    mockEmailConfig.enabled = false
    const result = await sendEmail(['a@b.ch'], 'Subj', '<p>hi</p>')
    expect(result).toBe(false)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns true and posts to Resend on a successful response', async () => {
    mockFetch.mockResolvedValueOnce(okResponse())
    const result = await runWithTimers(sendEmail(['a@b.ch'], 'Subj', '<p>hi</p>'))
    expect(result).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(1)

    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.method).toBe('POST')
    expect(init.headers['Authorization']).toBe('Bearer test-key')
    const body = JSON.parse(init.body)
    expect(body.to).toEqual(['a@b.ch'])
    expect(body.from).toBe('AOZ Housing <noreply@aoz-housing.ch>')
    expect(body.subject).toBe('Subj')
  })

  it('does NOT retry on a non-429 client error and returns false', async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(400))
    const result = await runWithTimers(sendEmail(['a@b.ch'], 'Subj', '<p>hi</p>'))
    expect(result).toBe(false)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('retries on 429 and succeeds on the second attempt', async () => {
    mockFetch
      .mockResolvedValueOnce(errorResponse(429))
      .mockResolvedValueOnce(okResponse())
    const result = await runWithTimers(sendEmail(['a@b.ch'], 'Subj', '<p>hi</p>'))
    expect(result).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('retries on 5xx up to the attempt limit then returns false', async () => {
    mockFetch.mockResolvedValue(errorResponse(503))
    const result = await runWithTimers(sendEmail(['a@b.ch'], 'Subj', '<p>hi</p>'))
    expect(result).toBe(false)
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('retries on a thrown network error then recovers', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValueOnce(okResponse())
    const result = await runWithTimers(sendEmail(['a@b.ch'], 'Subj', '<p>hi</p>'))
    expect(result).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('returns false when every attempt throws a network error', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNRESET'))
    const result = await runWithTimers(sendEmail(['a@b.ch'], 'Subj', '<p>hi</p>'))
    expect(result).toBe(false)
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })
})

describe('notifyStaff', () => {
  it('no-ops and returns false when no staff recipients are configured', async () => {
    mockEmailConfig.staffRecipients = []
    const result = await notifyStaff('Subj', '<p>hi</p>')
    expect(result).toBe(false)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('delegates to sendEmail with the configured staff recipients', async () => {
    mockEmailConfig.staffRecipients = ['s1@aoz.ch', 's2@aoz.ch']
    mockFetch.mockResolvedValueOnce(okResponse())
    const result = await runWithTimers(notifyStaff('Subj', '<p>hi</p>'))
    expect(result).toBe(true)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.to).toEqual(['s1@aoz.ch', 's2@aoz.ch'])
  })
})
