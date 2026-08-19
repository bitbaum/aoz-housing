'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { expenseCategoryLabel } from '@/lib/config/expenses'
import { formatRappen } from '@/lib/expenses/money'
import { formatDateShort } from '@/lib/utils/formatting'
import { useT } from '@/lib/i18n/LocaleProvider'

export interface ExpenseShareView {
  name: string
  amountRappen: number
}

export interface ExpenseListItem {
  id: string
  description: string
  category: string
  amountRappen: number
  date: string
  paidByName: string
  /** Shown only when someone recorded the expense on the payer's behalf. */
  recordedByName: string | null
  shares: ExpenseShareView[]
  /** True when the split covers every current member of the unit. */
  splitAcrossAll: boolean
  canDelete: boolean
}

const L = PORTAL_LABELS.expenses

/**
 * "Aufgeteilt auf: alle (je CHF 5.00)" when the split covers everyone with
 * equal shares; otherwise the explicit list — "Georgy (CHF 2.00), Ihor
 * (CHF 2.00), Misha (CHF 2.00)" — so exclusions are always visible.
 */
function SplitSummary({ expense }: { expense: ExpenseListItem }) {
  const equal = expense.shares.every((s) => s.amountRappen === expense.shares[0]?.amountRappen)
  if (expense.splitAcrossAll && equal && expense.shares.length > 0) {
    return (
      <span>
        {L.splitAll} ({L.each}{' '}
        <span className="numeric">{formatRappen(expense.shares[0].amountRappen)}</span>)
      </span>
    )
  }
  return (
    <span>
      {expense.shares.map((share, i) => (
        <span key={share.name}>
          {i > 0 && ', '}
          {share.name} (<span className="numeric">{formatRappen(share.amountRappen)}</span>)
        </span>
      ))}
    </span>
  )
}

export function ExpenseList({ expenses }: { expenses: ExpenseListItem[] }) {
  const router = useRouter()
  const t = useT()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!window.confirm(L.deleteConfirm)) return
    setError(null)
    setDeletingId(id)
    try {
      const response = await fetch(`/api/portal/expenses/${id}`, { method: 'DELETE' })
      const body = await response.json()
      if (!body.success) {
        setError(body.error || t('error.generic'))
        return
      }
      router.push('/portal/expenses?deleted=true')
    } catch {
      setError(t('error.generic'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-ui-text mb-4">{L.historyTitle}</h2>

      {error && (
        <div role="alert" className="alert-error mb-4">
          {error}
        </div>
      )}

      {expenses.length === 0 ? (
        <div>
          <p className="text-ui-text font-medium">{L.empty}</p>
          <p className="text-sm text-ui-muted mt-1">{L.emptyHint}</p>
        </div>
      ) : (
        <ul className="divide-y divide-ui-border">
          {expenses.map((expense) => (
            <li key={expense.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-ui-text truncate">{expense.description}</p>
                <p className="text-sm text-ui-muted">
                  {expenseCategoryLabel(expense.category)} · {L.paidBy} {expense.paidByName}
                  {expense.recordedByName && (
                    <span>
                      {' '}
                      ({L.recordedBy} {expense.recordedByName})
                    </span>
                  )}{' '}
                  · {formatDateShort(expense.date)}
                </p>
                <p className="text-xs text-ui-muted mt-0.5">
                  {L.splitAcross}: <SplitSummary expense={expense} />
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-end">
                  <p className="numeric font-medium text-ui-text">
                    {formatRappen(expense.amountRappen)}
                  </p>
                </div>
                {expense.canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(expense.id)}
                    disabled={deletingId === expense.id}
                    className="btn-icon text-ui-muted hover:text-status-error-text"
                    aria-label={`${L.delete}: ${expense.description}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
