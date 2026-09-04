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

describe('the demo world can produce the state too', () => {
  /**
   * The seed already holds itself to "never seed a world the running code
   * cannot produce" — it mints a LearningRecord for STARTED because that is
   * what a real stage change does. The application row broke its own rule one
   * field along: it marked INTERESTED rows `createdBy: 'RESIDENT'` and then
   * set a `supportedByUserId` anyway, which `recordInterest` never does.
   *
   * Two costs, and the second is the one that matters: the demo contained a
   * row shaped like nothing the product writes, and "Wartet auf Antwort" was
   * permanently empty in the only place anyone looks at this feature before
   * adopting it. An unseen feature reads as a missing one.
   */
  const seed = readFileSync(join(process.cwd(), 'src/lib/seed/opportunities.ts'), 'utf8')

  it('leaves a resident-raised interest unclaimed, as the portal does', () => {
    expect(seed).toContain("supportedByUserId: stage === 'INTERESTED' ? null : ctx.staffId")
  })

  it('still records who is supporting every thread that has moved on', () => {
    // The opposite mistake — nulling it everywhere — would make every demo
    // thread look abandoned and the queue read as the whole caseload.
    expect(seed).toContain('ctx.staffId')
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
