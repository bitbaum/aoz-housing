'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { formatRappen } from '@/lib/expenses/money'

interface SettleUpButtonProps {
  toResidentId: string
  toName: string
  amountRappen: number
}

const L = PORTAL_LABELS.expenses

/**
 * One-tap "I paid this" for a suggested transfer. Only rendered for the
 * debtor — a settlement is always recorded by the person who paid it.
 */
export function SettleUpButton({ toResidentId, toName, amountRappen }: SettleUpButtonProps) {
  const router = useRouter()
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
        setError(body.error || PORTAL_LABELS.form.errorGeneric)
        return
      }
      router.push('/portal/expenses?settled=true')
    } catch {
      setError(PORTAL_LABELS.form.errorGeneric)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <span className="shrink-0">
      <button type="button" onClick={handleClick} disabled={submitting} className="btn-outline text-sm">
        {submitting ? PORTAL_LABELS.form.saving : L.markPaid}
      </button>
      {error && <span className="block text-xs text-status-error-text mt-1">{error}</span>}
    </span>
  )
}
