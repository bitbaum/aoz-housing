/**
 * Tests for portal auth routes:
 * - POST /api/portal/logout
 */

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
const mockCookieDelete = jest.fn()
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    delete: (...args: unknown[]) => mockCookieDelete(...args),
  }),
}))

// --- Import after mocks ---
import { POST as logoutPOST } from '../logout/route'

// --- Tests ---

describe('POST /api/portal/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('deletes the resident_code cookie', async () => {
    await expect(logoutPOST()).rejects.toThrow('NEXT_REDIRECT')

    expect(mockCookieDelete).toHaveBeenCalledWith('resident_code')
  })

  test('redirects to /portal after deleting cookie', async () => {
    await expect(logoutPOST()).rejects.toThrow('NEXT_REDIRECT')

    expect(mockRedirect).toHaveBeenCalledWith('/portal')
  })

  test('deletes cookie before redirecting', async () => {
    const callOrder: string[] = []
    mockCookieDelete.mockImplementation(() => {
      callOrder.push('delete')
    })
    mockRedirect.mockImplementation(() => {
      callOrder.push('redirect')
      throw new Error('NEXT_REDIRECT')
    })

    await expect(logoutPOST()).rejects.toThrow('NEXT_REDIRECT')

    expect(callOrder).toEqual(['delete', 'redirect'])
  })
})
