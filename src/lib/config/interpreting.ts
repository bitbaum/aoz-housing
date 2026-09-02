import type { InterpreterNeed } from '@/lib/db'

/**
 * Interpreting — the need, and the lead time that makes it operational.
 *
 * AOZ runs Medios: roughly 80 languages, about 1000 intercultural
 * interpreters, booked on an external platform with around a day's
 * confirmation lead time. This product deliberately does NOT rebuild that
 * booking. Two reasons, and the second is the important one:
 *
 *  1. A second booking system for a service that already has one is the
 *     duplication this fleet keeps paying for.
 *  2. The failure worth preventing is not "no way to book" — staff have one.
 *     It is scheduling a meeting for tomorrow morning and discovering at the
 *     door that nobody can speak to the person, because the interpreter needed
 *     a day's notice that nobody knew to give.
 *
 * So: record the need, and say something at the moment a time is chosen.
 *
 * Worth noting what this closes. The conflict-mediation copy already tells
 * residents that Betreuung will help „zum Beispiel mit Dolmetschung", and the
 * house rules state that „die verbindliche Fassung ist Deutsch" — a resident
 * acknowledges a binding text in a language that is explicitly not the binding
 * one. The product promised interpreting and had no way to arrange or even
 * record it.
 */

/**
 * How much notice Medios needs, in hours.
 *
 * Their published process is a request confirmed "within 24 hours" once an
 * interpreter accepts. Rounded to a day rather than modelled precisely: this
 * drives a WARNING, and a warning that is exact to the minute invites arguing
 * with it instead of acting on it.
 */
export const INTERPRETER_LEAD_TIME_HOURS = 24

export const INTERPRETER_NEED_LABELS: Record<InterpreterNeed, string> = {
  NONE: 'Keine Dolmetschung nötig',
  FOR_COMPLEX: 'Bei komplexen Gesprächen',
  ALWAYS: 'Immer',
}

/** Short form for a badge beside a name. `NONE` renders nothing. */
export const INTERPRETER_NEED_BADGES: Record<InterpreterNeed, string | null> = {
  NONE: null,
  FOR_COMPLEX: 'Dolmetschung bei Bedarf',
  ALWAYS: 'Dolmetschung nötig',
}

export const INTERPRETER_LABELS = {
  sectionTitle: 'Dolmetschung',
  /** Said where a time is picked, not buried in a profile. */
  leadTimeWarning: `Für diese Person wird eine Dolmetschung gebraucht. Die Vermittlung braucht rund ${INTERPRETER_LEAD_TIME_HOURS} Stunden Vorlauf — dieser Termin ist früher.`,
  leadTimeOk: `Für diese Person wird eine Dolmetschung gebraucht. Bitte rechtzeitig vermitteln (rund ${INTERPRETER_LEAD_TIME_HOURS} Stunden Vorlauf).`,
  /** The product does not book; it says who does. */
  bookingHint: 'Die Vermittlung läuft über den Dolmetschdienst, nicht über dieses System.',
} as const

/**
 * Does this appointment need an interpreter arranged at all?
 *
 * `FOR_COMPLEX` counts: the product cannot tell which conversations are
 * complex, and guessing wrong in the quiet direction is the expensive
 * mistake — a person sitting through a consequential meeting they cannot
 * follow. Staff can ignore a prompt; they cannot un-hold a meeting.
 */
export function needsInterpreter(need: InterpreterNeed): boolean {
  return need !== 'NONE'
}

/**
 * Is there still time to arrange one before this appointment starts?
 *
 * Returns false for an appointment already in the past — there is nothing left
 * to warn about, and flagging history as urgent trains people to ignore the
 * flag.
 */
export function hasInterpreterLeadTime(startsAt: Date, now: Date): boolean {
  const hoursUntil = (startsAt.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursUntil >= INTERPRETER_LEAD_TIME_HOURS
}

export type InterpreterPrompt = 'none' | 'reminder' | 'too-late'

/**
 * What to say, if anything, when this appointment is scheduled.
 *
 * A single function so the staff form, the care workspace and any future
 * surface cannot disagree about when the warning appears.
 */
export function interpreterPrompt(
  need: InterpreterNeed,
  startsAt: Date | null,
  now: Date,
): InterpreterPrompt {
  if (!needsInterpreter(need)) return 'none'
  // No time chosen yet — the need is still worth stating, but nothing is late.
  if (!startsAt) return 'reminder'
  if (startsAt.getTime() <= now.getTime()) return 'none'
  return hasInterpreterLeadTime(startsAt, now) ? 'reminder' : 'too-late'
}
