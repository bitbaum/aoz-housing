/**
 * Two kinds of drift that neither tsc nor ESLint can see.
 *
 * 1. `evidenceForStartedApplication` passes `opportunity.kind` straight into a
 *    LearningRecord. That is only sound while every OpportunityKind is also a
 *    LearningKind. Add `INTERNSHIP` to one side in the work phase and forget
 *    the other, and the failure surfaces as a Prisma enum error at the single
 *    moment a coach is recording real work — the worst possible time.
 *
 * 2. A config array and a Prisma enum are two spellings of one fact. Nothing
 *    else in this repo compares them, so a value added to `config/` and not to
 *    `schema.prisma` type-checks, renders a form option, and fails only on
 *    save. This reads the schema file itself rather than a hand-copied list —
 *    a fixture would freeze the very drift it is meant to catch.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import {
  APPLICATION_STAGES,
  OPPORTUNITY_KINDS,
  OPPORTUNITY_STATUSES,
  PERMIT_REQUIREMENTS,
} from '@/lib/config/opportunities'
import { LEARNING_KINDS } from '@/lib/config/learning'

const SCHEMA_PATH = join(process.cwd(), 'prisma', 'schema.prisma')

function enumValuesFromSchema(name: string): string[] {
  const schema = readFileSync(SCHEMA_PATH, 'utf8')
  const match = schema.match(new RegExp(`enum ${name} \\{([^}]*)\\}`))
  if (!match) throw new Error(`enum ${name} not found in prisma/schema.prisma`)

  return match[1]
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, '').trim())
    .filter((line) => line.length > 0)
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
    expect([...configValues].sort()).toEqual(enumValuesFromSchema(enumName as string).sort())
  })

  it('actually reads the schema, and fails loudly when it cannot', () => {
    // Without this, a rename upstream turns every check above into a silent
    // pass over an empty list — the failed-fetch-as-fact trap.
    expect(enumValuesFromSchema('LearningKind').length).toBeGreaterThan(0)
    expect(() => enumValuesFromSchema('NoSuchEnum')).toThrow(/not found/)
  })
})
