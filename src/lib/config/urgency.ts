/**
 * How loudly a number on the staff dashboard is allowed to shout — SSOT.
 *
 * THE BUG THIS FIXES IS A DESIGN BUG, and it is objective rather than a matter
 * of taste. The design system this project documents says colour is rationed:
 * brand red marks the one action that matters on a screen and nothing else,
 * because that is what keeps warning and error legible as SIGNALS in a tool
 * whose whole job is surfacing conflict.
 *
 * The dashboard did the opposite. Components took a `color` prop naming a
 * palette entry — `'orange'`, `'blue'` — and callers used it to label
 * CATEGORIES: "Check-ins" was orange and "Bewohner platzieren" was blue purely
 * because someone typed those words. "Freie Plätze" was blue whenever the count
 * was above zero, which is not a status at all. The result was five saturated
 * hues competing on one screen, so nothing stood out — including the genuinely
 * critical incident, which is the only thing on that page that must.
 *
 * The fix is to stop letting callers pick colours. A caller states what is
 * TRUE; this module decides what that looks like. There is exactly one mapping,
 * so "what does amber mean here" has one answer everywhere.
 */

export type Urgency =
  /** A fact with no judgement attached. Free beds is a number, not a verdict. */
  | 'neutral'
  /** Checked, and there is nothing to do. */
  | 'ok'
  /** Someone should look at this today. */
  | 'attention'
  /** Act now. */
  | 'critical'

/** Colour for the figure itself. Everything else on the card stays neutral. */
export const URGENCY_VALUE_CLASS: Record<Urgency, string> = {
  neutral: 'text-ui-text',
  ok: 'text-status-success-text',
  attention: 'text-status-warning-text',
  critical: 'text-status-error-text',
}

/** Tinted count badge. Neutral unless the count is actually a problem. */
export const URGENCY_BADGE_CLASS: Record<Urgency, string> = {
  neutral: 'bg-ui-subtle text-ui-muted',
  ok: 'bg-status-success/15 text-status-success-text',
  attention: 'bg-status-warning/15 text-status-warning-text',
  critical: 'bg-status-error/15 text-status-error-text',
}

/**
 * The card's own edge. Only `critical` earns a coloured border — one screen
 * should never have more than a couple of these, or the border stops meaning
 * anything and becomes decoration again.
 */
export const URGENCY_BORDER_CLASS: Record<Urgency, string> = {
  neutral: '',
  ok: '',
  attention: '',
  critical: 'border-status-error/40',
}

/**
 * Grade a count where zero is the good outcome: overdue check-ins, open
 * maintenance, unresolved conflicts.
 *
 * Thresholds live here rather than being re-typed at each call site, which is
 * how the same count came to be "yellow" in one card and "red" in another.
 */
export function urgencyForOpenCount(count: number, criticalFrom = 4): Urgency {
  if (count === 0) return 'ok'
  return count >= criticalFrom ? 'critical' : 'attention'
}

/**
 * Grade a streak where MORE is better — days without a conflict. Inverted from
 * the above, and easy to get backwards, which is why it is written once.
 */
export function urgencyForGoodStreak(days: number, goodFrom = 7, okFrom = 3): Urgency {
  if (days >= goodFrom) return 'ok'
  return days >= okFrom ? 'attention' : 'critical'
}
