'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { loginAction } from '@/lib/actions/auth'
import { Field } from '@/components/ui/Field'
import type { ActionState } from '@/lib/actions/types'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-gold w-full">
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  )
}

export function LoginForm() {
  const searchParams = useSearchParams()
  const [state, formAction] = useActionState<ActionState, FormData>(loginAction, {})

  return (
    <form action={formAction} className="card mt-8 space-y-4">
      <input type="hidden" name="next" value={searchParams.get('next') ?? ''} />
      <Field id="login-email" label="Email">
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input-field"
        />
      </Field>
      <Field id="login-password" label="Password">
        <input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input-field"
        />
        <Link
          href="/forgot-password"
          className="mt-1 inline-block text-sm text-muted hover:text-gold-600"
        >
          Forgot your password?
        </Link>
      </Field>
      {state.error && <p className="text-sm font-medium text-error-text">{state.error}</p>}
      <SubmitButton />
      <p className="text-center text-sm text-muted">
        New to FitFoot?{' '}
        <Link href="/register" className="font-medium text-gold-600 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  )
}
