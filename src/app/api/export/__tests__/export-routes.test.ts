/**
 * Tests for export API routes.
 * Tests the residents export route as representative of all export routes.
 * Covers: auth check, CSV content-type, data formatting.
 */

// --- Mocks ---

const mockGetCurrentUser = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth', () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
  authorizeStaff: async () => {
    const user = await mockGetCurrentUser()
    if (!user) return { ok: false as const, status: 401 as const }
    return { ok: true as const, user }
  },
}))

const mockResidentFindMany = vi.hoisted(() => vi.fn())
vi.mock('@/lib/db', () => ({
  prisma: {
    resident: {
      findMany: (...args: unknown[]) => mockResidentFindMany(...args),
    },
  },
}))

// --- Import after mocks ---
import { GET } from '../../export/residents/route'

describe('GET /api/export/residents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Nicht authentifiziert')
  })

  it('returns CSV with correct content-type header', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'staff@aoz.ch',
      name: 'Staff',
      viewer: { role: 'ADMIN', scope: 'ALL_DOMAINS', isSystemAdmin: true },
    })
    mockResidentFindMany.mockResolvedValue([])

    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')
    expect(response.headers.get('Content-Disposition')).toMatch(
      /^attachment; filename="bewohner-\d{4}-\d{2}-\d{2}\.csv"$/,
    )
  })

  it('returns data formatted as CSV', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'staff@aoz.ch',
      name: 'Staff',
      viewer: { role: 'ADMIN', scope: 'ALL_DOMAINS', isSystemAdmin: true },
    })
    mockResidentFindMany.mockResolvedValue([
      {
        code: 'RES-001',
        status: 'ACTIVE',
        ageRange: 'ADULT',
        gender: 'MALE',
        familyStatus: 'SINGLE',
        sleepSchedule: 'STANDARD',
        noiseTolerance: 3,
        cleanlinessPractice: 4,
        socialStyle: 'MODERATE',
        smokingStatus: 'NON_SMOKER',
        mobilityNeeds: 'NONE',
        supportLevel: 'STANDARD',
        languages: ['de', 'en'],
        createdAt: new Date('2024-06-15'),
      },
    ])

    const response = await GET()
    const csv = await response.text()
    const lines = csv.split('\r\n')

    // Verify headers (German)
    expect(lines[0]).toContain('Code')
    expect(lines[0]).toContain('Status')
    expect(lines[0]).toContain('Altersgruppe')
    expect(lines[0]).toContain('Sprachen')
    expect(lines[0]).toContain('Erstellt am')

    // Verify data row
    expect(lines[1]).toContain('RES-001')
    expect(lines[1]).toContain('ACTIVE')
    expect(lines[1]).toContain('ADULT')
    expect(lines[1]).toContain('de, en')
    expect(lines[1]).toContain('2024-06-15')
  })

  it('handles empty dataset', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'staff@aoz.ch',
      name: 'Staff',
      viewer: { role: 'ADMIN', scope: 'ALL_DOMAINS', isSystemAdmin: true },
    })
    mockResidentFindMany.mockResolvedValue([])

    const response = await GET()
    const csv = await response.text()
    const lines = csv.split('\r\n').filter((l) => l.trim())

    // Should have only the header row
    expect(lines.length).toBe(1)
    expect(lines[0]).toContain('Code')
  })

  it('calls prisma with correct orderBy', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'staff@aoz.ch',
      name: 'Staff',
      viewer: { role: 'ADMIN', scope: 'ALL_DOMAINS', isSystemAdmin: true },
    })
    mockResidentFindMany.mockResolvedValue([])

    await GET()

    expect(mockResidentFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    })
  })
})
