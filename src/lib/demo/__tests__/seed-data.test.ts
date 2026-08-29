/**
 * Tests for the demo presentation narrative (lib/demo/seed-data.ts).
 *
 * The property that makes the scoped reset SAFE: every unit and resident the
 * seed creates must carry a demo code prefix (or be the configured login
 * code), because deletion targets prefixes — an unprefixed code would leak a
 * row that survives every reset and can never be cleaned up.
 */

import { seedDemoData } from '../seed-data'
import {
  DEMO_RESIDENT_CODE_PREFIX,
  DEMO_UNIT_CODE_PREFIX,
  resolveDemoResidentCode,
} from '../config'
import type { PrismaClient } from '@prisma/client'
import { natureOfKind } from '../../config/marketplace'

interface Recorded {
  unitCodes: string[]
  residentCodes: string[]
  expenses: Array<{ amountRappen: number; shares: { create: Array<{ amountRappen: number }> } }>
  taskTitles: string[]
  proposalStatuses: string[]
  appointmentStatuses: string[]
  maintenanceStatuses: string[]
  maintenance: Array<{ status: string; resolution?: string | null; reportedById?: string }>
  unitRuleTitles: string[]
  /** Resident code → the id the mock handed back, so ownership is assertable. */
  residentIdsByCode: Record<string, string>
  /** Resident code → the display name the seed chose (null if it chose none). */
  residentNamesByCode: Record<string, string | null>
  /** Every residentId that received a learning record. */
  learningResidentIds: string[]
  /** Marketplace posts, so both halves of the board can be asserted. */
  marketplaceKinds: string[]
  /** House events, so the tour is checked for something upcoming AND past. */
  eventStartsAt: Date[]
  /** External activities — only the FULL reset scope may create these. */
  activityCategories: string[]
}

function createPrismaMock(): { prisma: PrismaClient; recorded: Recorded } {
  const recorded: Recorded = {
    unitCodes: [],
    residentCodes: [],
    expenses: [],
    taskTitles: [],
    proposalStatuses: [],
    appointmentStatuses: [],
    maintenanceStatuses: [],
    maintenance: [],
    unitRuleTitles: [],
    residentIdsByCode: {},
    residentNamesByCode: {},
    learningResidentIds: [],
    marketplaceKinds: [],
    eventStartsAt: [],
    activityCategories: [],
  }
  let id = 0

  // A small STORE, not a set of empty stubs: `findMany` returns what was
  // created. Filtering is deliberately unimplemented — the seed's only
  // findMany asks for every demo-prefixed resident, and the test below proves
  // every resident the seed creates carries that prefix, so "everything" and
  // "everything matching" are the same set here.
  const model = (onCreate?: (data: Record<string, unknown>, newId: string) => void) => {
    const rows: Array<Record<string, unknown>> = []
    return {
      create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        const newId = `id-${++id}`
        rows.push({ ...data, id: newId })
        onCreate?.(data, newId)
        return Promise.resolve({ ...data, id: newId })
      }),
      createMany: jest.fn(({ data }: { data: Array<Record<string, unknown>> }) => {
        // Same recording hook as `create`. Without this a model written via
        // createMany records nothing, and an assertion about it passes on an
        // empty array — green because it never looked.
        for (const row of data) {
          const newId = `id-${++id}`
          rows.push({ ...row, id: newId })
          onCreate?.(row, newId)
        }
        return Promise.resolve({ count: data.length })
      }),
      count: jest.fn(() => Promise.resolve(0)),
      findMany: jest.fn(() => Promise.resolve(rows)),
    }
  }

  const prisma = {
    housingUnit: model((d) => recorded.unitCodes.push(d.code as string)),
    resident: model((d, newId) => {
      recorded.residentCodes.push(d.code as string)
      recorded.residentIdsByCode[d.code as string] = newId
      recorded.residentNamesByCode[d.code as string] =
        (d.displayName as string | undefined) ?? null
    }),
    placementSpot: model(),
    placement: model(),
    incident: model(),
    incidentInvolvement: model(),
    expense: model((d) => recorded.expenses.push(d as Recorded['expenses'][number])),
    settlement: model(),
    // The living-together half of the demo world (seed-governance.ts).
    householdTask: model((d) => recorded.taskTitles.push(d.title as string)),
    taskCompletion: model(),
    taskAttentionFlag: model(),
    proposal: model((d) => recorded.proposalStatuses.push(d.status as string)),
    maintenanceRequest: model((d) => {
      recorded.maintenanceStatuses.push(d.status as string)
      recorded.maintenance.push(d as Recorded['maintenance'][number])
    }),
    // The integration pillar (lib/seed/integration-evidence.ts).
    learningRecord: model((d) => recorded.learningResidentIds.push(d.residentId as string)),
    careAssignment: model(),
    // Appointments, and the reading a completed one carries. Absent from
    // this mock the seed threw on `appointment.create` — which is the mock
    // telling the truth: the seed genuinely writes these now.
    appointment: model((d) => recorded.appointmentStatuses.push(d.status as string)),
    satisfactionCheckIn: model(),
    // Gemeinschaft: the board, the calendar and the external catalogue.
    marketplacePost: model((d) => recorded.marketplaceKinds.push(d.kind as string)),
    houseEvent: model((d) => recorded.eventStartsAt.push(d.startsAt as Date)),
    eventRsvp: model(),
    activity: model((d) => recorded.activityCategories.push(d.category as string)),
    houseRule: {
      ...model((d) => recorded.unitRuleTitles.push(d.title as string)),
      findUnique: jest.fn(() => Promise.resolve({ id: 'org-night-quiet' })),
    },
  }
  return { prisma: prisma as unknown as PrismaClient, recorded }
}

beforeEach(() => {
  delete process.env.DEMO_RESIDENT_CODE
})

describe('seedDemoData', () => {
  it('creates the full presentation narrative: 5 units, 15 residents', async () => {
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    expect(recorded.unitCodes).toHaveLength(5)
    expect(recorded.residentCodes).toHaveLength(15)
  })

  it('gives EVERY unit a demo-prefixed code, so the scoped reset can find it', async () => {
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    for (const code of recorded.unitCodes) {
      expect(code).toMatch(new RegExp(`^${DEMO_UNIT_CODE_PREFIX}`))
    }
  })

  it('gives EVERY resident a demo-prefixed code or the configured login code', async () => {
    process.env.DEMO_RESIDENT_CODE = 'RES-CUSTOM'
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    for (const code of recorded.residentCodes) {
      if (code === 'RES-CUSTOM') continue
      expect(code).toMatch(new RegExp(`^${DEMO_RESIDENT_CODE_PREFIX}`))
    }
    expect(recorded.residentCodes).toContain('RES-CUSTOM')
  })

  it('gives EVERY demo resident a name — the narrative already uses one', async () => {
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)

    // The incident texts name Alexei and Petro; the resident rows used to carry
    // no displayName, so the chore board and the queues called the same person
    // "RES-DEMO07". A visitor meeting one human under two identities is looking
    // at a bug in the tour. (Real residents still start nameless by default —
    // this is the demo's story, not the privacy rule.)
    const nameless = Object.entries(recorded.residentNamesByCode)
      .filter(([, name]) => !name)
      .map(([code]) => code)

    expect(nameless).toEqual([])
  })

  it('assigns the demo login code to a resident (the portal tour identity)', async () => {
    const { prisma, recorded } = createPrismaMock()
    const summary = await seedDemoData(prisma)
    expect(summary.demoResidentCode).toBe(resolveDemoResidentCode())
    expect(recorded.residentCodes).toContain(summary.demoResidentCode)
  })

  it('keeps every expense internally consistent: shares sum to the amount', async () => {
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    expect(recorded.expenses.length).toBeGreaterThan(0)
    for (const expense of recorded.expenses) {
      const sum = expense.shares.create.reduce((acc, s) => acc + s.amountRappen, 0)
      expect(sum).toBe(expense.amountRappen)
    }
  })

  // An empty page reads as a missing feature. These pin the surfaces that
  // shipped empty and made the tour look like less than the product is.
  it('fills the chore board, so the tour never shows "Noch keine Aufgaben"', async () => {
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    expect(recorded.taskTitles.length).toBeGreaterThan(0)
  })

  it('fills the maintenance board with both open and finished work', async () => {
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    expect(recorded.maintenanceStatuses).toContain('OPEN')
    expect(recorded.maintenanceStatuses).toContain('COMPLETED')
  })

  it('fills BOTH halves of the marketplace, so the service side is not invisible', async () => {
    // A demo showing only furniture teaches a visitor that the board handles
    // objects — which is precisely the belief the service half exists to end.
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)

    const halves = recorded.marketplaceKinds.map((kind) => natureOfKind(kind as never))
    expect({
      goods: halves.includes('GOODS'),
      services: halves.includes('SERVICE'),
    }).toEqual({ goods: true, services: true })
  })

  it('seeds an event that has not happened yet AND one that has', async () => {
    // Only past events means an empty "Kommt" section and no RSVP to press;
    // only future ones means the "Vorbei" record never appears at all.
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    const now = Date.now()

    expect({
      upcoming: recorded.eventStartsAt.some((date) => date.getTime() > now),
      past: recorded.eventStartsAt.some((date) => date.getTime() < now),
    }).toEqual({ upcoming: true, past: true })
  })

  it('creates NO external activity under the default (scoped) options', async () => {
    // The safety property. An Activity has no unit and no code, so a reset that
    // deletes by demo prefix can never reach one. On an instance sharing a
    // database with a real flat they would accumulate nightly and show real
    // residents invented offers with invented phone numbers.
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)

    expect(recorded.activityCategories).toEqual([])
  })

  it('creates the activity catalogue only when the caller owns the whole database', async () => {
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma, { siteWideContent: true })

    // One per category, so every position in the portal's filter row returns
    // something — a filter landing on "Keine Ergebnisse" reads as broken, not
    // as empty.
    expect(new Set(recorded.activityCategories).size).toBe(
      recorded.activityCategories.length
    )
    expect(recorded.activityCategories.length).toBeGreaterThanOrEqual(6)
  })

  it('gives the DEMO LOGIN an answered report — a reply to a roommate proves nothing', async () => {
    const { prisma, recorded } = createPrismaMock()
    const summary = await seedDemoData(prisma)
    const demoId = recorded.residentIdsByCode[summary.demoResidentCode]
    const answered = recorded.maintenance.filter((m) => m.status === 'COMPLETED' && m.resolution)
    expect(answered.some((m) => m.reportedById === demoId)).toBe(true)
  })

  it('seeds a proposal ALREADY IN VOTING — a fresh one could never reach a vote', async () => {
    // Voting opens after a 3-day discussion window and the demo world is wiped
    // nightly, so an un-backdated proposal makes the ballot unreachable forever.
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    expect(recorded.proposalStatuses).toContain('VOTING')
  })

  it('seeds a decided proposal and one awaiting staff, so both queues have content', async () => {
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    expect(recorded.proposalStatuses).toContain('ACCEPTED')
    expect(recorded.proposalStatuses).toContain('NEEDS_STAFF_CONFIRMATION')
    expect(recorded.proposalStatuses).toContain('DISCUSSION')
  })

  it('adopts a house rule from the accepted proposal, so the two tiers are visible', async () => {
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    expect(recorded.unitRuleTitles.length).toBeGreaterThan(0)
  })

  // ── Integration pillar ────────────────────────────────────────────────────
  //
  // This shipped blank: /learning rendered five zeroes and an empty list on a
  // demo world of fifteen people, and a Jobcoach evaluating the product
  // concluded the pillar was unbuilt.

  it('gives EVERY demo resident integration evidence', async () => {
    const { prisma, recorded } = createPrismaMock()
    const summary = await seedDemoData(prisma)

    const withEvidence = new Set(recorded.learningResidentIds)
    const everyResidentId = Object.values(recorded.residentIdsByCode)

    expect(summary.learningRecords).toBeGreaterThan(0)
    expect(everyResidentId.length).toBeGreaterThan(0)
    for (const residentId of everyResidentId) {
      expect(withEvidence.has(residentId)).toBe(true)
    }
  })

  it('assigns the care seats when the deployment has a staff account', async () => {
    // Without an assignment, "Meine Klient*innen" — the DEFAULT view for every
    // non-Leitung role — is empty however full the database is.
    const { prisma } = createPrismaMock()
    const summary = await seedDemoData(prisma, { careStaffId: 'demo-staff' })

    expect(summary.careAssignments).toBeGreaterThan(0)
  })

  it('seeds an appointment already held AND one still to hold', async () => {
    // Recording a check-in now happens ONLY when staff close an appointment.
    // A demo world without them therefore demonstrates no check-in at all, and
    // a visitor meets four empty care panels — the same failure the chore and
    // proposal seeds exist to prevent. COMPLETED shows what the feature
    // produces; SCHEDULED is the one the visitor gets to close themselves.
    const { prisma, recorded } = createPrismaMock()
    const summary = await seedDemoData(prisma, { careStaffId: 'demo-staff' })

    expect(summary.appointments).toBeGreaterThan(0)
    expect(recorded.appointmentStatuses).toContain('COMPLETED')
    expect(recorded.appointmentStatuses).toContain('SCHEDULED')
  })

  it('seeds no appointments without a staff account to hold them', async () => {
    const { prisma, recorded } = createPrismaMock()
    const summary = await seedDemoData(prisma)

    expect(summary.appointments).toBe(0)
    expect(recorded.appointmentStatuses).toHaveLength(0)
  })

  it('invents no colleague when the deployment has no demo staff door', async () => {
    // A fake staff row would appear in every real "zuständig" picker on an
    // instance that also holds real data.
    const { prisma } = createPrismaMock()
    const summary = await seedDemoData(prisma)

    expect(summary.careAssignments).toBe(0)
    expect(summary.learningRecords).toBeGreaterThan(0)
  })
})
