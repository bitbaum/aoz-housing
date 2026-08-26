'use client'

import { useState, useTransition, type FormEvent } from 'react'
import {
  createVariantAction,
  deleteVariantAction,
  updateVariantStockAction,
} from '@/lib/actions/products'

interface VariantRow {
  id: string
  sku: string
  size: string
  color: string
  stockQty: number
}

export function VariantManager({
  productId,
  variants,
}: {
  productId: string
  variants: VariantRow[]
}) {
  const [draft, setDraft] = useState({ size: '', color: '', stockQty: '5' })
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function updateStock(variantId: string, stockQty: number) {
    if (stockQty < 0) return
    setError('')
    startTransition(async () => {
      const result = await updateVariantStockAction(variantId, stockQty)
      if (result.error) setError(result.error)
    })
  }

  function removeVariant(variantId: string) {
    if (!window.confirm('Delete this size?')) return
    setError('')
    startTransition(async () => {
      const result = await deleteVariantAction(variantId)
      if (result.error) setError(result.error)
    })
  }

  function addVariant(event: FormEvent) {
    event.preventDefault()
    setError('')
    startTransition(async () => {
      const formData = new FormData()
      formData.set('size', draft.size)
      formData.set('color', draft.color)
      formData.set('stockQty', draft.stockQty)
      const result = await createVariantAction(productId, {}, formData)
      if (result.error) {
        setError(result.error)
      } else {
        setDraft({ size: '', color: '', stockQty: '5' })
      }
    })
  }

  return (
    <div>
      <ul className="space-y-2">
        {variants.map((variant) => (
          <li
            key={variant.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded border border-line p-3 text-sm"
          >
            <span>
              <span className="font-medium">Size {variant.size}</span>
              {variant.color && <span className="text-muted"> · {variant.color}</span>}
              <span className="block text-xs text-muted">{variant.sku}</span>
            </span>
            <span className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Decrease stock"
                disabled={pending || variant.stockQty <= 0}
                onClick={() => updateStock(variant.id, variant.stockQty - 1)}
                className="min-h-[44px] min-w-[44px] rounded border border-line font-bold disabled:text-muted"
              >
                −
              </button>
              <span
                className={`min-w-8 text-center font-semibold ${variant.stockQty <= 3 ? 'text-error-text' : ''}`}
              >
                {variant.stockQty}
              </span>
              <button
                type="button"
                aria-label="Increase stock"
                disabled={pending}
                onClick={() => updateStock(variant.id, variant.stockQty + 1)}
                className="min-h-[44px] min-w-[44px] rounded border border-line font-bold"
              >
                +
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => removeVariant(variant.id)}
                className="ml-2 min-h-[44px] text-xs text-muted underline hover:text-error-text"
              >
                delete
              </button>
            </span>
          </li>
        ))}
      </ul>

      <form onSubmit={addVariant} className="mt-4 rounded border border-dashed border-line p-3">
        <p className="text-sm font-semibold">Add size</p>
        <p className="mt-1 text-xs text-muted">The stock code is generated for you.</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div>
            <label htmlFor="vm-size" className="label-field text-xs">
              Size
            </label>
            <input
              id="vm-size"
              type="text"
              required
              value={draft.size}
              onChange={(e) => setDraft({ ...draft, size: e.target.value })}
              placeholder="42"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label htmlFor="vm-color" className="label-field text-xs">
              Color
            </label>
            <input
              id="vm-color"
              type="text"
              value={draft.color}
              onChange={(e) => setDraft({ ...draft, color: e.target.value })}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label htmlFor="vm-stock" className="label-field text-xs">
              Stock
            </label>
            <input
              id="vm-stock"
              type="number"
              min={0}
              value={draft.stockQty}
              onChange={(e) => setDraft({ ...draft, stockQty: e.target.value })}
              className="input-field text-sm"
            />
          </div>
        </div>
        {error && <p className="mt-2 text-sm font-medium text-error-text">{error}</p>}
        <button type="submit" disabled={pending} className="btn-dark mt-3 text-sm">
          Add size
        </button>
      </form>
    </div>
  )
}
