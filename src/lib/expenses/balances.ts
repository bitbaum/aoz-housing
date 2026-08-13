/**
 * Balance bookkeeping for shared expenses.
 *
 * Sign convention: POSITIVE balance = the household owes this person money
 * (they paid more than their shares); NEGATIVE = they owe the household.
 * For internally consistent data the balances always sum to exactly zero —
 * money must balance, and the tests pin that invariant.
 */

export interface ExpenseForBalance {
  paidById: string
  amountRappen: number
  shares: { residentId: string; amountRappen: number }[]
}

export interface SettlementForBalance {
  fromId: string
  toId: string
  amountRappen: number
}

export interface Transfer {
  fromId: string
  toId: string
  amountRappen: number
}

/**
 * Net balance per resident. `memberIds` pre-seeds entries so every current
 * roommate appears (with 0) even before their first expense; residents who
 * appear in the data but not in `memberIds` (e.g. moved out) are included too,
 * because their debts don't vanish with them.
 */
export function computeBalances(
  expenses: ExpenseForBalance[],
  settlements: SettlementForBalance[],
  memberIds: string[] = []
): Map<string, number> {
  const balances = new Map<string, number>()
  const add = (id: string, delta: number) => {
    balances.set(id, (balances.get(id) ?? 0) + delta)
  }

  for (const id of memberIds) add(id, 0)

  for (const expense of expenses) {
    add(expense.paidById, expense.amountRappen)
    for (const share of expense.shares) {
      add(share.residentId, -share.amountRappen)
    }
  }

  // Paying a settlement reduces the payer's debt and the receiver's credit.
  for (const settlement of settlements) {
    add(settlement.fromId, settlement.amountRappen)
    add(settlement.toId, -settlement.amountRappen)
  }

  return balances
}

/**
 * Turn balances into a concrete "who pays whom" plan with at most n−1
 * transfers: repeatedly match the largest debtor with the largest creditor.
 * Deterministic — ties break on resident id — so the page shows a stable plan.
 */
export function simplifyDebts(balances: Map<string, number>): Transfer[] {
  const byAmountThenId = (a: [string, number], b: [string, number]) =>
    b[1] - a[1] || (a[0] < b[0] ? -1 : 1)

  const creditors = Array.from(balances.entries())
    .filter(([, v]) => v > 0)
    .sort(byAmountThenId)
  const debtors = Array.from(balances.entries())
    .filter(([, v]) => v < 0)
    .map(([id, v]) => [id, -v] as [string, number])
    .sort(byAmountThenId)

  const transfers: Transfer[] = []
  let ci = 0
  let di = 0
  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci][1], debtors[di][1])
    transfers.push({ fromId: debtors[di][0], toId: creditors[ci][0], amountRappen: amount })
    creditors[ci][1] -= amount
    debtors[di][1] -= amount
    if (creditors[ci][1] === 0) ci++
    if (debtors[di][1] === 0) di++
  }
  return transfers
}
