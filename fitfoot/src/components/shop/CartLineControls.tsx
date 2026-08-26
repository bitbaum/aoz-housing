'use client'

import { useActionState, useTransition } from 'react'
import { updateCartItemAction } from '@/lib/actions/cart'
import type { ActionState } from '@/lib/actions/types'

interface CartLineControlsProps {
  itemId: string
  quantity: number
  maxQty: number
}

export function CartLineControls({ itemId, quantity, maxQty }: CartLineControlsProps) {
  const [, formAction] = useActionState<ActionState, FormData>(updateCartItemAction, {})
  const [pending, startTransition] = useTransition()

  function setQuantity(next: number) {
    const formData = new FormData()
    formData.set('itemId', itemId)
    formData.set('quantity', String(next))
    startTransition(() => formAction(formData))
  }

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center rounded border border-line">
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={pending || quantity <= 1}
          onClick={() => setQuantity(quantity - 1)}
          className="min-h-[44px] min-w-[44px] px-3 font-bold text-muted disabled:text-muted"
        >
          −
        </button>
        <span className="min-w-8 text-center font-medium">{quantity}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          disabled={pending || quantity >= maxQty}
          onClick={() => setQuantity(quantity + 1)}
          className="min-h-[44px] min-w-[44px] px-3 font-bold text-muted disabled:text-muted"
        >
          +
        </button>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => setQuantity(0)}
        className="min-h-[44px] text-sm text-muted underline hover:text-error-text"
      >
        Remove
      </button>
    </div>
  )
}
