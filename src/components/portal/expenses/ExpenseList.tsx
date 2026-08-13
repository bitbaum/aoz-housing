'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { expenseCategoryLabel } from '@/lib/config/expenses'
import { formatRappen } from '@/lib/expenses/money'
import { formatDateShort } from '@/lib/utils/formatting'

export interface ExpenseListItem {
  id: string
  description: string
  category: string
  amountRappen: number
  date: string
  paidByName: string
  shareCount: number
  canDelete: boolean
}

const L = PORTAL_LABELS.expenses

export function ExpenseList({ expenses }: { expenses: ExpenseListItem[] }) {
  const router = useRouter()
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
        setError(body.error || PORTAL_LABELS.form.errorGeneric)
        return
      }
      router.refresh()
    } catch {
      setError(PORTAL_LABELS.form.errorGeneric)
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
                  {expenseCategoryLabel(expense.category)} · {L.paidBy} {expense.paidByName} ·{' '}
                  {formatDateShort(expense.date)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className="numeric font-medium text-ui-text">
                    {formatRappen(expense.amountRappen)}
                  </p>
                  {expense.shareCount > 1 && (
                    <p className="text-xs text-ui-muted numeric">
                      {formatRappen(Math.round(expense.amountRappen / expense.shareCount))}{' '}
                      {L.perPerson}
                    </p>
                  )}
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
