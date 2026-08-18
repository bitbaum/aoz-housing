'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [draft, setDraft] = useState({ sku: '', size: '', color: '', stockQty: '0' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function updateStock(variantId: string, stockQty: number) {
    if (stockQty < 0) return
    setBusy(true)
    setError('')
    const res = await fetch(`/api/admin/variants/${variantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockQty }),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      setError(body?.error ?? 'Update failed.')
    }
    router.refresh()
    setBusy(false)
  }

  async function removeVariant(variantId: string) {
    if (!window.confirm('Delete this size?')) return
    setBusy(true)
    setError('')
    await fetch(`/api/admin/variants/${variantId}`, { method: 'DELETE' })
    router.refresh()
    setBusy(false)
  }

  async function addVariant(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const res = await fetch(`/api/admin/products/${productId}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, stockQty: Number(draft.stockQty) }),
    })
    if (res.ok) {
      setDraft({ sku: '', size: '', color: '', stockQty: '0' })
      router.refresh()
    } else {
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      setError(body?.error ?? 'Could not add the size.')
    }
    setBusy(false)
  }

  return (
    <div>
      <ul className="space-y-2">
        {variants.map((variant) => (
          <li
            key={variant.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded border border-neutral-200 p-3 text-sm"
          >
            <span>
              <span className="font-medium">Size {variant.size}</span>
              {variant.color && <span className="text-neutral-500"> · {variant.color}</span>}
              <span className="block text-xs text-neutral-400">{variant.sku}</span>
            </span>
            <span className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Decrease stock"
                disabled={busy || variant.stockQty <= 0}
                onClick={() => updateStock(variant.id, variant.stockQty - 1)}
                className="min-h-[44px] min-w-[44px] rounded border border-neutral-300 font-bold disabled:text-neutral-300"
              >
                −
              </button>
              <span
                className={`min-w-8 text-center font-semibold ${variant.stockQty <= 3 ? 'text-red-600' : ''}`}
              >
                {variant.stockQty}
              </span>
              <button
                type="button"
                aria-label="Increase stock"
                disabled={busy}
                onClick={() => updateStock(variant.id, variant.stockQty + 1)}
                className="min-h-[44px] min-w-[44px] rounded border border-neutral-300 font-bold"
              >
                +
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => removeVariant(variant.id)}
                className="ml-2 min-h-[44px] text-xs text-neutral-400 underline hover:text-red-600"
              >
                delete
              </button>
            </span>
          </li>
        ))}
      </ul>

      <form onSubmit={addVariant} className="mt-4 rounded border border-dashed border-neutral-300 p-3">
        <p className="text-sm font-semibold">Add size</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
            <label htmlFor="vm-sku" className="label-field text-xs">
              SKU
            </label>
            <input
              id="vm-sku"
              type="text"
              required
              value={draft.sku}
              onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
              placeholder="ETR-42-GRN"
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
        {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-dark mt-3 text-sm">
          Add size
        </button>
      </form>
    </div>
  )
}
