'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { contactAction } from '@/lib/actions/checkout'
import { Field } from '@/components/ui/Field'
import type { ActionState } from '@/lib/actions/types'

function SendButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-gold w-full">
      {pending ? 'Sending…' : 'Send Message'}
    </button>
  )
}

export function ContactForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(contactAction, {})

  if (state.ok) {
    return (
      <div className="card flex items-center justify-center text-center">
        <div>
          <p className="text-4xl" aria-hidden>
            ✉️
          </p>
          <h2 className="mt-3 font-heading text-2xl">Message sent</h2>
          <p className="mt-2 text-sm text-muted">
            Thanks for reaching out — we&apos;ll get back to you within one business day.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className="card">
      <h2 className="font-heading text-2xl">Send us a message</h2>
      <div className="mt-6 space-y-4">
        <Field id="contact-name" label="Name">
          <input id="contact-name" name="name" type="text" required className="input-field" />
        </Field>
        <Field id="contact-email" label="Email">
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            placeholder="your.email@example.com"
            className="input-field"
          />
        </Field>
        <Field id="contact-subject" label="Subject">
          <input id="contact-subject" name="subject" type="text" required className="input-field" />
        </Field>
        <Field id="contact-message" label="Message">
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            placeholder="Tell us how we can help you..."
            className="input-field"
          />
        </Field>
        {state.error && <p className="text-sm font-medium text-error-text">{state.error}</p>}
        <SendButton />
      </div>
    </form>
  )
}
