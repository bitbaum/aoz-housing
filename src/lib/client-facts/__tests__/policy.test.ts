import { describe, expect, it } from 'vitest'

import {
  CLIENT_FACT_KINDS,
  RENEWAL_NOTICE_DAYS,
  daysUntil,
  mayReadFact,
  mayReviewFact,
  readableFactKinds,
  renewalState,
  type FactViewer,
} from '@/lib/client-facts/policy'

/**
 * Who sees which fact, and what a date means.
 *
 * The interesting cases are all the NEGATIVE ones. A blanket "the care team
 * sees the client's facts" grant would pass every positive test here and hand
 * a Jobcoach the list of doctors somebody visits.
 */

const viewer = (scope: string, seats: FactViewer['seatsForClient']): FactViewer => ({
  scope,
  seatsForClient: seats,
})

const betreuung = viewer('OWN_DOMAIN', ['HOUSING'])
const sozialarbeit = viewer('OWN_DOMAIN', ['SOCIAL'])
const jobcoach = viewer('OWN_DOMAIN', ['JOB'])
const volunteering = viewer('OWN_DOMAIN', ['VOLUNTEERING'])
const oversight = viewer('ALL_DOMAINS', [])
const stranger = viewer('OWN_DOMAIN', [])

describe('per fact, not per person', () => {
  it('gives the Jobcoach the permit', () => {
    // Which work is lawful is their job, and `permitRequirement` on an
    // opportunity is already a claim about exactly this.
    expect(mayReadFact('PERMIT', jobcoach)).toBe(true)
  })

  it('does NOT give the Jobcoach the insurance or the doctors', () => {
    expect(mayReadFact('INSURANCE', jobcoach)).toBe(false)
    expect(mayReadFact('HEALTH_CONTACT', jobcoach)).toBe(false)
  })

  it('gives Betreuung and Sozialarbeit everything', () => {
    for (const kind of CLIENT_FACT_KINDS) {
      expect(mayReadFact(kind, betreuung)).toBe(true)
      expect(mayReadFact(kind, sozialarbeit)).toBe(true)
    }
  })

  it('gives the volunteering coordinator nothing', () => {
    // Volunteering is the channel deliberately kept free of permit questions,
    // so there is no reason for the seat to carry any of this.
    for (const kind of CLIENT_FACT_KINDS) {
      expect(mayReadFact(kind, volunteering)).toBe(false)
    }
  })

  it('gives a staff member holding no seat for this client nothing', () => {
    for (const kind of CLIENT_FACT_KINDS) {
      expect(mayReadFact(kind, stranger)).toBe(false)
    }
  })

  it('gives oversight over every domain everything', () => {
    for (const kind of CLIENT_FACT_KINDS) {
      expect(mayReadFact(kind, oversight)).toBe(true)
    }
  })

  it('lists only the readable kinds', () => {
    expect(readableFactKinds(jobcoach)).toEqual(['PERMIT'])
    expect(readableFactKinds(volunteering)).toEqual([])
    expect(readableFactKinds(betreuung)).toEqual([...CLIENT_FACT_KINDS])
  })
})

describe('reading is not vouching', () => {
  it('lets the Jobcoach read a permit but not confirm it', () => {
    // Confirming is Betreuung's job. A coach who could mark a permit as seen
    // would be recording a check nobody performed.
    expect(mayReadFact('PERMIT', jobcoach)).toBe(true)
    expect(mayReviewFact('PERMIT', jobcoach)).toBe(false)
  })

  it('lets Betreuung and Sozialarbeit confirm', () => {
    expect(mayReviewFact('INSURANCE', betreuung)).toBe(true)
    expect(mayReviewFact('PERMIT', sozialarbeit)).toBe(true)
  })

  it('never lets someone confirm what they may not read', () => {
    for (const kind of CLIENT_FACT_KINDS) {
      for (const who of [jobcoach, volunteering, stranger]) {
        if (!mayReadFact(kind, who)) expect(mayReviewFact(kind, who)).toBe(false)
      }
    }
  })
})

describe('what a date means', () => {
  const now = new Date('2026-09-07T10:00:00Z')

  it('says nothing about an undated fact', () => {
    // A doctor does not expire, and an insurance whose date the client has not
    // found yet must not render as a problem with them.
    expect(renewalState(null, now)).toBe('none')
    expect(daysUntil(null, now)).toBeNull()
  })

  it('flags an expiry inside the notice period', () => {
    const soon = new Date(now.getTime() + (RENEWAL_NOTICE_DAYS - 1) * 24 * 60 * 60 * 1000)
    expect(renewalState(soon, now)).toBe('due')
  })

  it('stays quiet well before it', () => {
    const later = new Date(now.getTime() + (RENEWAL_NOTICE_DAYS + 10) * 24 * 60 * 60 * 1000)
    expect(renewalState(later, now)).toBe('ok')
  })

  it('separates expired from merely due', () => {
    // They call for different sentences: one is "book an appointment", the
    // other is "you are currently uninsured", and collapsing them is how the
    // second gets read as the first.
    const past = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    expect(renewalState(past, now)).toBe('expired')
  })

  it('counts whole days regardless of time of day', () => {
    // Off-by-one here means a notice fires a day late, and the whole point is
    // that it arrives while there is still time to act calmly.
    const tomorrowEarly = new Date('2026-09-08T01:00:00Z')
    expect(daysUntil(tomorrowEarly, now)).toBe(1)
    const todayLate = new Date('2026-09-07T23:59:00Z')
    expect(daysUntil(todayLate, now)).toBe(0)
  })

  it('gives a renewal enough room to be arranged', () => {
    // A Swiss insurance change has a notice period and a permit renewal needs
    // an appointment. A warning in the final week is a warning about something
    // already too late to do calmly.
    expect(RENEWAL_NOTICE_DAYS).toBeGreaterThanOrEqual(30)
  })
})
