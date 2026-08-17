/**
 * Time as the reader experiences it — computed once, on the server.
 *
 * THE BUG THIS EXISTS TO PREVENT. `'use client'` does not mean "runs only in
 * the browser": Next server-renders those components too. So
 * `new Date().getHours()` inside one runs TWICE — once in the container, which
 * is UTC, and once in the browser, which is Europe/Zurich. For two hours every
 * day the two disagree, the greeting differs between the two renders, and React
 * throws away the entire server-rendered tree and re-renders on the client
 * (React errors 425 and 422). It was happening on the staff dashboard in
 * production, visible only in the console: the page looked fine, it was just
 * being built twice and losing the benefit of server rendering.
 *
 * The fix is not to guess the timezone better. It is to compute the value in
 * ONE place and pass it down, so there is nothing for the two renders to
 * disagree about. Both of these take an explicit instant and an explicit zone.
 */

/** Where this product lives. Not the server's zone, and not the browser's. */
export const APP_TIME_ZONE = 'Europe/Zurich'

export type DayPart = 'morning' | 'day' | 'evening'

/**
 * Which part of the day it is in Zurich.
 *
 * Takes the instant as an argument rather than calling `new Date()` itself, so
 * a test can ask about 06:00 in December without waiting for December.
 */
export function dayPartAt(now: Date, timeZone: string = APP_TIME_ZONE): DayPart {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: 'numeric',
      hour12: false,
    }).format(now)
  )

  if (hour < 12) return 'morning'
  return hour < 18 ? 'day' : 'evening'
}

/** "Sonntag, 16. August" in Zurich, regardless of where this runs. */
export function formatWeekdayDate(
  now: Date,
  locale = 'de-CH',
  timeZone: string = APP_TIME_ZONE
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now)
}

/** Date and time a resident or caseworker actually means — Zurich, not UTC. */
export function formatZurichDateTime(date: Date, locale = 'de-CH'): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

/**
 * Wall-clock in Zurich as `YYYY-MM-DDTHH:mm` for `<input type="datetime-local">`.
 * The input has no timezone; we always mean Europe/Zurich.
 */
export function toDatetimeLocalInput(date: Date, timeZone: string = APP_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/**
 * Read a datetime-local value as a Zurich wall-clock instant.
 * Tries CET and CEST and keeps the offset that round-trips.
 */
export function fromDatetimeLocalInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const wall = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}`
  for (const offset of ['+02:00', '+01:00'] as const) {
    const instant = new Date(`${wall}:00${offset}`)
    if (Number.isNaN(instant.getTime())) continue
    if (toDatetimeLocalInput(instant) === wall) return instant
  }
  const fallback = new Date(`${wall}:00+01:00`)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}
