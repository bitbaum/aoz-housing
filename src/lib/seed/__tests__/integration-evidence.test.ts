/**
 * The seed's value is that its evidence never contradicts the person it
 * describes. These pin the derivation rules — not the database write, which
 * would only prove Prisma works.
 *
 * The specific failure being guarded: a German test handed to someone who
 * speaks no German (or withheld from someone who does) makes the learning
 * board's "Kein Deutsch-Test erfasst" panel either list everybody or nobody,
 * and that panel is the first thing a Jobcoach looks at.
 */

import { getTableName } from 'drizzle-orm'
import { appointment, satisfactionCheckIn } from '@/lib/db'
import { evidenceForResident, seedIntegrationEvidence } from '../integration-evidence'
import { LEARNING_PULSE_WINDOW_DAYS } from '../../config/learning'

const germanSpeaker = {
  id: 'r1',
  languages: ['Arabic', 'German'],
  ageRange: 'ADULT',
  choresContribution: 4,
}

const noGerman = {
  id: 'r2',
  languages: ['Tigrinya'],
  ageRange: 'ADULT',
  choresContribution: 2,
}

describe('evidenceForResident', () => {
  it('gives a German speaker a completed German test', () => {
    const records = evidenceForResident(germanSpeaker, 0)
    const test = records.find((r) => r.kind === 'LANGUAGE_TEST')

    expect(test).toBeDefined()
    expect(test?.languageCode).toBe('DE')
    expect(test?.status).toBe('COMPLETED')
    expect(test?.cefrLevel).toBeTruthy()
  })

  it.each([['DE'], ['de'], ['German'], ['Deutsch']])(
    'recognises German written as "%s"',
    (spelling) => {
      // Three spellings genuinely coexist in this product: the intake form
      // stores `DE`, the dev seed `de`, the demo seed `German`. Matching only
      // one produced a seeded world with ZERO German tests, in which the
      // board's "kein Deutsch-Test" panel listed every single resident.
      const records = evidenceForResident({ ...germanSpeaker, languages: [spelling] }, 0)
      expect(records.some((r) => r.kind === 'LANGUAGE_TEST')).toBe(true)
    },
  )

  it('gives someone who speaks no German a course instead of a test', () => {
    const records = evidenceForResident(noGerman, 0)

    // No test — so they DO appear in the board's "kein Deutsch-Test" panel,
    // which is the honest state and the whole point of that panel.
    expect(records.some((r) => r.kind === 'LANGUAGE_TEST')).toBe(false)
    const course = records.find((r) => r.kind === 'COURSE')
    expect(course?.status).toBe('IN_PROGRESS')
    expect(course?.category).toBe('language')
  })

  it('lands German completions inside the pulse window at EVERY position', () => {
    // Outside it, a world full of finished courses reports "0 abgeschlossen"
    // and the tile reads as broken rather than quiet. Checked across a whole
    // list, not at index 0: the first version spaced dates by an unbounded
    // `index * 3`, so it passed here and still pushed the German speaker at
    // position 20 of 25 seventy days into the past. The seeded database
    // reported ONE recent completion where four existed.
    for (let index = 0; index < 40; index++) {
      const test = evidenceForResident(germanSpeaker, index).find((r) => r.kind === 'LANGUAGE_TEST')
      const daysAgo = (Date.now() - (test?.completedAt?.getTime() ?? 0)) / (24 * 60 * 60 * 1000)

      expect(daysAgo).toBeLessThan(LEARNING_PULSE_WINDOW_DAYS)
      expect(daysAgo).toBeGreaterThan(0)
    }
  })

  it('never puts vocational training on a senior', () => {
    const senior = { ...germanSpeaker, ageRange: 'SENIOR' }
    const records = evidenceForResident(senior, 0)

    expect(records.some((r) => r.kind === 'QUALIFICATION')).toBe(false)
    expect(records.some((r) => r.category === 'vocational')).toBe(false)
  })

  it('gives volunteering only to people who already contribute at home', () => {
    const contributes = evidenceForResident({ ...noGerman, choresContribution: 5 }, 0)
    const doesNot = evidenceForResident({ ...noGerman, choresContribution: 1 }, 0)

    expect(contributes.some((r) => r.kind === 'VOLUNTEERING')).toBe(true)
    expect(doesNot.some((r) => r.kind === 'VOLUNTEERING')).toBe(false)
  })

  it('tolerates a resident whose profile fields were never filled in', () => {
    const sparse = { id: 'r3', languages: [], ageRange: null, choresContribution: null }
    const records = evidenceForResident(sparse, 0)

    // One German course, nothing invented from missing data.
    expect(records).toHaveLength(1)
    expect(records[0].kind).toBe('COURSE')
  })

  it('is deterministic — the same resident and index yield the same world', () => {
    // No Math.random: a demo can be described in advance, and a reset does
    // not silently change what a reviewer was shown yesterday.
    const first = evidenceForResident(germanSpeaker, 3).map((r) => r.title)
    const second = evidenceForResident(germanSpeaker, 3).map((r) => r.title)

    expect(first).toEqual(second)
  })

  it('varies titles across residents so the board is not one repeated row', () => {
    const titles = new Set(
      [0, 1, 2, 3].map(
        (index) =>
          evidenceForResident(germanSpeaker, index).find((r) => r.category === 'vocational')
            ?.title ?? '',
      ),
    )

    expect(titles.size).toBeGreaterThan(1)
  })

  it('never records a completion before its own start', () => {
    for (let index = 0; index < 12; index++) {
      for (const profile of [germanSpeaker, noGerman]) {
        for (const record of evidenceForResident(profile, index)) {
          if (record.startedAt && record.completedAt) {
            expect(record.completedAt.getTime()).toBeGreaterThanOrEqual(record.startedAt.getTime())
          }
        }
      }
    }
  })

  it('produces every status the board filters on', () => {
    // A board where everything shares one status demonstrates a filter that
    // looks broken.
    const statuses = new Set(
      [0, 1, 2, 3, 4, 5].flatMap((index) =>
        evidenceForResident(germanSpeaker, index).map((r) => r.status),
      ),
    )

    expect(statuses).toContain('COMPLETED')
    expect(statuses).toContain('IN_PROGRESS')
    expect(statuses).toContain('PLANNED')
  })

  it('records certificates as staff-entered and self-signups as resident-entered', () => {
    // Drives the board's "Quelle" filter, which is inert if everything shares
    // one source.
    const sources = new Set(
      [0, 1, 2].flatMap((index) =>
        evidenceForResident(germanSpeaker, index).map((r) => r.recordedBy),
      ),
    )

    expect(sources).toContain('STAFF')
    expect(sources).toContain('RESIDENT')
  })
})

/**
 * Appointments in the demo world.
 *
 * Since check-in capture moved into closing an appointment, a demo world with
 * no appointments demonstrates NO check-in at all — the visitor meets four
 * empty care panels and concludes the care team does nothing. That was a real
 * regression: two seeded, visible surfaces were removed and the replacement
 * was invisible here.
 */
describe('seeded appointments', () => {
  function makeDb() {
    const created: Record<string, Record<string, unknown>[]> = { appointment: [], checkIn: [] }
    // A drizzle-shaped stand-in for the surface seedIntegrationEvidence uses:
    // query.resident/placement.findMany, and insert(table).values(v) awaited
    // bare, with .returning() (held appointment) and .onConflictDoNothing()
    // (care seats). Dispatch is on the REAL table identity, so the assertions
    // keep the per-table discrimination the Prisma model names carried.
    const record = (table: unknown, v: unknown) => {
      const name: string = getTableName(table as typeof appointment)
      if (name === getTableName(appointment)) {
        created.appointment.push(v as Record<string, unknown>)
      }
      if (name === getTableName(satisfactionCheckIn)) {
        created.checkIn.push(v as Record<string, unknown>)
      }
    }
    const client = {
      query: {
        resident: {
          findMany: jest.fn(async () => [
            { id: 'r1', languages: ['German'], ageRange: 'ADULT', choresContribution: 4 },
            { id: 'r2', languages: ['Tigrinya'], ageRange: 'ADULT', choresContribution: 2 },
          ]),
        },
        placement: {
          // Only r1 is placed, so only r1 can carry a reading.
          findMany: jest.fn(async () => [
            { id: 'p1', residentId: 'r1', startDate: new Date('2026-01-01') },
          ]),
        },
      },
      insert: jest.fn((table: unknown) => ({
        values: (v: Record<string, unknown> | Record<string, unknown>[]) => ({
          then: (
            resolve: (x: { rowCount: number }) => unknown,
            reject?: (e: unknown) => unknown,
          ) => {
            record(table, v)
            return Promise.resolve({ rowCount: Array.isArray(v) ? v.length : 1 }).then(
              resolve,
              reject,
            )
          },
          onConflictDoNothing: () => {
            record(table, v)
            return Promise.resolve({ rowCount: 8 })
          },
          returning: async () => {
            record(table, v)
            return [{ id: `appt-${created.appointment.length}`, ...(v as Record<string, unknown>) }]
          },
        }),
      })),
    }
    return { created, client }
  }

  it('creates no appointments when the deployment has no staff account', async () => {
    const { client, created } = makeDb()

    // Same rule the care seats follow: with nobody to hold the appointment,
    // inventing a colleague would put a fake name in a real "zuständig" picker.
    const summary = await seedIntegrationEvidence(client as never, {
      residentIds: ['r1', 'r2'],
      staffId: null,
    })

    expect(summary.appointments).toBe(0)
    expect(created.appointment).toHaveLength(0)
    expect(created.checkIn).toHaveLength(0)
  })

  it('seeds both states, so the feature is visible AND touchable', async () => {
    const { client, created } = makeDb()

    await seedIntegrationEvidence(client as never, {
      residentIds: ['r1', 'r2'],
      staffId: 'staff-1',
    })

    const statuses = created.appointment.map((a) => a.status as string)
    // One already held, so the history and the attribution are visible on
    // arrival; one still open, so the visitor can close it themselves.
    expect(statuses).toContain('COMPLETED')
    expect(statuses).toContain('SCHEDULED')
  })

  it('puts the scheduled one in the future and the held one in the past', async () => {
    const { client, created } = makeDb()
    const now = Date.now()

    await seedIntegrationEvidence(client as never, {
      residentIds: ['r1', 'r2'],
      staffId: 'staff-1',
    })

    for (const appt of created.appointment) {
      const startsAt = appt.startsAt as Date
      if (appt.status === 'SCHEDULED') {
        // A backdated "upcoming" appointment is filtered out of the portal's
        // list, and the visitor never sees the thing they were meant to click.
        expect(startsAt.getTime()).toBeGreaterThan(now)
      } else {
        expect(startsAt.getTime()).toBeLessThan(now)
      }
    }
  })

  it('attaches every seeded reading to its appointment and to the account', async () => {
    const { client, created } = makeDb()

    await seedIntegrationEvidence(client as never, {
      residentIds: ['r1', 'r2'],
      staffId: 'staff-1',
    })

    expect(created.checkIn.length).toBeGreaterThan(0)
    for (const checkIn of created.checkIn) {
      // A seeded score with neither link nor collector would demonstrate the
      // behaviour this product deliberately removed.
      expect(checkIn.appointmentId).toBeTruthy()
      expect(checkIn.collectedByUserId).toBe('staff-1')
      expect(checkIn.overallSatisfaction as number).toBeGreaterThanOrEqual(1)
      expect(checkIn.overallSatisfaction as number).toBeLessThanOrEqual(5)
    }
  })

  it('skips the held appointment for a resident with no active placement', async () => {
    // A check-in hangs off a placement. r2 has none, so it gets the scheduled
    // appointment only — never a reading with nothing to attach to.
    const { client, created } = makeDb()

    await seedIntegrationEvidence(client as never, {
      residentIds: ['r1', 'r2'],
      staffId: 'staff-1',
    })

    const forR2 = created.appointment.filter((a) => a.residentId === 'r2')
    expect(forR2).toHaveLength(1)
    expect(forR2[0].status).toBe('SCHEDULED')
    expect(created.checkIn).toHaveLength(1)
  })
})
