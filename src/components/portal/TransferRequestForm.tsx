'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useT } from '@/lib/i18n/LocaleProvider'
import { buildTransferLabels } from '@/lib/i18n/portal-surfaces'

interface TransferRequestFormProps {
  currentUnit?: { code: string; address: string }
  availableUnits: { id: string; code: string; address: string }[]
}

export function TransferRequestForm({ currentUnit, availableUnits }: TransferRequestFormProps) {
  const t = useT()
  const L = buildTransferLabels(t)
  const [reason, setReason] = useState('')
  const [targetUnitId, setTargetUnitId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/portal/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          ...(targetUnitId ? { targetUnitId } : {}),
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || t('error.generic'))
        return
      }

      setSuccess(true)
    } catch {
      setError(t('error.generic'))
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="card">
        <div className="py-8">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-lg font-semibold text-ui-text mb-2 text-center">{L.successTitle}</h2>
          <p className="text-ui-muted max-w-md mx-auto text-center">{L.successMessage}</p>
          <div className="mt-5 rounded-lg border border-ui-border bg-ui-subtle p-4">
            <h3 className="text-sm font-semibold text-ui-text mb-2">{L.successNextStepsTitle}</h3>
            <ul className="space-y-2 text-sm text-ui-muted">
              {(L.successNextSteps ?? []).map((step) => (
                <li key={step} className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/portal/messages" className="btn-secondary">
              {L.successToMessages}
            </Link>
            <Link href="/portal" className="btn-outline">
              {L.successToOverview}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      {/* Current unit info */}
      {currentUnit && (
        <div className="p-3 bg-ui-subtle rounded-lg">
          <p className="text-sm text-ui-muted">{L.currentUnit}</p>
          <p className="font-medium text-ui-text">{currentUnit.code} — {currentUnit.address}</p>
        </div>
      )}

      {/* Reason */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-ui-muted mb-1">
          {L.reasonLabel}
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={L.reasonPlaceholder}
          rows={4}
          required
          minLength={10}
          className="w-full rounded-lg border border-ui-border-strong px-3 py-2 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary resize-none"
        />
      </div>

      {/* Optional target unit */}
      {availableUnits.length > 0 && (
        <div>
          <label htmlFor="targetUnit" className="block text-sm font-medium text-ui-muted mb-1">
            {L.targetUnitLabel}
          </label>
          <select
            id="targetUnit"
            value={targetUnitId}
            onChange={(e) => setTargetUnitId(e.target.value)}
            className="w-full rounded-lg border border-ui-border-strong px-3 py-2 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary min-h-[44px]"
          >
            <option value="">{L.targetUnitPlaceholder}</option>
            {availableUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.code} — {unit.address}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="alert-error" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || reason.length < 10}
        className="btn-primary w-full min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? L.submitting : L.submit}
      </button>
    </form>
  )
}
