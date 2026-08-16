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
