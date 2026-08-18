'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CartLineControlsProps {
  itemId: string
  quantity: number
  maxQty: number
}

export function CartLineControls({ itemId, quantity, maxQty }: CartLineControlsProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function setQuantity(next: number) {
    setBusy(true)
    await fetch('/api/cart/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, quantity: next }),
    })
    router.refresh()
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center rounded border border-neutral-300">
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={busy || quantity <= 1}
          onClick={() => setQuantity(quantity - 1)}
          className="min-h-[44px] min-w-[44px] px-3 font-bold text-neutral-600 disabled:text-neutral-300"
        >
          −
        </button>
        <span className="min-w-8 text-center font-medium">{quantity}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          disabled={busy || quantity >= maxQty}
          onClick={() => setQuantity(quantity + 1)}
          className="min-h-[44px] min-w-[44px] px-3 font-bold text-neutral-600 disabled:text-neutral-300"
        >
          +
        </button>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => setQuantity(0)}
        className="min-h-[44px] text-sm text-neutral-500 underline hover:text-red-600"
      >
        Remove
      </button>
    </div>
  )
}
