/**
 * Monthly statements — "what happened this month, per person".
 *
 * A statement is a pure function of the expense history: per calendar month
 * (Europe/Zurich), each person's paid total, their share of consumption, and
 * the net (paid − share). Nets within a month always sum to zero.
 *
 * Deliberately expense-only: settlements are debt REPAYMENT, not consumption,
 * so they belong to the cumulative who-owes-whom view (computeBalances), not
 * to a month's consumption record. The two views answer different questions:
 * "what did this month cost us?" here, "who owes whom right now?" there.
 */

import type { ExpenseForBalance } from './balances'

export interface ExpenseForStatement extends ExpenseForBalance {
  date: Date
}

export interface MonthlyPersonRow {
  residentId: string
  paidRappen: number
  shareRappen: number
  /** paid − share; positive = subsidised the household this month. */
  netRappen: number
}

export interface MonthlyStatement {
  /** Sortable key, e.g. "2026-08". */
  monthKey: string
  /** Display label, e.g. "August 2026". */
  monthLabel: string
  totalRappen: number
  expenseCount: number
  rows: MonthlyPersonRow[]
}

const ZURICH = 'Europe/Zurich'

/** Calendar month of a date in the household's own timezone, as "YYYY-MM". */
export function monthKeyOf(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZURICH,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date)
  const year = parts.find((p) => p.type === 'year')!.value
  const month = parts.find((p) => p.type === 'month')!.value
  return `${year}-${month}`
}

function monthLabelOf(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  // Mid-month noon UTC is the same calendar month in every relevant timezone.
  const anchor = new Date(Date.UTC(year, month - 1, 15, 12))
  return anchor.toLocaleDateString('de-CH', { timeZone: ZURICH, month: 'long', year: 'numeric' })
}

/**
 * Group expenses into per-month statements, newest month first. Rows cover
 * everyone who appears in the month (plus `memberIds`, so current roommates
 * show a zero line instead of vanishing), sorted by paid desc then id.
 */
export function monthlyStatements(
  expenses: ExpenseForStatement[],
  memberIds: string[] = [],
): MonthlyStatement[] {
  const byMonth = new Map<string, ExpenseForStatement[]>()
  for (const expense of expenses) {
    const key = monthKeyOf(expense.date)
    const bucket = byMonth.get(key)
    if (bucket) bucket.push(expense)
    else byMonth.set(key, [expense])
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([monthKey, monthExpenses]) => {
      const paid = new Map<string, number>()
      const share = new Map<string, number>()
      const involved = new Set<string>(memberIds)

      let totalRappen = 0
      for (const expense of monthExpenses) {
        totalRappen += expense.amountRappen
        paid.set(expense.paidById, (paid.get(expense.paidById) ?? 0) + expense.amountRappen)
        involved.add(expense.paidById)
        for (const s of expense.shares) {
          share.set(s.residentId, (share.get(s.residentId) ?? 0) + s.amountRappen)
          involved.add(s.residentId)
        }
      }

      const rows: MonthlyPersonRow[] = Array.from(involved)
        .map((residentId) => {
          const paidRappen = paid.get(residentId) ?? 0
          const shareRappen = share.get(residentId) ?? 0
          return { residentId, paidRappen, shareRappen, netRappen: paidRappen - shareRappen }
        })
        .sort((a, b) => b.paidRappen - a.paidRappen || (a.residentId < b.residentId ? -1 : 1))

      return {
        monthKey,
        monthLabel: monthLabelOf(monthKey),
        totalRappen,
        expenseCount: monthExpenses.length,
        rows,
      }
    })
}
