import { prisma } from '@/lib/db'
import { zurichMonthKey } from '@/lib/utils'
import { RESIDENT_NAME_SELECT } from '@/lib/utils/resident-name'
import { computeChoreBalances } from './balances'
import type { ChoreBalanceRow } from '@/components/portal/ChoreBalanceSummary'

/**
 * Load the current month's contribution balance for one housing unit.
 *
 * The page and the JSON route both need this, and a balance that disagreed
 * between the two would be worse than no balance at all — so there is one
 * loader, not two queries that happen to look alike.
 *
 * WHY THE MONTH IS THE WINDOW. All-time totals let a long-resident housemate
 * coast for months on credit earned last year, and they make a newcomer look
 * permanently delinquent for having arrived late — neither is information
 * anyone can act on. A month is short enough to still be correctable and long
 * enough that one heavy week does not define you. It also matches the expense
 * statement, so both ledgers in the portal answer for the same period.
 */
export async function loadChoreBalances(housingUnitId: string): Promise<ChoreBalanceRow[]> {
  const monthKey = zurichMonthKey(new Date())

  // Over-fetch a generous window, then bucket by Zurich month in JS. Doing the
  // month boundary in SQL would mean encoding a DST-aware offset in the query;
  // bucketing with the same helper the rest of the app uses cannot drift from it.
  const since = new Date(Date.now() - 62 * 24 * 60 * 60 * 1000)

  const [completions, members] = await Promise.all([
    prisma.taskCompletion.findMany({
      where: {
        completedAt: { gte: since },
        task: { housingUnitId },
      },
      select: {
        completedById: true,
        completedAt: true,
        durationMinutes: true,
        task: { select: { estimatedMinutes: true } },
      },
    }),
    prisma.placement.findMany({
      where: { housingUnitId, status: 'ACTIVE' },
      select: {
        resident: { select: RESIDENT_NAME_SELECT },
      },
      orderBy: { resident: { code: 'asc' } },
    }),
  ])

  const thisMonth = completions.filter(c => zurichMonthKey(c.completedAt) === monthKey)

  const residents = new Map(members.map(m => [m.resident.id, m.resident]))
  const balances = computeChoreBalances(
    thisMonth.map(c => ({
      completedById: c.completedById,
      durationMinutes: c.durationMinutes,
      taskEstimatedMinutes: c.task.estimatedMinutes,
    })),
    members.map(m => m.resident.id)
  )

  return balances.map(balance => {
    const resident = residents.get(balance.residentId)
    return {
      ...balance,
      // A departed resident still holds minutes in the split; label them by id
      // tail rather than dropping the row, which would break the zero sum.
      code: resident?.code ?? balance.residentId.slice(-6).toUpperCase(),
      displayName: resident?.displayName ?? null,
    }
  })
}
