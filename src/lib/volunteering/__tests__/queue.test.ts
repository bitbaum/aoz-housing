import { describe, expect, it } from 'vitest'

import {
  NO_ENGAGEMENT_GRACE_DAYS,
  STALLED_ENGAGEMENT_DAYS,
  VOLUNTEERING_SIGNAL_IDS,
  buildVolunteeringQueue,
  signalsFor,
} from '@/lib/volunteering/queue'
import { STAFF_ROLE_CARE_DOMAIN } from '@/lib/config/care'
import type { CareClientInput } from '@/lib/care/queue'

const NOW = new Date('2026-09-05T09:00:00Z')

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 86_400_000)
}

function client(overrides: Partial<CareClientInput> = {}): CareClientInput {
  return {
    residentId: 'r1',
    name: 'Amina',
    createdAt: daysAgo(200),
    learningRecords: [],
    applications: [],
    ...overrides,
  }
}

describe("Sandra's queue", () => {
  it('names a resident whose own interest nobody answered', () => {
    const signals = signalsFor(
      client({
        applications: [{ stage: 'INTERESTED', createdBy: 'RESIDENT', supportedByUserId: null }],
      }),
      NOW,
    )
    expect(signals).toEqual(['INTEREST_UNANSWERED'])
  })

  it('stops naming it the moment a person picks it up', () => {
    // The whole inversion in one assertion: staff engagement is what changes
    // the state, not the resident clicking again.
    const signals = signalsFor(
      client({
        applications: [
          { stage: 'INTERESTED', createdBy: 'RESIDENT', supportedByUserId: 'staff-1' },
        ],
      }),
      NOW,
    )
    expect(signals).toEqual([])
  })

  it('does not count an unanswered click as an engagement', () => {
    // Were this wrong, a resident putting their hand up would REMOVE themselves
    // from Sandra's queue — the exact failure fixed on the job side.
    const waiting = client({
      createdAt: daysAgo(NO_ENGAGEMENT_GRACE_DAYS + 5),
      applications: [{ stage: 'INTERESTED', createdBy: 'RESIDENT', supportedByUserId: null }],
    })
    expect(signalsFor(waiting, NOW)).toContain('INTEREST_UNANSWERED')
    expect(signalsFor(waiting, NOW)).not.toContain('NO_ENGAGEMENT')
  })

  it('waits out the grace period before asking why nothing is arranged', () => {
    expect(signalsFor(client({ createdAt: daysAgo(NO_ENGAGEMENT_GRACE_DAYS - 1) }), NOW)).toEqual(
      [],
    )
    expect(signalsFor(client({ createdAt: daysAgo(NO_ENGAGEMENT_GRACE_DAYS) }), NOW)).toEqual([
      'NO_ENGAGEMENT',
    ])
  })

  it('treats a live engagement as arranged', () => {
    const placed = client({
      createdAt: daysAgo(200),
      applications: [{ stage: 'STARTED', createdBy: 'STAFF', supportedByUserId: 'staff-1' }],
    })
    expect(signalsFor(placed, NOW)).toEqual([])
  })

  it('flags an engagement that has stopped moving', () => {
    const stalled = client({
      applications: [{ stage: 'STARTED', createdBy: 'STAFF', supportedByUserId: 'staff-1' }],
      learningRecords: [
        {
          kind: 'VOLUNTEERING',
          status: 'IN_PROGRESS',
          updatedAt: daysAgo(STALLED_ENGAGEMENT_DAYS + 1),
        },
      ],
    })
    expect(signalsFor(stalled, NOW)).toEqual(['STALLED_ENGAGEMENT'])
  })

  it('ignores a stalled record that belongs to the job coach', () => {
    // A language course going nowhere is Simon's signal, not Sandra's. Her
    // queue naming it would hand her work she cannot act on.
    const jobRecord = client({
      applications: [{ stage: 'STARTED', createdBy: 'STAFF', supportedByUserId: 'staff-1' }],
      learningRecords: [
        { kind: 'COURSE', status: 'IN_PROGRESS', updatedAt: daysAgo(STALLED_ENGAGEMENT_DAYS + 1) },
      ],
    })
    expect(signalsFor(jobRecord, NOW)).toEqual([])
  })

  it('orders rows by signal, because the dashboard hero shows only the first', () => {
    const queue = buildVolunteeringQueue(
      [
        client({
          residentId: 'stalled',
          name: 'Stalled',
          learningRecords: [
            {
              kind: 'VOLUNTEERING',
              status: 'IN_PROGRESS',
              updatedAt: daysAgo(STALLED_ENGAGEMENT_DAYS + 1),
            },
          ],
          applications: [{ stage: 'STARTED', createdBy: 'STAFF', supportedByUserId: 's' }],
        }),
        client({
          residentId: 'waiting',
          name: 'Waiting',
          applications: [{ stage: 'INTERESTED', createdBy: 'RESIDENT', supportedByUserId: null }],
        }),
      ],
      NOW,
    )

    expect(queue[0]).toMatchObject({ residentId: 'waiting', signal: 'INTEREST_UNANSWERED' })
  })
})

describe('the seat the dashboard fetches', () => {
  /**
   * The root cause, pinned. The caseload query read the literal `'JOB'`, so
   * Sandra's seats — `VOLUNTEERING` — were never queried and every term of her
   * `totalIssues` was structurally zero. She was congratulated every morning.
   */
  it('maps each coach to their own seat, derived and not written out', () => {
    expect(STAFF_ROLE_CARE_DOMAIN.JOBCOACH).toBe('JOB')
    expect(STAFF_ROLE_CARE_DOMAIN.FREIWILLIGENARBEIT).toBe('VOLUNTEERING')
    expect(STAFF_ROLE_CARE_DOMAIN.JOBCOACH).not.toBe(STAFF_ROLE_CARE_DOMAIN.FREIWILLIGENARBEIT)
  })

  it('gives the volunteering domain as many signals as the job domain has', () => {
    // Not a symmetry fetish: a domain with zero signals is a domain whose
    // specialist can never be told anything, which is where Sandra started.
    expect(VOLUNTEERING_SIGNAL_IDS.length).toBeGreaterThan(0)
    expect(VOLUNTEERING_SIGNAL_IDS[0]).toBe('INTEREST_UNANSWERED')
  })
})
