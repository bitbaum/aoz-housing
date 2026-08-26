'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { addToCartAction } from '@/lib/actions/cart'
import type { ActionState } from '@/lib/actions/types'

interface VariantOption {
  id: string
  size: string
  color: string
  stockQty: number
}

function AddButton({ soldOut, noSizeChosen }: { soldOut: boolean; noSizeChosen: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={soldOut || noSizeChosen || pending}
      className="btn-gold mt-6 w-full sm:w-auto sm:min-w-64"
    >
      {soldOut ? 'Sold out' : pending ? 'Adding…' : 'Add to cart'}
    </button>
  )
}

export function AddToCartForm({ variants }: { variants: VariantOption[] }) {
  const [variantId, setVariantId] = useState<string | null>(null)
  const [state, formAction] = useActionState<ActionState, FormData>(addToCartAction, {})
  const anyInStock = variants.some((v) => v.stockQty > 0)

  return (
    <form action={formAction} className="mt-8">
      <input type="hidden" name="variantId" value={variantId ?? ''} />
      <input type="hidden" name="quantity" value="1" />
      <p className="label-field">Size (EU)</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const selected = variant.id === variantId
          const disabled = variant.stockQty <= 0
          return (
            <button
              key={variant.id}
              type="button"
              disabled={disabled}
              onClick={() => setVariantId(variant.id)}
              className={`min-h-[44px] min-w-[52px] rounded border px-3 py-2 font-medium transition-colors ${
                selected
                  ? 'border-gold-500 bg-gold-50 text-gold-700'
                  : disabled
                    ? 'cursor-not-allowed border-line text-muted line-through'
                    : 'border-line hover:border-line-strong'
              }`}
            >
              {variant.size}
            </button>
          )
        })}
      </div>

      <AddButton soldOut={!anyInStock} noSizeChosen={!variantId} />

      {state.ok && (
        <p className="mt-3 text-sm font-medium text-success-text">
          Added to cart —{' '}
          <a href="/cart" className="underline">
            view cart
          </a>
        </p>
      )}
      {state.error && <p className="mt-3 text-sm font-medium text-error-text">{state.error}</p>}
    </form>
  )
}
