/**
 * Login routing across a rebrand.
 *
 * This exists because of a live outage, not a hypothetical. `loginByCode` used
 * to route staff logins on `code.startsWith(`${BRAND.shortName}-`)`. When the
 * default brand flipped from AOZ to AOCH, every one of the 21 staff codes in
 * production — 19 of which had logged in before — stopped resolving, and the
 * app told each of them "Ungültiger Code". Nothing failed; the software simply
 * denied that its own users existed.
 *
 * brand.ts already promised this could not happen ("login resolves a code by
 * exact string, so codes issued under a previous brand keep working. A rebrand
 * must not lock anyone out."). The promise lived in a comment, so nothing
 * enforced it. These tests are that enforcement.
 */

const mockFindUniqueUser = jest.fn()
const mockFindUniqueResident = jest.fn()

jest.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => mockFindUniqueUser(...a), update: jest.fn() },
    resident: { findUnique: (...a: unknown[]) => mockFindUniqueResident(...a) },
  },
}))

import { loginByCode } from '@/lib/auth'
import { BRANDS } from '@/lib/config/brand'

const STAFF = { id: 'u1', email: 'a@b.ch', name: 'Test', role: 'ADMIN', active: true }

beforeEach(() => {
  jest.clearAllMocks()
  mockFindUniqueUser.mockResolvedValue(null)
  mockFindUniqueResident.mockResolvedValue(null)
})

describe('a code issued under any brand still logs in', () => {
  // Data-driven off the brand registry: adding a brand adds a case, so the
  // next rebrand cannot quietly reintroduce this.
  for (const brand of Object.values(BRANDS)) {
    it(`resolves a ${brand.codePrefix} staff code regardless of the active brand`, async () => {
      mockFindUniqueUser.mockResolvedValue(STAFF)

      const code = `${brand.codePrefix}ABC123`
      const result = await loginByCode(code, '127.0.0.1')

      expect(result.success).toBe(true)
      // Looked up by exact string — no prefix rewriting, no brand in the query.
      expect(mockFindUniqueUser).toHaveBeenCalledWith(
        expect.objectContaining({ where: { code } })
      )
    })
  }

  it('sends a resident code to residents, not to staff', async () => {
    mockFindUniqueResident.mockResolvedValue({ id: 'r1', code: 'RES-000001' })

    const result = await loginByCode('RES-000001', '127.0.0.1')

    expect(result).toMatchObject({ success: true, type: 'resident' })
    expect(mockFindUniqueUser).not.toHaveBeenCalled()
  })

  it('rejects an unknown code without telling the caller which table it missed', async () => {
    // Both tables empty. The message must not leak whether the code exists in
    // one of them, and must not name a prefix — naming one is what made a
    // locked-out admin believe their own code was malformed.
    const result = await loginByCode('AOZ-NOPE00', '127.0.0.1')

    expect(result).toEqual({ success: false, error: 'Ungültiger Code' })
  })
})
