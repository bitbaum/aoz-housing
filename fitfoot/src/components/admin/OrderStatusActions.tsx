'use client'

import { useState, useTransition } from 'react'
import { updateOrderStatusAction } from '@/lib/actions/crm'
import { ORDER_ACTION_LABELS as ACTION_LABELS } from '@/config/labels'

const DESTRUCTIVE = new Set(['CANCELLED', 'REFUNDED'])

export function OrderStatusActions({
  orderId,
  transitions,
}: {
  orderId: string
  transitions: string[]
}) {
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function move(status: string) {
    if (DESTRUCTIVE.has(status) && !window.confirm(`Really ${ACTION_LABELS[status]?.toLowerCase()}?`)) {
      return
    }
    setError('')
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, status)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {transitions.map((status) => (
          <button
            key={status}
            type="button"
            disabled={pending}
            onClick={() => move(status)}
            className={DESTRUCTIVE.has(status) ? 'btn-ghost text-sm text-error-text' : 'btn-dark text-sm'}
          >
            {ACTION_LABELS[status] ?? status}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm font-medium text-error-text">{error}</p>}
    </div>
  )
}
