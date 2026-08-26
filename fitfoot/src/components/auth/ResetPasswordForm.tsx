'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { resetPasswordAction } from '@/lib/actions/auth'
import { Field } from '@/components/ui/Field'
import type { ActionState } from '@/lib/actions/types'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-gold w-full">
      {pending ? 'Saving…' : 'Set new password'}
    </button>
  )
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [state, formAction] = useActionState<ActionState, FormData>(resetPasswordAction, {})

  if (!token) {
    return (
      <div className="card mt-8 text-center">
        <p className="text-sm text-muted">
          This link is missing its reset code. Please request a new one.
        </p>
        <Link href="/forgot-password" className="btn-gold mt-4 inline-flex">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="card mt-8 space-y-4">
      <input type="hidden" name="token" value={token} />
      <Field id="rp-password" label="New password" hint="At least 8 characters.">
        <input
          id="rp-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input-field"
        />
      </Field>
      <Field id="rp-confirm" label="Confirm new password">
        <input
          id="rp-confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className="input-field"
        />
      </Field>
      {state.error && <p className="text-sm font-medium text-error-text">{state.error}</p>}
      <SubmitButton />
    </form>
  )
}
