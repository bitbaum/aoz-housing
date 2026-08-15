/**
 * The settle-up copy must read as a sentence to the person confirming it.
 *
 * `suggestedPays` ('zahlt an') is a verb phrase that only works with a PERSON
 * in the subject slot — "Ana zahlt an Bea CHF 5". The confirm dialog reused it
 * with the AMOUNT in that slot and asked residents "CHF 16.65 zahlt an Fatima?"
 * before moving money between flatmates. A label fragment is not portable
 * across grammatical roles, and German is less forgiving about it than English.
 */

import { PORTAL_LABELS } from '../labels/portal'

const L = PORTAL_LABELS.expenses

describe('settle-up confirmation copy', () => {
  it('asks a grammatical question, with the amount as the object', () => {
    expect(L.markPaidConfirm('CHF 16.65', 'Fatima')).toBe(
      'CHF 16.65 an Fatima als bezahlt erfassen?'
    )
  })

  it('never puts the amount in front of the verb phrase', () => {
    // The exact shape of the old bug: "<amount> zahlt an <name>?"
    const rendered = L.markPaidConfirm('CHF 16.65', 'Fatima')
    expect(rendered).not.toMatch(/^CHF [\d.]+ zahlt an/)
  })

  it('keeps the list phrasing, where a person IS the subject', () => {
    expect(L.suggestedPays).toBe('zahlt an')
  })
})
