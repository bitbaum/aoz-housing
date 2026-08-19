'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ACTION_LABELS: Record<string, string> = {
  PAID: 'Mark as paid',
  SHIPPED: 'Mark as shipped',
  COMPLETED: 'Mark as completed',
  CANCELLED: 'Cancel order',
  REFUNDED: 'Mark as refunded',
}

const DESTRUCTIVE = new Set(['CANCELLED', 'REFUNDED'])

export function OrderStatusActions({
  orderId,
  transitions,
}: {
  orderId: string
  transitions: string[]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function move(status: string) {
    if (DESTRUCTIVE.has(status) && !window.confirm(`Really ${ACTION_LABELS[status]?.toLowerCase()}?`)) {
      return
    }
    setBusy(true)
    setError('')
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      router.refresh()
    } else {
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      setError(body?.error ?? 'Update failed.')
    }
    setBusy(false)
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {transitions.map((status) => (
          <button
            key={status}
            type="button"
            disabled={busy}
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
