/**
 * Two kinds of drift that neither tsc nor ESLint can see.
 *
 * 1. `evidenceForStartedApplication` passes `opportunity.kind` straight into a
 *    LearningRecord. That is only sound while every OpportunityKind is also a
 *    LearningKind. Add `INTERNSHIP` to one side in the work phase and forget
 *    the other, and the failure surfaces as a database enum error at the
 *    single moment a coach is recording real work — the worst possible time.
 *
 * 2. A config array and a database enum are two spellings of one fact.
 *    Nothing else in this repo compares them, so a value added to `config/`
 *    and not to the drizzle schema type-checks, renders a form option, and
 *    fails only on save. This reads the schema's pgEnum itself rather than a
 *    hand-copied list — a fixture would freeze the very drift it is meant to
 *    catch.
 */

import * as dbSchema from '@/lib/db/schema'
import {
  APPLICATION_STAGES,
  OPPORTUNITY_KINDS,
  OPPORTUNITY_STATUSES,
  PERMIT_REQUIREMENTS,
} from '@/lib/config/opportunities'
import { LEARNING_KINDS } from '@/lib/config/learning'

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

describe('OpportunityKind is a subset of LearningKind', () => {
  it.each([...OPPORTUNITY_KINDS])('%s is a kind a LearningRecord can hold', (kind) => {
    expect(LEARNING_KINDS as readonly string[]).toContain(kind)
  })
})

describe('config matches the database enums', () => {
  it.each([
    ['OpportunityKind', OPPORTUNITY_KINDS],
    ['OpportunityStatus', OPPORTUNITY_STATUSES],
    ['PermitRequirement', PERMIT_REQUIREMENTS],
    ['ApplicationStage', APPLICATION_STAGES],
  ])('%s', (enumName, configValues) => {
    // Sorted: declaration order is a display concern and differs legitimately.
    expect([...configValues].sort()).toEqual(enumValuesFromDb(enumName as string).sort())
  })

  it('actually reads the schema, and fails loudly when it cannot', () => {
    // Without this, a rename upstream turns every check above into a silent
    // pass over an empty list — the failed-fetch-as-fact trap.
    expect(enumValuesFromDb('LearningKind').length).toBeGreaterThan(0)
    expect(() => enumValuesFromDb('NoSuchEnum')).toThrow(/not found/)
  })
})
