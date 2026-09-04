import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isAwaitingAnswer, type JobApplicationInput } from '@/lib/jobcoach/queue'

/**
 * "Waiting for an answer" is expressed twice — once as a predicate over a row
 * in `lib/jobcoach/queue.ts`, once as a `where` clause in
 * `lib/data/opportunities.ts` — because one of them has to run in Postgres.
 *
 * Two copies of a rule is exactly how the number on the board and the tile on
 * the dashboard come to disagree, and neither would look wrong on its own. The
 * predicate is the SSOT; this holds the SQL to it.
 */
describe('the SQL filter and the predicate say the same thing', () => {
  const sql = readFileSync(join(process.cwd(), 'src/lib/data/opportunities.ts'), 'utf8')
  const filter = sql.slice(sql.indexOf('export function awaitingAnswerFilter'))
  const body = filter.slice(0, filter.indexOf('\n}'))

  it('filters on all three fields the predicate reads', () => {
    expect(body).toContain('createdBy')
    expect(body).toContain('RESIDENT')
    expect(body).toContain('INTERESTED')
    expect(body).toContain('supportedByUserId')
  })

  it('tests supportedByUserId for null, not for a value', () => {
    // `eq(..., someId)` here would count only threads a SPECIFIC person has,
    // inverting the meaning while still compiling and still returning rows.
    expect(body).toContain('isNull(opportunityApplication.supportedByUserId)')
  })
})

describe('the predicate itself, over every combination that reaches it', () => {
  const row = (over: Partial<JobApplicationInput>): JobApplicationInput => ({
    stage: 'INTERESTED',
    createdBy: 'RESIDENT',
    supportedByUserId: null,
    ...over,
  })

  it('is true only for a resident-raised, untouched, still-INTERESTED thread', () => {
    expect(isAwaitingAnswer(row({}))).toBe(true)
  })

  it.each([
    ['staff opened it', { createdBy: 'STAFF' as const }],
    ['a coach has it', { supportedByUserId: 'u1' }],
    ['it has moved on', { stage: 'APPLIED' as const }],
    ['it was declined', { stage: 'DECLINED' as const }],
  ])('is false once %s', (_why, over) => {
    expect(isAwaitingAnswer(row(over))).toBe(false)
  })
})
