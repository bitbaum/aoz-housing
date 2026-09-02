import {
  INTERPRETER_LEAD_TIME_HOURS,
  hasInterpreterLeadTime,
  interpreterPrompt,
  needsInterpreter,
} from '../interpreting'

/**
 * The failure this exists to prevent: a meeting booked for tomorrow morning
 * with nobody able to speak to the person once it starts, because the
 * interpreter needed a day's notice nobody knew to give.
 */

const NOW = new Date('2026-09-02T09:00:00Z')
const hoursFromNow = (h: number) => new Date(NOW.getTime() + h * 60 * 60 * 1000)

describe('who needs one', () => {
  it('treats FOR_COMPLEX as needing one', () => {
    // The product cannot tell which conversations are complex, and guessing
    // wrong in the quiet direction is the expensive mistake — someone sitting
    // through a consequential meeting they cannot follow. Staff can ignore a
    // prompt; they cannot un-hold a meeting.
    expect(needsInterpreter('FOR_COMPLEX')).toBe(true)
    expect(needsInterpreter('ALWAYS')).toBe(true)
    expect(needsInterpreter('NONE')).toBe(false)
  })
})

describe('is there still time to arrange one', () => {
  it('accepts an appointment further out than the lead time', () => {
    expect(hasInterpreterLeadTime(hoursFromNow(INTERPRETER_LEAD_TIME_HOURS + 1), NOW)).toBe(true)
  })

  it('accepts one exactly at the boundary', () => {
    // Exactly 24h is enough by the published process, so the boundary is
    // inclusive. An off-by-one here would nag on every correctly-booked
    // appointment, which is how a warning gets ignored.
    expect(hasInterpreterLeadTime(hoursFromNow(INTERPRETER_LEAD_TIME_HOURS), NOW)).toBe(true)
  })

  it('rejects one inside the lead time', () => {
    expect(hasInterpreterLeadTime(hoursFromNow(INTERPRETER_LEAD_TIME_HOURS - 1), NOW)).toBe(false)
    expect(hasInterpreterLeadTime(hoursFromNow(2), NOW)).toBe(false)
  })
})

describe('what to say when a time is chosen', () => {
  it('says nothing for someone who does not need one', () => {
    expect(interpreterPrompt('NONE', hoursFromNow(1), NOW)).toBe('none')
    expect(interpreterPrompt('NONE', null, NOW)).toBe('none')
  })

  it('reminds when there is still time', () => {
    expect(interpreterPrompt('ALWAYS', hoursFromNow(48), NOW)).toBe('reminder')
    expect(interpreterPrompt('FOR_COMPLEX', hoursFromNow(48), NOW)).toBe('reminder')
  })

  it('warns when the appointment is sooner than the lead time', () => {
    expect(interpreterPrompt('ALWAYS', hoursFromNow(3), NOW)).toBe('too-late')
  })

  it('reminds, without warning, before a time is picked', () => {
    // The need is worth stating while the form is still empty; nothing is
    // late yet, and crying "too late" at an unset field is noise.
    expect(interpreterPrompt('ALWAYS', null, NOW)).toBe('reminder')
  })

  it('says nothing about an appointment already in the past', () => {
    // Flagging history as urgent is how a warning stops being read.
    expect(interpreterPrompt('ALWAYS', hoursFromNow(-5), NOW)).toBe('none')
  })
})

describe('the product does not book the interpreter', () => {
  it('states a lead time rather than implementing a queue', () => {
    // Medios has a booking platform. A second one here is the duplication
    // this fleet keeps paying for; the value is knowing IN TIME, not booking.
    expect(INTERPRETER_LEAD_TIME_HOURS).toBeGreaterThan(0)
    expect(INTERPRETER_LEAD_TIME_HOURS).toBeLessThanOrEqual(48)
  })
})
