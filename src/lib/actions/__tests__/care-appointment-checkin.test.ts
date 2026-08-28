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

import { prisma } from '@/lib/db'
import { setAppointmentStatus } from '../care'

jest.mock('@/lib/db', () => {
  // Annotated because $transaction refers to prismaMock inside its own
  // initializer, which otherwise infers as `any` under strict mode.
  const prismaMock: {
    appointment: { findUnique: jest.Mock; update: jest.Mock }
    placement: { findFirst: jest.Mock; update: jest.Mock }
    satisfactionCheckIn: { create: jest.Mock }
    $transaction: jest.Mock
  } = {
    appointment: { findUnique: jest.fn(), update: jest.fn() },
    placement: { findFirst: jest.fn(), update: jest.fn() },
    satisfactionCheckIn: { create: jest.fn() },
    $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(prismaMock)),
  }
  return { prisma: prismaMock }
})

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/lib/audit', () => ({ logAudit: jest.fn() }))

const staff = { id: 'staff-1', name: 'Test Admin', role: 'ADMIN' as const }
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(async () => ({
    id: 'staff-1',
    name: 'Test Admin',
    role: 'ADMIN' as const,
  })),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

function completionForm(fields: Record<string, string> = {}): FormData {
  const fd = new FormData()
  fd.set('id', 'appt-1')
  fd.set('status', 'COMPLETED')
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue({
    residentId: 'res-1',
    domain: 'HOUSING',
    checkIn: null,
  })
  ;(mockPrisma.appointment.update as jest.Mock).mockResolvedValue({})
  ;(mockPrisma.placement.findFirst as jest.Mock).mockResolvedValue({
    id: 'pl-1',
    startDate: new Date('2026-01-01'),
  })
  ;(mockPrisma.satisfactionCheckIn.create as jest.Mock).mockResolvedValue({ id: 'ci-1' })
  ;(mockPrisma.placement.update as jest.Mock).mockResolvedValue({})
})

describe('completing an appointment', () => {
  it('records nothing when the question was not asked', async () => {
    const result = await setAppointmentStatus(completionForm())

    expect(result).toEqual({ success: true })
    expect(mockPrisma.appointment.update).toHaveBeenCalled()
    expect(mockPrisma.satisfactionCheckIn.create).not.toHaveBeenCalled()
  })

  it.each(['0', '6', '', 'not a number', '3.5'])(
    'treats %p as not asked rather than as a reading',
    async (value) => {
      await setAppointmentStatus(completionForm({ overallSatisfaction: value }))

      expect(mockPrisma.satisfactionCheckIn.create).not.toHaveBeenCalled()
    }
  )

  it('links the reading to the appointment and the account that recorded it', async () => {
    await setAppointmentStatus(
      completionForm({ overallSatisfaction: '4', concerns: 'Lärm nachts' })
    )

    expect(mockPrisma.satisfactionCheckIn.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        placementId: 'pl-1',
        appointmentId: 'appt-1',
        overallSatisfaction: 4,
        concerns: 'Lärm nachts',
        collectedByUserId: staff.id,
      }),
    })
    expect(mockPrisma.placement.update).toHaveBeenCalledWith({
      where: { id: 'pl-1' },
      data: { satisfactionRating: 4 },
    })
  })

  it('still closes the appointment when the resident has no active placement', async () => {
    ;(mockPrisma.placement.findFirst as jest.Mock).mockResolvedValue(null)

    const result = await setAppointmentStatus(completionForm({ overallSatisfaction: '5' }))

    expect(result).toEqual({ success: true })
    expect(mockPrisma.appointment.update).toHaveBeenCalled()
    expect(mockPrisma.satisfactionCheckIn.create).not.toHaveBeenCalled()
  })

  it('does not overwrite a reading already recorded for this appointment', async () => {
    ;(mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue({
      residentId: 'res-1',
      domain: 'HOUSING',
      checkIn: { id: 'ci-existing' },
    })

    await setAppointmentStatus(completionForm({ overallSatisfaction: '2' }))

    expect(mockPrisma.satisfactionCheckIn.create).not.toHaveBeenCalled()
  })

  it('records nothing when the appointment is cancelled rather than held', async () => {
    const fd = completionForm({ overallSatisfaction: '5' })
    fd.set('status', 'CANCELLED')

    await setAppointmentStatus(fd)

    expect(mockPrisma.satisfactionCheckIn.create).not.toHaveBeenCalled()
  })
})
