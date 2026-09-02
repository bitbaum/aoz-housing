/**
 * Server-side data assembly for the expenses UI.
 *
 * One query path shared by the expenses page and the dashboard widget, so
 * "what is my balance" has exactly one definition. Balances are computed
 * over the FULL history — never a paginated slice — because a balance over
 * part of the history is simply a wrong number.
 */

import { db, expense, settlement } from '@/lib/db'
import { desc, eq } from 'drizzle-orm'
import { getActiveUnitMembers, type UnitMember } from '@/lib/portal-auth'
import { computeBalances, simplifyDebts, type Transfer } from './balances'

export interface UnitExpense {
  id: string
  description: string
  category: string
  amountRappen: number
  date: Date
  paidById: string
  createdById: string
  shares: { residentId: string; amountRappen: number }[]
}

export interface UnitSettlement {
  id: string
  createdAt: Date
  fromId: string
  toId: string
  amountRappen: number
  note: string | null
}

export interface UnitExpenseData {
  members: UnitMember[]
  expenses: UnitExpense[]
  settlements: UnitSettlement[]
  /** residentId → net Rappen; positive = the household owes them. */
  balances: Record<string, number>
  suggestedTransfers: Transfer[]
}

export async function getUnitExpenseData(housingUnitId: string): Promise<UnitExpenseData> {
  const [members, expenses, settlements] = await Promise.all([
    getActiveUnitMembers(housingUnitId),
    db.query.expense.findMany({
      where: eq(expense.housingUnitId, housingUnitId),
      columns: {
        id: true,
        description: true,
        category: true,
        amountRappen: true,
        date: true,
        paidById: true,
        createdById: true,
      },
      with: { shares: { columns: { residentId: true, amountRappen: true } } },
      orderBy: [desc(expense.date), desc(expense.createdAt)],
    }),
    db.query.settlement.findMany({
      where: eq(settlement.housingUnitId, housingUnitId),
      columns: {
        id: true,
        createdAt: true,
        fromId: true,
        toId: true,
        amountRappen: true,
        note: true,
      },
      orderBy: [desc(settlement.createdAt)],
    }),
  ])

  const balances = computeBalances(
    expenses,
    settlements,
    members.map((m) => m.id),
  )

  return {
    members,
    expenses,
    settlements,
    balances: Object.fromEntries(balances),
    suggestedTransfers: simplifyDebts(balances),
  }
}
