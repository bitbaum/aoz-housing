/**
 * Closing an appointment is the only staff path that records a new reading.
 *
 * The scale used to sit on the client page and in every row of the placements
 * table, so a caseworker could record how someone felt without having spoken
 * to them, and the happy end of the scale submitted on a single tap while only
 * 1–3 opened a real form. Both surfaces are gone. What replaces them has to
 * hold three properties, and none of them fails loudly when broken:
 *
 *   1. Not asking is allowed, and writes nothing. A required field would buy a
 *      number for every meeting by making some of them guesses.
 *   2. What is written names the appointment it came from and the account that
 *      recorded it.
 *   3. A resident with no active placement can still have appointments closed.
 */

import { getTableName } from 'drizzle-orm'
import { appointment, placement } from '@/lib/db'
import { setAppointmentStatus } from '../care'

const mockAppointmentFindFirst = vi.fn()
const mockPlacementFindFirst = vi.fn()
const mockCheckInCreate = vi.fn()
/** Records every update — direct or in a transaction — as (tableName, payload). */
const mockUpdateSet = vi.fn()

vi.mock('@/lib/db', async () => {
  const { getTableName: tableName } = await import('drizzle-orm')
  const update = vi.fn((table: unknown) => ({
    set: (v: unknown) => {
      mockUpdateSet(tableName(table as any), v)
      return { where: () => Promise.resolve([]) }
    },
  }))
  const tx = {
    insert: vi.fn(() => ({ values: (v: unknown) => mockCheckInCreate(v) })),
    update,
  }
  return {
    ...(await vi.importActual<object>('@/lib/db')),
    db: {
      query: {
        appointment: { findFirst: (...a: unknown[]) => mockAppointmentFindFirst(...a) },
        placement: { findFirst: (...a: unknown[]) => mockPlacementFindFirst(...a) },
      },
      update,
      transaction: async (cb: (t: unknown) => Promise<unknown>) => cb(tx),
    },
  }
})

vi.mock('next/cache', async () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/audit', async () => ({ logAudit: vi.fn() }))

const staff = { id: 'staff-1', name: 'Test Admin', role: 'ADMIN' as const }
vi.mock('@/lib/auth', async () => ({
  getCurrentUser: vi.fn(async () => ({
    id: 'staff-1',
    name: 'Test Admin',
    role: 'ADMIN' as const,
    scope: 'ALL_DOMAINS' as const,
    isSystemAdmin: true,
  })),
}))

function completionForm(fields: Record<string, string> = {}): FormData {
  const fd = new FormData()
  fd.set('id', 'appt-1')
  fd.set('status', 'COMPLETED')
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

/** The one update setAppointmentStatus always makes: the status itself. */
function appointmentStatusUpdates() {
  return mockUpdateSet.mock.calls.filter(([table]) => table === getTableName(appointment))
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAppointmentFindFirst.mockResolvedValue({
    residentId: 'res-1',
    domain: 'HOUSING',
    checkIn: null,
  })
  mockPlacementFindFirst.mockResolvedValue({
    id: 'pl-1',
    startDate: new Date('2026-01-01'),
  })
  mockCheckInCreate.mockResolvedValue({ id: 'ci-1' })
})

describe('completing an appointment', () => {
  it('records nothing when the question was not asked', async () => {
    const result = await setAppointmentStatus(completionForm())

    expect(result).toEqual({ success: true })
    expect(appointmentStatusUpdates()).not.toHaveLength(0)
    expect(mockCheckInCreate).not.toHaveBeenCalled()
  })

  it.each(['0', '6', '', 'not a number', '3.5'])(
    'treats %p as not asked rather than as a reading',
    async (value) => {
      await setAppointmentStatus(completionForm({ overallSatisfaction: value }))

      expect(mockCheckInCreate).not.toHaveBeenCalled()
    },
  )

  it('links the reading to the appointment and the account that recorded it', async () => {
    await setAppointmentStatus(
      completionForm({ overallSatisfaction: '4', concerns: 'Lärm nachts' }),
    )

    expect(mockCheckInCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        placementId: 'pl-1',
        appointmentId: 'appt-1',
        overallSatisfaction: 4,
        concerns: 'Lärm nachts',
        collectedByUserId: staff.id,
      }),
    )
    expect(mockUpdateSet).toHaveBeenCalledWith(getTableName(placement), {
      satisfactionRating: 4,
    })
  })

  it('still closes the appointment when the resident has no active placement', async () => {
    mockPlacementFindFirst.mockResolvedValue(null)

    const result = await setAppointmentStatus(completionForm({ overallSatisfaction: '5' }))

    expect(result).toEqual({ success: true })
    expect(appointmentStatusUpdates()).not.toHaveLength(0)
    expect(mockCheckInCreate).not.toHaveBeenCalled()
  })

  it('does not overwrite a reading already recorded for this appointment', async () => {
    mockAppointmentFindFirst.mockResolvedValue({
      residentId: 'res-1',
      domain: 'HOUSING',
      checkIn: { id: 'ci-existing' },
    })

    await setAppointmentStatus(completionForm({ overallSatisfaction: '2' }))

    expect(mockCheckInCreate).not.toHaveBeenCalled()
  })

  it('records nothing when the appointment is cancelled rather than held', async () => {
    const fd = completionForm({ overallSatisfaction: '5' })
    fd.set('status', 'CANCELLED')

    await setAppointmentStatus(fd)

    expect(mockCheckInCreate).not.toHaveBeenCalled()
  })
})
