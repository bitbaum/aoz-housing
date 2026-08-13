/**
 * Server-side data assembly for the expenses UI.
 *
 * One query path shared by the expenses page and the dashboard widget, so
 * "what is my balance" has exactly one definition. Balances are computed
 * over the FULL history — never a paginated slice — because a balance over
 * part of the history is simply a wrong number.
 */

import { prisma } from '@/lib/db'
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
    prisma.expense.findMany({
      where: { housingUnitId },
      select: {
        id: true,
        description: true,
        category: true,
        amountRappen: true,
        date: true,
        paidById: true,
        createdById: true,
        shares: { select: { residentId: true, amountRappen: true } },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.settlement.findMany({
      where: { housingUnitId },
      select: {
        id: true,
        createdAt: true,
        fromId: true,
        toId: true,
        amountRappen: true,
        note: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const balances = computeBalances(
    expenses,
    settlements,
    members.map((m) => m.id)
  )

  return {
    members,
    expenses,
    settlements,
    balances: Object.fromEntries(balances),
    suggestedTransfers: simplifyDebts(balances),
  }
}
