/**
 * Tests for portal auth routes:
 * - POST /api/portal/logout
 */

// --- Mocks ---

// Mock redirect to capture calls (next/navigation redirect throws by design)
const mockRedirect = vi.fn()
vi.mock('next/navigation', async () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args)
    throw new Error('NEXT_REDIRECT')
  },
}))

// Mock cookies
const mockCookieDelete = vi.fn()
vi.mock('next/headers', async () => ({
  cookies: vi.fn().mockResolvedValue({
    delete: (...args: unknown[]) => mockCookieDelete(...args),
  }),
}))

// --- Import after mocks ---
import { POST as logoutPOST } from '../logout/route'

// --- Tests ---

describe('POST /api/portal/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
