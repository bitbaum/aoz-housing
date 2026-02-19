/**
 * Tests for portal login API route (POST /api/portal/login)
 *
 * Tests: successful login, invalid code, missing code, rate limiting
 */

import { NextRequest } from 'next/server'

// --- Mocks ---

// Mock redirect to capture calls (next/navigation redirect throws by design)
const mockRedirect = jest.fn()
jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args)
    throw new Error('NEXT_REDIRECT')
  },
}))

// Mock cookies
const mockCookieSet = jest.fn()
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    set: (...args: unknown[]) => mockCookieSet(...args),
  }),
}))

// Mock Prisma
const mockFindUnique = jest.fn()
jest.mock('@/lib/db', () => ({
  prisma: {
    resident: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}))

// --- Import after mocks ---
import { POST } from '../login/route'

// --- Helpers ---

function createFormDataRequest(data: Record<string, string>, ip?: string): NextRequest {
  const formData = new URLSearchParams()
  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value)
  }

  const headers: Record<string, string> = {
    'content-type': 'application/x-www-form-urlencoded',
  }
  if (ip) {
    headers['x-forwarded-for'] = ip
  }

  return new NextRequest('http://localhost:3001/api/portal/login', {
    method: 'POST',
    body: formData.toString(),
    headers,
  })
}

// --- Tests ---

describe('POST /api/portal/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('redirects to /portal on successful login with valid code', async () => {
    const resident = { id: 'res-1', code: 'RES-001' }
    mockFindUnique.mockResolvedValue(resident)

    const req = createFormDataRequest({ code: 'res-001' }, '10.0.0.1')

    await expect(POST(req)).rejects.toThrow('NEXT_REDIRECT')

    // Should look up the code (trimmed + uppercased)
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { code: 'RES-001' },
    })

    // Should set the resident_code cookie
    expect(mockCookieSet).toHaveBeenCalledWith(
      'resident_code',
      'RES-001',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    )

    // Final redirect to /portal
    expect(mockRedirect).toHaveBeenLastCalledWith('/portal')
  })

  test('redirects with error=invalid_code when resident not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    const req = createFormDataRequest({ code: 'INVALID' }, '10.0.0.2')

    await expect(POST(req)).rejects.toThrow('NEXT_REDIRECT')

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { code: 'INVALID' },
    })
    expect(mockRedirect).toHaveBeenCalledWith('/portal?error=invalid_code')
    expect(mockCookieSet).not.toHaveBeenCalled()
  })

  test('redirects with error=code_required when code is empty', async () => {
    const req = createFormDataRequest({ code: '' }, '10.0.0.3')

    await expect(POST(req)).rejects.toThrow('NEXT_REDIRECT')

    expect(mockRedirect).toHaveBeenCalledWith('/portal?error=code_required')
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  test('redirects with error=rate_limited after too many attempts', async () => {
    // Use a unique IP per test to avoid bleeding between tests
    const ip = `rate-limit-test-${Date.now()}`

    // The route's in-memory rate limiter allows 5 attempts per minute.
    // We need to trigger 6 requests from the same IP.
    // First 5 requests increment the counter (they still proceed to validation).
    // The 6th request gets rate-limited before reaching validation.

    mockFindUnique.mockResolvedValue(null) // All attempts fail to find resident

    for (let i = 0; i < 5; i++) {
      const req = createFormDataRequest({ code: 'TEST' }, ip)
      await expect(POST(req)).rejects.toThrow('NEXT_REDIRECT')
    }

    // 6th attempt should be rate-limited
    mockRedirect.mockClear()
    const req = createFormDataRequest({ code: 'TEST' }, ip)
    await expect(POST(req)).rejects.toThrow('NEXT_REDIRECT')

    expect(mockRedirect).toHaveBeenCalledWith('/portal?error=rate_limited')
  })

  test('trims and uppercases the code before lookup', async () => {
    mockFindUnique.mockResolvedValue({ id: 'res-1', code: 'ABC-123' })

    const req = createFormDataRequest({ code: '  abc-123  ' }, '10.0.0.4')

    await expect(POST(req)).rejects.toThrow('NEXT_REDIRECT')

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { code: 'ABC-123' },
    })
  })
})
