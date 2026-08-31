/**
 * Residents asking for a meeting, and staff answering.
 *
 * Appointments were the one portal surface a resident could not write to. They
 * can record an expense, claim a chore, file a report and request a transfer —
 * but "when can I talk to the person responsible for me" had no answer here.
 *
 * Every rule below fails quietly if broken: a duplicate request looks like a
 * keen resident, a decline with no reason looks like a decline, and a reschedule
 * that cancels looks — to the person waiting — like being dropped.
 */

import type { Mock } from 'vitest'
import { prisma } from '@/lib/db'
import { requestAppointment, respondToAppointmentRequest, rescheduleAppointment } from '../care'
import { CARE_LABELS } from '@/lib/config/care'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

vi.mock('@/lib/db', () => ({
  prisma: {
    appointment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    careAssignment: { findUnique: vi.fn() },
  },
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }))

const mockGetCurrentUser = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth', () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}))

const mockPortalAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/portal-auth', () => ({
  getPortalAuth: (...args: unknown[]) => mockPortalAuth(...args),
}))

const p = prisma as unknown as {
  appointment: { create: Mock; findUnique: Mock; findFirst: Mock; update: Mock }
  careAssignment: { findUnique: Mock }
}

function form(entries: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) fd.set(k, v)
  return fd
}

const TOMORROW = new Date(Date.now() + 24 * 60 * 60 * 1000)
const YESTERDAY = new Date(Date.now() - 24 * 60 * 60 * 1000)

/** `datetime-local` has no timezone; the action parses it as Zurich wall time. */
function localInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

beforeEach(() => {
  vi.clearAllMocks()
  mockPortalAuth.mockResolvedValue({ resident: { id: 'res-1' } })
  mockGetCurrentUser.mockResolvedValue({ id: 'staff-1', role: 'SOZIALARBEIT' })
  p.appointment.findFirst.mockResolvedValue(null)
  p.careAssignment.findUnique.mockResolvedValue({ staffId: 'staff-9' })
  p.appointment.create.mockResolvedValue({ id: 'appt-1' })
  p.appointment.update.mockResolvedValue({})
})

describe('a resident asks for a meeting', () => {
  it('creates a REQUESTED appointment routed to whoever holds the seat', async () => {
    const result = await requestAppointment(
      form({ domain: 'SOCIAL', startsAt: localInput(TOMORROW), residentNote: 'Brief vom Amt' }),
    )

    expect(result.success).toBe(true)
    const [args] = p.appointment.create.mock.calls[0]
    expect(args.data.status).toBe('REQUESTED')
    expect(args.data.residentId).toBe('res-1')
    expect(args.data.staffId).toBe('staff-9')
    expect(args.data.residentNote).toBe('Brief vom Amt')
  })

  it('still lands unclaimed when nobody holds the seat', async () => {
    // Zero real residents have a care team. Refusing here would have made the
    // feature dead on arrival for exactly the people who need it — the same
    // deadlock that killed caseload scoping.
    p.careAssignment.findUnique.mockResolvedValue(null)

    const result = await requestAppointment(form({ domain: 'JOB', startsAt: localInput(TOMORROW) }))

    expect(result.success).toBe(true)
    expect(p.appointment.create.mock.calls[0][0].data.staffId).toBeNull()
  })

  it('refuses a time in the past, which would be invisible the moment it saved', async () => {
    const result = await requestAppointment(
      form({ domain: 'SOCIAL', startsAt: localInput(YESTERDAY) }),
    )

    expect(result).toEqual({ success: false, error: CARE_LABELS.requestPastTime })
    expect(p.appointment.create).not.toHaveBeenCalled()
  })

  it('refuses a second open request for the same seat', async () => {
    // A resident unsure the first one landed taps again, and a coach's queue
    // fills with duplicates of one ask.
    p.appointment.findFirst.mockResolvedValue({ id: 'existing' })

    const result = await requestAppointment(
      form({ domain: 'SOCIAL', startsAt: localInput(TOMORROW) }),
    )

    expect(result).toEqual({ success: false, error: CARE_LABELS.requestDuplicate })
    expect(p.appointment.create).not.toHaveBeenCalled()
  })

  it('refuses an unauthenticated caller', async () => {
    mockPortalAuth.mockResolvedValue(null)

    const result = await requestAppointment(
      form({ domain: 'SOCIAL', startsAt: localInput(TOMORROW) }),
    )

    expect(result.success).toBe(false)
    expect(p.appointment.create).not.toHaveBeenCalled()
  })
})

describe('staff answer the request', () => {
  beforeEach(() => {
    p.appointment.findUnique.mockResolvedValue({
      residentId: 'res-1',
      domain: 'SOCIAL',
      status: 'REQUESTED',
    })
  })

  it('accepting schedules it and gives it an owner', async () => {
    await respondToAppointmentRequest(form({ id: 'a1', decision: 'ACCEPT' }))

    const [args] = p.appointment.update.mock.calls[0]
    expect(args.data.status).toBe('SCHEDULED')
    // Whoever answered takes it — including on a request that arrived unclaimed.
    expect(args.data.staffId).toBe('staff-1')
  })

  it('accepting without a new time keeps the time the resident proposed', async () => {
    await respondToAppointmentRequest(form({ id: 'a1', decision: 'ACCEPT' }))

    expect(p.appointment.update.mock.calls[0][0].data.startsAt).toBeUndefined()
  })

  it('declining REQUIRES a reason the resident will read', async () => {
    const result = await respondToAppointmentRequest(
      form({ id: 'a1', decision: 'DECLINE', staffNote: '' }),
    )

    expect(result).toEqual({ success: false, error: CARE_LABELS.declineNeedsReason })
    expect(p.appointment.update).not.toHaveBeenCalled()
  })

  it('a decline carries its reason onto the record', async () => {
    await respondToAppointmentRequest(
      form({ id: 'a1', decision: 'DECLINE', staffNote: 'Diese Woche voll, nächste geht.' }),
    )

    const [args] = p.appointment.update.mock.calls[0]
    expect(args.data.status).toBe('CANCELLED')
    expect(args.data.staffNote).toBe('Diese Woche voll, nächste geht.')
  })

  it('refuses a staff member who does not work that seat', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'staff-2', role: 'JOBCOACH' })

    const result = await respondToAppointmentRequest(form({ id: 'a1', decision: 'ACCEPT' }))

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS })
    expect(p.appointment.update).not.toHaveBeenCalled()
  })

  it('refuses to answer something that is not an open request', async () => {
    p.appointment.findUnique.mockResolvedValue({
      residentId: 'res-1',
      domain: 'SOCIAL',
      status: 'COMPLETED',
    })

    const result = await respondToAppointmentRequest(form({ id: 'a1', decision: 'ACCEPT' }))

    expect(result.success).toBe(false)
    expect(p.appointment.update).not.toHaveBeenCalled()
  })
})

describe('moving a meeting keeps the meeting', () => {
  it('changes the time in place rather than cancelling', async () => {
    p.appointment.findUnique.mockResolvedValue({
      residentId: 'res-1',
      domain: 'SOCIAL',
      status: 'SCHEDULED',
    })

    await rescheduleAppointment(
      form({ id: 'a1', startsAt: localInput(TOMORROW), staffNote: 'Eine Stunde später.' }),
    )

    const [args] = p.appointment.update.mock.calls[0]
    // The status is untouched: to the resident this is a change, not a
    // cancellation followed by a different appointment appearing.
    expect(args.data.status).toBeUndefined()
    expect(args.data.startsAt).toBeInstanceOf(Date)
    expect(args.data.staffNote).toBe('Eine Stunde später.')
  })

  it.each(['COMPLETED', 'CANCELLED', 'NO_SHOW'])(
    'refuses to move a %s appointment, which is a record not a plan',
    async (status) => {
      p.appointment.findUnique.mockResolvedValue({
        residentId: 'res-1',
        domain: 'SOCIAL',
        status,
      })

      const result = await rescheduleAppointment(form({ id: 'a1', startsAt: localInput(TOMORROW) }))

      expect(result).toEqual({ success: false, error: CARE_LABELS.rescheduleClosed })
      expect(p.appointment.update).not.toHaveBeenCalled()
    },
  )

  it('refuses a staff member who does not work that seat', async () => {
    p.appointment.findUnique.mockResolvedValue({
      residentId: 'res-1',
      domain: 'HOUSING',
      status: 'SCHEDULED',
    })

    const result = await rescheduleAppointment(form({ id: 'a1', startsAt: localInput(TOMORROW) }))

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS })
  })
})
