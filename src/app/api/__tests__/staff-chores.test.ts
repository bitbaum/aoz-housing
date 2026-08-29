import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chores/route'

const mockRequireStaffAuth = jest.fn()
jest.mock('@/lib/auth', () => ({
  requireStaffAuth: () => mockRequireStaffAuth(),
}))

const mockUnitFindUnique = jest.fn()
const mockTaskCreate = jest.fn()
jest.mock('@/lib/db', () => ({
  prisma: {
    housingUnit: { findUnique: (...args: unknown[]) => mockUnitFindUnique(...args) },
    householdTask: { create: (...args: unknown[]) => mockTaskCreate(...args) },
  },
}))

const mockLogAudit = jest.fn().mockResolvedValue(undefined)
jest.mock('@/lib/audit', () => ({ logAudit: (...args: unknown[]) => mockLogAudit(...args) }))
jest.mock('@/lib/logger', () => ({
  logger: { errorWithCause: jest.fn(), error: jest.fn(), info: jest.fn() },
}))

/**
 * Chores could only ever be created by a resident, because the only route that
 * made one read its unit from the author's own placement — an assumption that
 * silently excluded everybody who does not live in a unit.
 */

function post(fields: Record<string, string>) {
  const body = new FormData()
  for (const [key, value] of Object.entries(fields)) body.append(key, value)

  return POST(new NextRequest('http://localhost/api/chores', { method: 'POST', body }))
}

const VALID = {
  housingUnitId: 'unit-1',
  title: 'Küche putzen',
  taskType: 'RECURRING_SCHEDULED',
  category: 'CLEANING',
  priority: 'NORMAL',
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireStaffAuth.mockResolvedValue({ id: 'staff-1', name: 'M. Keller', role: 'ADMIN' })
  mockUnitFindUnique.mockResolvedValue({ id: 'unit-1', code: 'DEMO-U05' })
  mockTaskCreate.mockImplementation((args: { data: unknown }) =>
    Promise.resolve({ id: 'task-1', ...(args.data as object) }),
  )
})

describe('POST /api/chores (staff)', () => {
  it('refuses without a staff session', async () => {
    mockRequireStaffAuth.mockRejectedValue(new Error('no session'))

    const response = await post(VALID)

    expect(response.status).toBe(401)
    expect(mockTaskCreate).not.toHaveBeenCalled()
  })

  it('creates the task against the chosen unit', async () => {
    const response = await post(VALID)

    expect(response.status).toBe(200)
    expect(mockTaskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ housingUnitId: 'unit-1', title: 'Küche putzen' }),
      }),
    )
  })

  it('records the staff member as the author', async () => {
    // Not left blank: the fairness balance credits whoever COMPLETES a task, so
    // authorship changes no numbers — it changes whether residents can tell
    // where a chore came from. One appearing with no author reads as somebody
    // quietly adding work.
    await post(VALID)

    expect(mockTaskCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ createdByStaff: 'M. Keller' }) }),
    )
  })

  it('never attributes a staff task to a resident', async () => {
    await post(VALID)

    const { data } = mockTaskCreate.mock.calls[0][0]
    expect(data.createdByResidentId).toBeUndefined()
  })

  it('rejects a unit that does not exist rather than failing on the foreign key', async () => {
    // An id from a form is an id the caller chose. Without this the failure is
    // a Prisma FK error and a 500, which tells nobody anything.
    mockUnitFindUnique.mockResolvedValue(null)

    const response = await post({ ...VALID, housingUnitId: 'made-up' })

    expect(response.status).toBe(404)
    expect(mockTaskCreate).not.toHaveBeenCalled()
  })

  it('rejects a request with no unit at all', async () => {
    const { housingUnitId: _omitted, ...withoutUnit } = VALID
    const response = await post(withoutUnit)

    expect(response.status).toBe(400)
    expect(mockTaskCreate).not.toHaveBeenCalled()
  })

  it('rejects an empty title through the shared schema', async () => {
    // The same schema the resident form uses. Two definitions of what a task is
    // would drift into a task residents can see but not complete.
    const response = await post({ ...VALID, title: '' })

    expect(response.status).toBe(400)
    expect(mockTaskCreate).not.toHaveBeenCalled()
  })

  it('audits the creation', async () => {
    await post(VALID)

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        entity: 'HOUSEHOLD_TASK',
        changes: expect.objectContaining({ unit: 'DEMO-U05', createdBy: 'M. Keller' }),
      }),
    )
  })
})
