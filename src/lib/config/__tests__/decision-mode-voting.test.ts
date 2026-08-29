/**
 * Safety and non-discrimination are never put to a vote, so the UI must not
 * quote a vote threshold for them. Showing "Mehrheit — mehr als die Hälfte der
 * abgegebenen Stimmen" beside "Die Betreuung entscheidet" promises residents a
 * majority that will never be counted, on exactly the topics where a majority
 * must not decide.
 */

import { CATEGORY_DECISION_MODE, DECISION_MODE_IS_VOTED } from '../decisions'
import type { DecisionMode } from '@prisma/client'

describe('DECISION_MODE_IS_VOTED', () => {
  it('marks staff-decided proposals as never voted on', () => {
    expect(DECISION_MODE_IS_VOTED.STAFF_ONLY).toBe(false)
  })

  it('marks both resident modes as voted on', () => {
    expect(DECISION_MODE_IS_VOTED.RESIDENT_BINDING).toBe(true)
    expect(DECISION_MODE_IS_VOTED.RESIDENT_ADVISORY).toBe(true)
  })

  it('covers every decision mode the schema allows', () => {
    const modes = Object.keys(CATEGORY_DECISION_MODE).map(
      (category) => CATEGORY_DECISION_MODE[category as keyof typeof CATEGORY_DECISION_MODE],
    )
    for (const mode of modes) {
      expect(DECISION_MODE_IS_VOTED[mode]).toBeDefined()
    }
  })

  it('never puts safety or respect to a vote', () => {
    const notVoted: DecisionMode[] = ['STAFF_ONLY']
    expect(notVoted).toContain(CATEGORY_DECISION_MODE.SAFETY)
    expect(notVoted).toContain(CATEGORY_DECISION_MODE.RESPECT)
    expect(DECISION_MODE_IS_VOTED[CATEGORY_DECISION_MODE.SAFETY]).toBe(false)
    expect(DECISION_MODE_IS_VOTED[CATEGORY_DECISION_MODE.RESPECT]).toBe(false)
  })
})
