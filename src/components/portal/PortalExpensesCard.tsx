import Link from 'next/link'
import { PORTAL_LABELS } from '@/lib/constants'
import { formatRappen } from '@/lib/expenses'

const L = PORTAL_LABELS.expenses

/** Dashboard widget: my net balance in the shared-expenses ledger. */
export function PortalExpensesCard({ myBalance }: { myBalance: number }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ui-text">{L.dashboardTitle}</h2>
        <Link
          href="/portal/expenses"
          className="inline-flex items-center min-h-[44px] px-1 text-sm text-brand-primary hover:underline"
        >
          {L.dashboardCta}
        </Link>
      </div>
      <p className="eyebrow">{L.dashboardBalance}</p>
      <div className="mt-2">
        {myBalance === 0 ? (
          <span className="chip-neutral">{L.balanceSettled}</span>
        ) : myBalance > 0 ? (
          <span className="chip-success numeric">
            {L.balancePositive} {formatRappen(myBalance)}
          </span>
        ) : (
          <span className="chip-error numeric">
            {L.balanceNegative} {formatRappen(-myBalance)}
          </span>
        )}
      </div>
    </div>
  )
}
