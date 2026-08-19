'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { formatRappen } from '@/lib/money'
import {
  EXPRESS_SHIPPING_RAPPEN,
  FREE_SHIPPING_THRESHOLD_RAPPEN,
  STANDARD_SHIPPING_RAPPEN,
} from '@/lib/cart/totals'

interface CheckoutFormProps {
  initialEmail: string
  subtotalRappen: number
}

export function CheckoutForm({ initialEmail, subtotalRappen }: CheckoutFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    email: initialEmail,
    shipName: '',
    shipStreet: '',
    shipZip: '',
    shipCity: '',
    shippingMethod: 'STANDARD' as 'STANDARD' | 'EXPRESS',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const standardCost =
    subtotalRappen >= FREE_SHIPPING_THRESHOLD_RAPPEN ? 0 : STANDARD_SHIPPING_RAPPEN

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, shipCountry: 'CH' }),
    })
    const body = (await res.json().catch(() => null)) as
      | { orderNumber?: string; error?: string }
      | null
    if (res.ok && body?.orderNumber) {
      router.push(`/checkout/success?order=${encodeURIComponent(body.orderNumber)}`)
      router.refresh()
    } else {
      setBusy(false)
      setError(body?.error ?? 'Checkout failed. Please try again.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="card">
        <h2 className="font-heading text-xl">Contact</h2>
        <div className="mt-4">
          <label htmlFor="co-email" className="label-field">
            Email
          </label>
          <input
            id="co-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="your.email@example.com"
            className="input-field"
          />
        </div>
      </section>

      <section className="card">
        <h2 className="font-heading text-xl">Shipping address</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="co-name" className="label-field">
              Full name
            </label>
            <input
              id="co-name"
              type="text"
              required
              value={form.shipName}
              onChange={(e) => setForm({ ...form, shipName: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="co-street" className="label-field">
              Street and number
            </label>
            <input
              id="co-street"
              type="text"
              required
              value={form.shipStreet}
              onChange={(e) => setForm({ ...form, shipStreet: e.target.value })}
              placeholder="Bahnhofstrasse 1"
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="co-zip" className="label-field">
              ZIP
            </label>
            <input
              id="co-zip"
              type="text"
              required
              minLength={4}
              value={form.shipZip}
              onChange={(e) => setForm({ ...form, shipZip: e.target.value })}
              placeholder="8001"
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="co-city" className="label-field">
              City
            </label>
            <input
              id="co-city"
              type="text"
              required
              value={form.shipCity}
              onChange={(e) => setForm({ ...form, shipCity: e.target.value })}
              placeholder="Zürich"
              className="input-field"
            />
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">Currently shipping within Switzerland.</p>
      </section>

      <section className="card">
        <h2 className="font-heading text-xl">Shipping method</h2>
        <div className="mt-4 space-y-3">
          <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded border border-line p-4 has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50">
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="shippingMethod"
                checked={form.shippingMethod === 'STANDARD'}
                onChange={() => setForm({ ...form, shippingMethod: 'STANDARD' })}
              />
              <span>
                <span className="font-medium">Standard</span>
                <span className="block text-sm text-muted">3–5 business days</span>
              </span>
            </span>
            <span className="font-semibold">
              {standardCost === 0 ? 'Free' : formatRappen(standardCost)}
            </span>
          </label>
          <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded border border-line p-4 has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50">
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="shippingMethod"
                checked={form.shippingMethod === 'EXPRESS'}
                onChange={() => setForm({ ...form, shippingMethod: 'EXPRESS' })}
              />
              <span>
                <span className="font-medium">Express</span>
                <span className="block text-sm text-muted">1–2 business days</span>
              </span>
            </span>
            <span className="font-semibold">{formatRappen(EXPRESS_SHIPPING_RAPPEN)}</span>
          </label>
        </div>
      </section>

      {error && <p className="text-sm font-medium text-error-text">{error}</p>}

      <button type="submit" disabled={busy} className="btn-gold w-full">
        {busy ? 'Placing order…' : 'Place order'}
      </button>
      <p className="text-center text-xs text-muted">
        Payment on invoice while we finish integrating Swiss payment providers.
      </p>
    </form>
  )
}
