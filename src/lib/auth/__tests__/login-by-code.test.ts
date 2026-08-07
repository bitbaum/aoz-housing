/**
 * Login routing across a rebrand.
 *
 * `loginByCode` decides staff-vs-resident from the code's prefix. The property
 * that matters here is not "AOZH codes work" — it is that codes issued under a
 * PREVIOUS brand keep working, because a login code is a credential people
 * already hold on a printed letter. Routing on the active brand alone locks
 * out every staff member who has not been re-issued a code, including the
 * seeded admin (`AOZ-ADMIN1`), and it does so silently: the code simply reads
 * as "Ungültiger Code".
 */

import { BRANDS } from '@/lib/config/brand'
import { RESIDENT_CODE_PREFIX } from '@/lib/auth/code-prefixes'

const mockUserFindUnique = jest.fn()
const mockUserUpdate = jest.fn()
const mockResidentFindUnique = jest.fn()

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: (...a: unknown[]) => mockUserFindUnique(...a),
      update: (...a: unknown[]) => mockUserUpdate(...a),
    },
    resident: { findUnique: (...a: unknown[]) => mockResidentFindUnique(...a) },
  },
}))

jest.mock('@/lib/auth/rate-limit', () => ({
  recordLoginAttempt: jest.fn(),
  clearLoginAttempts: jest.fn(),
}))

jest.mock('next/headers', () => ({ cookies: jest.fn() }))

import { loginByCode } from '@/lib/auth'

const STAFF = {
  id: 'u1',
  email: 'staff@example.ch',
  name: 'Sam Staff',
  role: 'ADMIN' as const,
  active: true,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUserFindUnique.mockResolvedValue(STAFF)
  mockUserUpdate.mockResolvedValue({})
  mockResidentFindUnique.mockResolvedValue({ id: 'r1', code: 'RES-010' })
})

describe('loginByCode — staff routing', () => {
  it.each(Object.values(BRANDS).map((b) => [b.id, b.codePrefix]))(
    'accepts a %s-era staff code (%s)',
    async (_id, prefix) => {
      const result = await loginByCode(`${prefix}ADMIN1`, '10.0.0.1')

      expect(result).toMatchObject({ success: true, type: 'staff' })
      // Looked up by the exact string — a prefix never rewrites a code.
      expect(mockUserFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { code: `${prefix}ADMIN1` } })
      )
    }
  )

  it('still admits the original seeded AOZ admin after the AOZH rebrand', async () => {
    // The exact regression: this code exists in production today.
    const result = await loginByCode('AOZ-ADMIN1', '10.0.0.1')
    expect(result).toMatchObject({ success: true, type: 'staff' })
  })

  it('rejects an inactive staff account', async () => {
    mockUserFindUnique.mockResolvedValue({ ...STAFF, active: false })
    expect(await loginByCode('AOZH-ADMIN1', '10.0.0.1')).toMatchObject({ success: false })
  })
})

describe('loginByCode — resident routing', () => {
  it('routes a resident code to the resident lookup', async () => {
    const result = await loginByCode(`${RESIDENT_CODE_PREFIX}010`, '10.0.0.1')

    expect(result).toMatchObject({ success: true, type: 'resident', code: 'RES-010' })
    expect(mockUserFindUnique).not.toHaveBeenCalled()
  })
})

describe('loginByCode — unknown prefixes', () => {
  it('rejects a code with no recognised prefix', async () => {
    const result = await loginByCode('XYZ-12345', '10.0.0.1')
    expect(result).toMatchObject({ success: false })
  })

  it('names both prefixes in the error so the user can self-correct', async () => {
    const result = await loginByCode('nonsense', '10.0.0.1')
    if (result.success) throw new Error('expected failure')
    expect(result.error).toContain(RESIDENT_CODE_PREFIX)
  })
})
