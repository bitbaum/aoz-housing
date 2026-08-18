'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CONDITION_GRADES, GENDERS, PRODUCT_CATEGORIES, PRODUCT_TYPES } from '@/config/database'

export interface ProductFormValues {
  slug: string
  name: string
  category: string
  productType: string
  conditionGrade: string
  brand: string
  gender: string
  shortDescription: string
  description: string
  materials: string
  careInstructions: string
  origin: string
  sustainabilityNotes: string
  sustainabilityFeatures: string // comma-separated in the form
  priceChf: string
  compareAtChf: string
  imageUrl: string
  active: boolean
}

const EMPTY: ProductFormValues = {
  slug: '',
  name: '',
  category: 'SNEAKERS',
  productType: 'NEW',
  conditionGrade: '',
  brand: 'FitFoot',
  gender: 'UNISEX',
  shortDescription: '',
  description: '',
  materials: '',
  careInstructions: '',
  origin: 'Switzerland',
  sustainabilityNotes: '',
  sustainabilityFeatures: '',
  priceChf: '',
  compareAtChf: '',
  imageUrl: '',
  active: true,
}

export function ProductForm({
  productId,
  initial,
}: {
  productId?: string
  initial?: ProductFormValues
}) {
  const router = useRouter()
  const [form, setForm] = useState<ProductFormValues>(initial ?? EMPTY)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    const payload = {
      ...form,
      conditionGrade: form.conditionGrade || null,
      compareAtChf: form.compareAtChf || null,
      sustainabilityFeatures: form.sustainabilityFeatures
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    }
    const res = await fetch(productId ? `/api/admin/products/${productId}` : '/api/admin/products', {
      method: productId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = (await res.json().catch(() => null)) as { id?: string; error?: string } | null
    if (res.ok) {
      setMessage({ kind: 'ok', text: 'Saved.' })
      if (!productId && body?.id) {
        router.push(`/admin/products/${body.id}`)
      }
      router.refresh()
    } else {
      setMessage({ kind: 'error', text: body?.error ?? 'Save failed.' })
    }
    setBusy(false)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pf-name" className="label-field">
            Name
          </label>
          <input
            id="pf-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="pf-slug" className="label-field">
            Slug
          </label>
          <input
            id="pf-slug"
            type="text"
            required
            pattern="[a-z0-9-]+"
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="pf-category" className="label-field">
            Category
          </label>
          <select
            id="pf-category"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="input-field"
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pf-gender" className="label-field">
            Gender
          </label>
          <select
            id="pf-gender"
            value={form.gender}
            onChange={(e) => set('gender', e.target.value)}
            className="input-field"
          >
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pf-type" className="label-field">
            Type
          </label>
          <select
            id="pf-type"
            value={form.productType}
            onChange={(e) => set('productType', e.target.value)}
            className="input-field"
          >
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        {form.productType === 'REFURBISHED' && (
          <div>
            <label htmlFor="pf-condition" className="label-field">
              Condition
            </label>
            <select
              id="pf-condition"
              value={form.conditionGrade}
              onChange={(e) => set('conditionGrade', e.target.value)}
              className="input-field"
            >
              <option value="">—</option>
              {CONDITION_GRADES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="pf-price" className="label-field">
            Price (CHF)
          </label>
          <input
            id="pf-price"
            type="text"
            required
            inputMode="decimal"
            value={form.priceChf}
            onChange={(e) => set('priceChf', e.target.value)}
            placeholder="179.00"
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="pf-compare" className="label-field">
            Compare-at price (CHF, optional)
          </label>
          <input
            id="pf-compare"
            type="text"
            inputMode="decimal"
            value={form.compareAtChf}
            onChange={(e) => set('compareAtChf', e.target.value)}
            placeholder="249.00"
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label htmlFor="pf-short" className="label-field">
          Short description
        </label>
        <input
          id="pf-short"
          type="text"
          value={form.shortDescription}
          onChange={(e) => set('shortDescription', e.target.value)}
          className="input-field"
        />
      </div>
      <div>
        <label htmlFor="pf-desc" className="label-field">
          Description
        </label>
        <textarea
          id="pf-desc"
          rows={4}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className="input-field"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pf-materials" className="label-field">
            Materials
          </label>
          <input
            id="pf-materials"
            type="text"
            value={form.materials}
            onChange={(e) => set('materials', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="pf-care" className="label-field">
            Care instructions
          </label>
          <input
            id="pf-care"
            type="text"
            value={form.careInstructions}
            onChange={(e) => set('careInstructions', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="pf-origin" className="label-field">
            Made in
          </label>
          <input
            id="pf-origin"
            type="text"
            value={form.origin}
            onChange={(e) => set('origin', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="pf-brand" className="label-field">
            Brand
          </label>
          <input
            id="pf-brand"
            type="text"
            value={form.brand}
            onChange={(e) => set('brand', e.target.value)}
            className="input-field"
          />
        </div>
      </div>
      <div>
        <label htmlFor="pf-sustain" className="label-field">
          Sustainability highlight
        </label>
        <input
          id="pf-sustain"
          type="text"
          value={form.sustainabilityNotes}
          onChange={(e) => set('sustainabilityNotes', e.target.value)}
          placeholder="Saves 12kg CO₂ vs new production"
          className="input-field"
        />
      </div>
      <div>
        <label htmlFor="pf-features" className="label-field">
          Sustainability features (comma-separated)
        </label>
        <input
          id="pf-features"
          type="text"
          value={form.sustainabilityFeatures}
          onChange={(e) => set('sustainabilityFeatures', e.target.value)}
          placeholder="Eco-friendly materials, Recycled components"
          className="input-field"
        />
      </div>
      <div>
        <label htmlFor="pf-image" className="label-field">
          Image URL (optional)
        </label>
        <input
          id="pf-image"
          type="text"
          value={form.imageUrl}
          onChange={(e) => set('imageUrl', e.target.value)}
          className="input-field"
        />
      </div>
      <label className="flex min-h-[44px] items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => set('active', e.target.checked)}
        />
        Visible in the shop
      </label>

      {message && (
        <p
          className={`text-sm font-medium ${message.kind === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}
        >
          {message.text}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-gold">
        {busy ? 'Saving…' : productId ? 'Save changes' : 'Create product'}
      </button>
    </form>
  )
}
