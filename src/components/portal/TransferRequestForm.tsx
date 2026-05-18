'use client'

import { useState } from 'react'
import { PORTAL_LABELS } from '@/lib/constants/labels'

interface TransferRequestFormProps {
  currentUnit?: { code: string; address: string }
  availableUnits: { id: string; code: string; address: string }[]
}

const L = PORTAL_LABELS.transfer

export function TransferRequestForm({ currentUnit, availableUnits }: TransferRequestFormProps) {
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
        setError(data.error || PORTAL_LABELS.form.errorGeneric)
        return
      }

      setSuccess(true)
    } catch {
      setError(PORTAL_LABELS.form.errorGeneric)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-lg font-semibold text-ui-text mb-2">{L.successTitle}</h2>
          <p className="text-ui-muted max-w-md mx-auto">{L.successMessage}</p>
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
          className="w-full rounded-lg border border-ui-border-strong px-3 py-2 text-sm focus:border-aoz-primary focus:ring-1 focus:ring-aoz-primary resize-none"
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
            className="w-full rounded-lg border border-ui-border-strong px-3 py-2 text-sm focus:border-aoz-primary focus:ring-1 focus:ring-aoz-primary min-h-[44px]"
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
        <div className="p-3 bg-status-error/8 border border-status-error/25 rounded-lg text-sm text-status-error-text">
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
