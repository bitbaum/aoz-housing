'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface VariantOption {
  id: string
  size: string
  color: string
  stockQty: number
}

export function AddToCartForm({ variants }: { variants: VariantOption[] }) {
  const router = useRouter()
  const [variantId, setVariantId] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'busy' | 'added' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const anyInStock = variants.some((v) => v.stockQty > 0)

  async function add() {
    if (!variantId) {
      setMessage('Please choose a size first.')
      return
    }
    setState('busy')
    setMessage('')
    const res = await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId, quantity: 1 }),
    })
    if (res.ok) {
      setState('added')
      router.refresh()
    } else {
      setState('error')
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      setMessage(body?.error ?? 'Could not add to cart. Please try again.')
    }
  }

  return (
    <div className="mt-8">
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
              onClick={() => {
                setVariantId(variant.id)
                setState('idle')
                setMessage('')
              }}
              className={`min-h-[44px] min-w-[52px] rounded border px-3 py-2 font-medium transition-colors ${
                selected
                  ? 'border-gold-500 bg-gold-50 text-gold-700'
                  : disabled
                    ? 'cursor-not-allowed border-neutral-200 text-neutral-300 line-through'
                    : 'border-neutral-300 hover:border-neutral-500'
              }`}
            >
              {variant.size}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={add}
        disabled={state === 'busy' || !anyInStock}
        className="btn-gold mt-6 w-full sm:w-auto sm:min-w-64"
      >
        {!anyInStock ? 'Sold out' : state === 'busy' ? 'Adding…' : 'Add to cart'}
      </button>

      {state === 'added' && (
        <p className="mt-3 text-sm font-medium text-emerald-700">
          Added to cart —{' '}
          <a href="/cart" className="underline">
            view cart
          </a>
        </p>
      )}
      {message && <p className="mt-3 text-sm font-medium text-red-600">{message}</p>}
    </div>
  )
}
