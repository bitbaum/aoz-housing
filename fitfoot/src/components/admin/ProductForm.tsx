'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CONDITION_GRADES, GENDERS, PRODUCT_CATEGORIES, PRODUCT_TYPES } from '@/config/database'
import { SUSTAINABILITY_FEATURES } from '@/config/product-features'
import { chfToRappen, formatRappen } from '@/lib/money'
import { slugify } from '@/lib/slug'
import { useDraftAutosave } from '@/lib/useDraftAutosave'
import { ImageUploadField } from './ImageUploadField'

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
  sustainabilityFeatures: string[]
  priceChf: string
  compareAtChf: string
  imageUrl: string
  active: boolean
}

interface DraftVariant {
  key: string
  size: string
  color: string
  stockQty: string
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
  sustainabilityFeatures: [],
  priceChf: '',
  compareAtChf: '',
  imageUrl: '',
  active: true,
}

function newVariantRow(): DraftVariant {
  return { key: Math.random().toString(36).slice(2), size: '', color: '', stockQty: '5' }
}

function pricePreview(chf: string): string | null {
  if (!chf.trim()) return null
  try {
    return formatRappen(chfToRappen(chf))
  } catch {
    return null
  }
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
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [rows, setRows] = useState<DraftVariant[]>(() => (productId ? [] : [newVariantRow()]))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const draftKey = `fitfoot-admin-product-draft:${productId ?? 'new'}`
  const draftPayload = useMemo(() => ({ form, rows }), [form, rows])
  const { draft, clearDraft, dismissRestore } = useDraftAutosave(draftKey, draftPayload, !productId)

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleFeature(feature: string) {
    setForm((f) => ({
      ...f,
      sustainabilityFeatures: f.sustainabilityFeatures.includes(feature)
        ? f.sustainabilityFeatures.filter((x) => x !== feature)
        : [...f.sustainabilityFeatures, feature],
    }))
  }

  function restoreDraft() {
    if (!draft) return
    setForm((draft as { form: ProductFormValues; rows: DraftVariant[] }).form)
    setRows((draft as { form: ProductFormValues; rows: DraftVariant[] }).rows)
    dismissRestore()
  }

  const slugPreview = form.slug.trim() ? slugify(form.slug) : slugify(form.name)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)

    const payload = {
      ...form,
      slug: form.slug.trim() || undefined,
      conditionGrade: form.conditionGrade || null,
      compareAtChf: form.compareAtChf || null,
      ...(productId
        ? {}
        : {
            imageDataUrl,
            variants: rows
              .filter((r) => r.size.trim())
              .map((r) => ({ size: r.size, color: r.color, stockQty: Number(r.stockQty) || 0 })),
          }),
    }

    const res = await fetch(productId ? `/api/admin/products/${productId}` : '/api/admin/products', {
      method: productId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = (await res.json().catch(() => null)) as { id?: string; error?: string } | null
    if (res.ok) {
      setMessage({ kind: 'ok', text: 'Saved.' })
      clearDraft()
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
      {draft && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-gold-300 bg-gold-50 p-3 text-sm">
          <span>You have unsaved work from earlier. Continue where you left off?</span>
          <span className="flex gap-2">
            <button type="button" onClick={restoreDraft} className="btn-dark px-3 py-1 text-xs">
              Restore
            </button>
            <button
              type="button"
              onClick={() => {
                clearDraft()
                dismissRestore()
              }}
              className="btn-ghost px-3 py-1 text-xs"
            >
              Discard
            </button>
          </span>
        </div>
      )}

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
        {slugPreview && (
          <p className="mt-1 text-xs text-neutral-500">Shop address: /shop/{slugPreview}</p>
        )}
      </div>

      <ImageUploadField
        productId={productId}
        currentImageUrl={productId ? form.imageUrl : undefined}
        onChange={setImageDataUrl}
      />

      <div className="grid gap-4 sm:grid-cols-2">
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
            placeholder="e.g. 179.00"
            className="input-field"
          />
          <p className="mt-1 text-xs text-neutral-500">
            {pricePreview(form.priceChf) ? `= ${pricePreview(form.priceChf)}` : 'e.g. 179.00'}
          </p>
        </div>
        <div>
          <label htmlFor="pf-compare" className="label-field">
            Old price (optional — shown crossed out)
          </label>
          <input
            id="pf-compare"
            type="text"
            inputMode="decimal"
            value={form.compareAtChf}
            onChange={(e) => set('compareAtChf', e.target.value)}
            placeholder="e.g. 249.00"
            className="input-field"
          />
          <p className="mt-1 text-xs text-neutral-500">
            {form.compareAtChf
              ? pricePreview(form.compareAtChf)
                ? `= ${pricePreview(form.compareAtChf)}`
                : 'not a valid amount'
              : 'leave blank if there is no discount'}
          </p>
        </div>
      </div>

      {!productId && (
        <div className="rounded border border-dashed border-neutral-300 p-3">
          <p className="text-sm font-semibold">Sizes</p>
          <p className="mt-1 text-xs text-neutral-500">
            Add every size you have in stock. You can always add more later.
          </p>
          <div className="mt-3 space-y-2">
            {rows.map((row, i) => (
              <div key={row.key} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
                <div>
                  {i === 0 && <p className="label-field text-xs">Size</p>}
                  <input
                    type="text"
                    value={row.size}
                    onChange={(e) =>
                      setRows((rs) => rs.map((r) => (r.key === row.key ? { ...r, size: e.target.value } : r)))
                    }
                    placeholder="42"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  {i === 0 && <p className="label-field text-xs">Color</p>}
                  <input
                    type="text"
                    value={row.color}
                    onChange={(e) =>
                      setRows((rs) => rs.map((r) => (r.key === row.key ? { ...r, color: e.target.value } : r)))
                    }
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  {i === 0 && <p className="label-field text-xs">Stock</p>}
                  <input
                    type="number"
                    min={0}
                    value={row.stockQty}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((r) => (r.key === row.key ? { ...r, stockQty: e.target.value } : r))
                      )
                    }
                    className="input-field text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                  className="min-h-[44px] px-2 text-sm text-neutral-400 hover:text-red-600"
                  aria-label="Remove size"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, newVariantRow()])}
            className="btn-ghost mt-2 text-sm"
          >
            + Add another size
          </button>
        </div>
      )}

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
        <p className="label-field">Sustainability features</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SUSTAINABILITY_FEATURES.map((feature) => (
            <label key={feature} className="flex min-h-[44px] items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.sustainabilityFeatures.includes(feature)}
                onChange={() => toggleFeature(feature)}
              />
              {feature}
            </label>
          ))}
        </div>
      </div>

      <details className="rounded border border-dashed border-neutral-300 p-3">
        <summary className="cursor-pointer text-sm font-medium text-neutral-600">
          Edit shop web address (optional)
        </summary>
        <div className="mt-3">
          <input
            type="text"
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            placeholder={slugify(form.name) || 'auto-generated from the name'}
            className="input-field text-sm"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Leave blank to generate this automatically from the name.
          </p>
        </div>
      </details>

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
