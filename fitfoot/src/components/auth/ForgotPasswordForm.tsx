'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { forgotPasswordAction } from '@/lib/actions/auth'
import { Field } from '@/components/ui/Field'
import type { ActionState } from '@/lib/actions/types'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-gold w-full">
      {pending ? 'Sending…' : 'Send reset link'}
    </button>
  )
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [state, formAction] = useActionState<ActionState, FormData>(forgotPasswordAction, {})

  if (state.ok) {
    return (
      <div className="card mt-8 text-center">
        <p className="text-4xl" aria-hidden>
          📬
        </p>
        <h2 className="mt-3 font-heading text-xl">Check your inbox</h2>
        <p className="mt-2 text-sm text-muted">
          If an account exists for <strong>{email}</strong>, a reset link is on its way. It works
          once and expires in an hour.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-gold-600 hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="card mt-8 space-y-4">
      <Field id="fp-email" label="Email">
        <input
          id="fp-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
      </Field>
      <SubmitButton />
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-gold-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  )
}
