import * as dbSchema from '@/lib/db/schema'
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_BADGES,
  APPOINTMENT_STATUS_LABELS,
} from '@/lib/config/care'

/**
 * A config array and a database enum are two spellings of one fact.
 *
 * `mapAppointment` casts the database value straight into `AppointmentStatusId`,
 * and a cast is not a check. A status that exists in the database and not here
 * renders its label as `undefined` — a blank chip where a state should be, with
 * tsc, ESLint and the page all green. That is exactly how REQUESTED could have
 * shipped: the migration adds it, the enum accepts it, and the UI shows nothing.
 *
 * Reads the drizzle schema's pgEnum rather than a hand-copied list, because a
 * fixture would freeze the very drift it is meant to catch.
 */

function enumValuesFromDb(name: string): string[] {
  for (const exported of Object.values(dbSchema)) {
    if (
      typeof exported === 'function' &&
      'enumName' in exported &&
      (exported as { enumName: string }).enumName === name
    ) {
      return [...(exported as unknown as { enumValues: string[] }).enumValues]
    }
  }
  throw new Error(`enum ${name} not found in the drizzle schema`)
}

describe('appointment statuses match the database', () => {
  it('has exactly the values the schema declares', () => {
    // Sorted: declaration order is a display concern and differs legitimately.
    expect([...APPOINTMENT_STATUSES].sort()).toEqual(enumValuesFromDb('AppointmentStatus').sort())
  })

  it('actually reads the schema, and fails loudly when it cannot', () => {
    // Without this, a rename upstream turns the check above into a silent pass
    // over an empty list — the failed-fetch-as-fact trap.
    expect(enumValuesFromDb('AppointmentStatus').length).toBeGreaterThan(0)
    expect(() => enumValuesFromDb('NoSuchEnum')).toThrow(/not found/)
  })

  it('labels and badges every status, so none can render blank', () => {
    for (const status of APPOINTMENT_STATUSES) {
      expect(APPOINTMENT_STATUS_LABELS[status]).toBeTruthy()
      expect(APPOINTMENT_STATUS_BADGES[status]).toBeTruthy()
    }
  })
})
