'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { registerAction } from '@/lib/actions/auth'
import { Field } from '@/components/ui/Field'
import type { ActionState } from '@/lib/actions/types'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-gold w-full">
      {pending ? 'Creating account…' : 'Create account'}
    </button>
  )
}

export function RegisterForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(registerAction, {})

  return (
    <form action={formAction} className="card mt-8 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="reg-first" label="First name">
          <input
            id="reg-first"
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
            className="input-field"
          />
        </Field>
        <Field id="reg-last" label="Last name">
          <input
            id="reg-last"
            name="lastName"
            type="text"
            required
            autoComplete="family-name"
            className="input-field"
          />
        </Field>
      </div>
      <Field id="reg-email" label="Email">
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input-field"
        />
      </Field>
      <Field id="reg-password" label="Password" hint="At least 8 characters.">
        <input
          id="reg-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input-field"
        />
      </Field>
      {state.error && <p className="text-sm font-medium text-error-text">{state.error}</p>}
      <SubmitButton />
      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-gold-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
