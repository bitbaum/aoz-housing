/**
 * A filter label must not reuse a STATUS word.
 *
 * On `/residents` the filter row read "Aktiv 20" while the stat block beside it
 * read "Aktiv 3". Neither number was wrong: the filter counts everything that
 * is not archived, and the stat counts the one status called ACTIVE (erfasst,
 * noch nicht platziert). The WORD was wrong, and a reader has no way to know
 * which sense is meant — the two are eight lines apart in the same component.
 *
 * This is the same defect the nav has a test for ("a group is named for what it
 * IS"), one layer down: the label survived while the thing it named changed
 * meaning depending on where you read it.
 *
 * Asserted over the label constants rather than the rendered page, because the
 * collision is between two SSOTs and that is where it has to be prevented.
 */

import { RESIDENT_LIST_LABELS, UI_LABELS } from '../labels'
import { RESIDENT_STATUS_LABELS } from '../labels'

/** Words that name a resident STATUS. Reserved. */
const STATUS_WORDS = Object.values(RESIDENT_STATUS_LABELS).map((s) => s.toLowerCase())

describe('the view filter does not borrow a status word', () => {
  it('"Aktuell" is not a status', () => {
    expect(STATUS_WORDS).not.toContain(RESIDENT_LIST_LABELS.viewCurrent.toLowerCase())
  })

  it('and it is specifically not "Aktiv", which is one', () => {
    // The regression this exists for. `RESIDENT_STATUS_LABELS.ACTIVE` is
    // 'Aktiv'; the filter meant "not archived" and said the same word.
    expect(RESIDENT_LIST_LABELS.viewCurrent).not.toBe(RESIDENT_STATUS_LABELS.ACTIVE)
    expect(RESIDENT_LIST_LABELS.viewCurrent).not.toBe(UI_LABELS.active)
  })

  it('the archived filter still pairs with it as an opposite', () => {
    // "Aktuell" / "Archiviert" is a pair a reader can resolve without knowing
    // the status enum. That pairing is the reason for the chosen word.
    expect(UI_LABELS.archived).toBeTruthy()
    expect(RESIDENT_LIST_LABELS.viewCurrent).not.toBe(UI_LABELS.archived)
  })

  it('the status labels themselves stay distinct from each other', () => {
    // Cheap, and it would catch a future status added with a duplicate label —
    // which would make the stat block ambiguous in the other direction.
    const labels = Object.values(RESIDENT_STATUS_LABELS)
    expect(new Set(labels).size).toBe(labels.length)
  })
})
