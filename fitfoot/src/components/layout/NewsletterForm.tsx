'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { newsletterAction } from '@/lib/actions/checkout'
import type { ActionState } from '@/lib/actions/types'

function SubscribeButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-gold px-4 text-sm">
      Subscribe
    </button>
  )
}

export function NewsletterForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(newsletterAction, {})

  if (state.ok) {
    return <p className="mt-3 text-sm font-medium text-success-text">Thanks — you&apos;re on the list!</p>
  }

  return (
    <form action={formAction} className="mt-3 flex gap-2">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        placeholder="your.email@example.com"
        className="input-field text-sm"
      />
      <SubscribeButton />
    </form>
  )
}
