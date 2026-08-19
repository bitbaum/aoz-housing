'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { checkoutAction } from '@/lib/actions/checkout'
import { Field } from '@/components/ui/Field'
import { formatRappen } from '@/lib/money'
import {
  EXPRESS_SHIPPING_RAPPEN,
  FREE_SHIPPING_THRESHOLD_RAPPEN,
  STANDARD_SHIPPING_RAPPEN,
} from '@/lib/cart/totals'
import type { ActionState } from '@/lib/actions/types'

interface CheckoutFormProps {
  initialEmail: string
  subtotalRappen: number
}

function PlaceOrderButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-gold w-full">
      {pending ? 'Placing order…' : 'Place order'}
    </button>
  )
}

export function CheckoutForm({ initialEmail, subtotalRappen }: CheckoutFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(checkoutAction, {})
  const standardCost =
    subtotalRappen >= FREE_SHIPPING_THRESHOLD_RAPPEN ? 0 : STANDARD_SHIPPING_RAPPEN

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="shipCountry" value="CH" />
      <section className="card">
        <h2 className="font-heading text-xl">Contact</h2>
        <div className="mt-4">
          <Field id="co-email" label="Email">
            <input
              id="co-email"
              name="email"
              type="email"
              required
              defaultValue={initialEmail}
              placeholder="your.email@example.com"
              className="input-field"
            />
          </Field>
        </div>
      </section>

      <section className="card">
        <h2 className="font-heading text-xl">Shipping address</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id="co-name" label="Full name">
              <input id="co-name" name="shipName" type="text" required className="input-field" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field id="co-street" label="Street and number">
              <input
                id="co-street"
                name="shipStreet"
                type="text"
                required
                placeholder="Bahnhofstrasse 1"
                className="input-field"
              />
            </Field>
          </div>
          <Field id="co-zip" label="ZIP">
            <input
              id="co-zip"
              name="shipZip"
              type="text"
              required
              minLength={4}
              placeholder="8001"
              className="input-field"
            />
          </Field>
          <Field id="co-city" label="City">
            <input
              id="co-city"
              name="shipCity"
              type="text"
              required
              placeholder="Zürich"
              className="input-field"
            />
          </Field>
        </div>
        <p className="mt-3 text-sm text-muted">Currently shipping within Switzerland.</p>
      </section>

      <section className="card">
        <h2 className="font-heading text-xl">Shipping method</h2>
        <div className="mt-4 space-y-3">
          <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded border border-line p-4 has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50">
            <span className="flex items-center gap-3">
              <input type="radio" name="shippingMethod" value="STANDARD" defaultChecked />
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
              <input type="radio" name="shippingMethod" value="EXPRESS" />
              <span>
                <span className="font-medium">Express</span>
                <span className="block text-sm text-muted">1–2 business days</span>
              </span>
            </span>
            <span className="font-semibold">{formatRappen(EXPRESS_SHIPPING_RAPPEN)}</span>
          </label>
        </div>
      </section>

      {state.error && <p className="text-sm font-medium text-error-text">{state.error}</p>}

      <PlaceOrderButton />
      <p className="text-center text-xs text-muted">
        Payment on invoice while we finish integrating Swiss payment providers.
      </p>
    </form>
  )
}
