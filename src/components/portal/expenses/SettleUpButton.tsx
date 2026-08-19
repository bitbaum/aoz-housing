'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatRappen } from '@/lib/expenses/money'
import { useT } from '@/lib/i18n/LocaleProvider'
import { buildExpenseLabels } from '@/lib/i18n/portal-surfaces'

interface SettleUpButtonProps {
  toResidentId: string
  toName: string
  amountRappen: number
}

/**
 * One-tap "I paid this" for a suggested transfer. Only rendered for the
 * debtor — a settlement is always recorded by the person who paid it.
 */
export function SettleUpButton({ toResidentId, toName, amountRappen }: SettleUpButtonProps) {
  const router = useRouter()
  const t = useT()
  const L = buildExpenseLabels(t)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (!window.confirm(L.markPaidConfirm(formatRappen(amountRappen), toName))) return
    setError(null)
    setSubmitting(true)
    try {
      const response = await fetch('/api/portal/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toResidentId, amountRappen }),
      })
      const body = await response.json()
      if (!body.success) {
        setError(body.error || t('error.generic'))
        return
      }
      router.push('/portal/expenses?settled=true')
    } catch {
      setError(t('error.generic'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <span className="shrink-0">
      <button type="button" onClick={handleClick} disabled={submitting} className="btn-outline text-sm">
        {submitting ? t('action.saving') : L.markPaid}
      </button>
      {error && <span className="block text-xs text-status-error-text mt-1">{error}</span>}
    </span>
  )
}
