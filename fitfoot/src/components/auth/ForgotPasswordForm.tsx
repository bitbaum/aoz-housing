'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setState('busy')
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    // Always show success — never reveal whether the email exists.
    setState('done')
  }

  if (state === 'done') {
    return (
      <div className="card-premium mt-8 text-center">
        <p className="text-4xl" aria-hidden>
          📬
        </p>
        <h2 className="mt-3 font-heading text-xl">Check your inbox</h2>
        <p className="mt-2 text-sm text-neutral-600">
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
    <form onSubmit={onSubmit} className="card-premium mt-8 space-y-4">
      <div>
        <label htmlFor="fp-email" className="label-field">
          Email
        </label>
        <input
          id="fp-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
      </div>
      <button type="submit" disabled={state === 'busy'} className="btn-gold w-full">
        {state === 'busy' ? 'Sending…' : 'Send reset link'}
      </button>
      <p className="text-center text-sm text-neutral-600">
        <Link href="/login" className="font-medium text-gold-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  )
}
