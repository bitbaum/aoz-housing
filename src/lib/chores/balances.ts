/**
 * Contribution bookkeeping for household chores.
 *
 * WHY MINUTES AND NOT ROWS. Counting `TaskCompletion` rows makes emptying the
 * bin (2 min) and scrubbing the shower (25 min) worth the same, so whoever does
 * the cheap frequent things looks like the hero. Time is the unit Switzerland
 * itself uses for household work — the BFS "unbezahlte Arbeit" module values it
 * in hours on the third-party criterion — so it is also the unit a Swiss
 * institution can read without translation.
 *
 * WHY A BALANCE AND NOT A LEADERBOARD. Two findings drive this. Asked
 * separately what share of the housework they do, housemates' answers reliably
 * sum to well over 100% (Ross & Sicoly 1979) — not because anyone lies, but
 * because your own effort is more available to your memory than theirs. So the
 * ledger's job is to correct a bias EVERY member has, not to expose a culprit.
 * And roughly half of people are *conditional* cooperators who contribute only
 * while they believe others do (Fischbacher/Gächter/Fehr 2001, Zurich), which
 * means visible contribution is what keeps an honor system from decaying — the
 * visibility is the mechanism, not the enforcement.
 *
 * WHAT THIS DELIBERATELY IS NOT. There is no required monthly quota, no points
 * to earn, no karma, and no rank. An extrinsic controller bolted onto a
 * voluntary norm can crowd the norm out entirely (Frey & Jegen 2001, Zurich),
 * and in a house whose residents did not choose each other and cannot leave
 * there is no reciprocal bargain to justify the risk. This ledger informs; it
 * never prices. See also: nothing here is exposed as a per-resident ranking in
 * the resident UI, because in mixed-origin groups punishment lands on high
 * contributors about as often as on free riders (Herrmann/Thöni/Gächter 2008).
 *
 * SETTLEMENT. Unlike the money ledger there is no transfer that squares a chore
 * balance — you settle by doing the next thing. That asymmetry is the point,
 * so this module has no `simplifyDebts` counterpart on purpose.
 *
 * Sign convention mirrors lib/expenses/balances.ts: POSITIVE = this person put
 * in more time than their share (the household owes them), NEGATIVE = less.
 * Balances always sum to zero, and the tests pin that invariant.
 */

/**
 * Fallback weight when a task carries neither a logged duration nor an
 * estimate. Deliberately small: an unestimated chore should never out-weigh a
 * measured one, because that would reward vagueness.
 */
export const DEFAULT_CHORE_MINUTES = 15

export interface CompletionForBalance {
  completedById: string
  /** Actual time the completer logged, if they bothered. Wins when present. */
  durationMinutes?: number | null
  /** The task's estimate — the house's shared guess at what the job costs. */
  taskEstimatedMinutes?: number | null
}

export interface ChoreBalance {
  residentId: string
  /** Minutes this person actually contributed in the window. */
  doneMinutes: number
  /** Minutes an even split of the window's total work would have cost them. */
  shareMinutes: number
  /** doneMinutes − shareMinutes. Positive = ahead, negative = behind. */
  balanceMinutes: number
}

/**
 * Weight of a single completion. Logged duration beats the task estimate beats
 * the fallback — most specific evidence wins, which is the same precedence the
 * expense ledger uses for an amount.
 */
export function completionMinutes(completion: CompletionForBalance): number {
  const logged = completion.durationMinutes
  if (typeof logged === 'number' && logged > 0) return logged

  const estimated = completion.taskEstimatedMinutes
  if (typeof estimated === 'number' && estimated > 0) return estimated

  return DEFAULT_CHORE_MINUTES
}

/**
 * Per-resident contribution balance over whatever window the caller selected.
 *
 * `memberIds` pre-seeds the household so everyone appears (at 0) before their
 * first chore. Anyone who completed work in the window but is no longer a
 * member is included too — they were part of the household when they did it,
 * and dropping them would break the zero-sum invariant. Ordering is stable
 * (members first in the given order, then extras by id) so the page doesn't
 * reshuffle between renders.
 */
export function computeChoreBalances(
  completions: CompletionForBalance[],
  memberIds: string[] = [],
): ChoreBalance[] {
  const doneByResident = new Map<string, number>()
  for (const id of memberIds) doneByResident.set(id, 0)

  let totalMinutes = 0
  for (const completion of completions) {
    const minutes = completionMinutes(completion)
    totalMinutes += minutes
    doneByResident.set(
      completion.completedById,
      (doneByResident.get(completion.completedById) ?? 0) + minutes,
    )
  }

  const participants = doneByResident.size
  if (participants === 0) return []

  // An even split. Not the same thing as *fair*: fair division theory defines
  // fairness as envy-freeness over each person's own disutility, and equal time
  // silently assumes every chore is equally unpleasant for everyone. We do not
  // elicit per-person disutility (costly to ask, easy to game); swapping a turn
  // is the cheap decentralised approximation, which is why TaskRequest exists.
  const shareMinutes = totalMinutes / participants

  const seeded = memberIds.filter((id) => doneByResident.has(id))
  const extras = Array.from(doneByResident.keys())
    .filter((id) => !memberIds.includes(id))
    .sort()

  return [...seeded, ...extras].map((residentId) => {
    const doneMinutes = doneByResident.get(residentId) ?? 0
    return {
      residentId,
      doneMinutes,
      shareMinutes,
      balanceMinutes: doneMinutes - shareMinutes,
    }
  })
}
