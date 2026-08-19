import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getPortalAuth } from '@/lib/portal-auth'
import { getUnitExpenseData } from '@/lib/expenses/data'
import { PORTAL_LABELS } from '@/lib/constants'
import { ResidentAvatar } from '@/components/portal/ResidentAvatar'
import { AddExpenseForm } from '@/components/portal/expenses/AddExpenseForm'
import { ExpenseList } from '@/components/portal/expenses/ExpenseList'
import { SettleUpButton } from '@/components/portal/expenses/SettleUpButton'
import { residentName } from '@/lib/utils/resident-name'
import { formatRappen, monthlyStatements } from '@/lib/expenses'
import { MonthlyStatements } from '@/components/portal/expenses/MonthlyStatement'
import { formatDateShort } from '@/lib/utils/formatting'
import { SuccessToast } from '@/components/ui/SuccessToast'

export const metadata: Metadata = { title: PORTAL_LABELS.expenses.title }
export const dynamic = 'force-dynamic'

const L = PORTAL_LABELS.expenses

export default async function PortalExpensesPage() {
  const auth = await getPortalAuth()
  if (!auth) redirect('/login')

  const data = await getUnitExpenseData(auth.placement.housingUnitId)
  const memberById = new Map(data.members.map((m) => [m.id, m]))
  const nameOf = (id: string) => {
    const member = memberById.get(id)
    return member ? residentName(member) : '–'
  }
  // Every resident id appearing anywhere in the data, resolved once — the
  // statement table needs a serializable map, not a closure.
  const namesById: Record<string, string> = {}
  for (const e of data.expenses) {
    namesById[e.paidById] = nameOf(e.paidById)
    for (const s of e.shares) namesById[s.residentId] = nameOf(s.residentId)
  }
  for (const m of data.members) namesById[m.id] = residentName(m)

  return (
    <div>
      <SuccessToast
        triggers={[
          { param: 'created', message: L.createdToast },
          { param: 'settled', message: L.settledToast },
          { param: 'deleted', message: L.deletedToast },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-ui-text">{L.title}</h1>
        <p className="text-ui-muted mt-1">{L.subtitle}</p>
      </div>

      {/* Balances */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-ui-text mb-4">{L.balancesTitle}</h2>
        <div className="space-y-3">
          {data.members.map((member) => {
            const balance = data.balances[member.id] ?? 0
            return (
              <div key={member.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <ResidentAvatar resident={member} photoVersion={member.photoVersion} />
                  <span className="font-medium text-ui-text truncate">
                    {residentName(member)}
                    {member.id === auth.resident.id && (
                      <span className="text-ui-muted font-normal"> ({L.you})</span>
                    )}
                  </span>
                </div>
                {balance === 0 ? (
                  <span className="chip-neutral">{L.balanceSettled}</span>
                ) : balance > 0 ? (
                  <span className="chip-success numeric">
                    {L.balancePositive} {formatRappen(balance)}
                  </span>
                ) : (
                  <span className="chip-error numeric">
                    {L.balanceNegative} {formatRappen(-balance)}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Settle-up plan */}
        <div className="mt-5 pt-4 border-t border-ui-border">
          <p className="eyebrow mb-3">{L.suggestedTitle}</p>
          {data.suggestedTransfers.length === 0 ? (
            <p className="text-sm text-ui-muted">{L.noDebts}</p>
          ) : (
            <ul className="space-y-2">
              {data.suggestedTransfers.map((transfer) => (
                <li
                  key={`${transfer.fromId}-${transfer.toId}`}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-ui-text">
                    <span className="font-medium">{nameOf(transfer.fromId)}</span>{' '}
                    {L.suggestedPays} <span className="font-medium">{nameOf(transfer.toId)}</span>{' '}
                    <span className="numeric">{formatRappen(transfer.amountRappen)}</span>
                  </span>
                  {transfer.fromId === auth.resident.id && (
                    <SettleUpButton
                      toResidentId={transfer.toId}
                      toName={nameOf(transfer.toId)}
                      amountRappen={transfer.amountRappen}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Add expense */}
      <AddExpenseForm
        myResidentId={auth.resident.id}
        members={data.members.map((m) => ({ id: m.id, name: residentName(m) }))}
      />

      {/* History */}
      <ExpenseList
        expenses={data.expenses.map((e) => ({
          id: e.id,
          description: e.description,
          category: e.category,
          amountRappen: e.amountRappen,
          date: e.date.toISOString(),
          paidByName: nameOf(e.paidById),
          recordedByName: e.createdById === e.paidById ? null : nameOf(e.createdById),
          shares: e.shares.map((s) => ({ name: nameOf(s.residentId), amountRappen: s.amountRappen })),
          splitAcrossAll:
            data.members.length > 0 &&
            data.members.every((m) => e.shares.some((s) => s.residentId === m.id)),
          canDelete: e.paidById === auth.resident.id || e.createdById === auth.resident.id,
        }))}
      />

      {/* Monthly statement */}
      <MonthlyStatements
        statements={monthlyStatements(data.expenses, data.members.map((m) => m.id))}
        nameOf={namesById}
      />

      {/* Settlements */}
      {data.settlements.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold text-ui-text mb-4">{L.settlementsTitle}</h2>
          <ul className="space-y-2">
            {data.settlements.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ui-text">
                  <span className="font-medium">{nameOf(s.fromId)}</span> {L.suggestedPays}{' '}
                  <span className="font-medium">{nameOf(s.toId)}</span>
                  {s.note && <span className="text-ui-muted"> — {s.note}</span>}
                </span>
                <span className="flex items-center gap-3 shrink-0">
                  <span className="numeric text-ui-text">{formatRappen(s.amountRappen)}</span>
                  <span className="text-ui-muted">{formatDateShort(s.createdAt)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
