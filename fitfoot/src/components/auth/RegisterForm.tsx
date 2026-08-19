'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function RegisterForm() {
  const router = useRouter()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      router.push('/account')
      router.refresh()
    } else {
      setBusy(false)
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      setError(body?.error ?? 'Registration failed. Please try again.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="card mt-8 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="reg-first" className="label-field">
            First name
          </label>
          <input
            id="reg-first"
            type="text"
            required
            autoComplete="given-name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="reg-last" className="label-field">
            Last name
          </label>
          <input
            id="reg-last"
            type="text"
            required
            autoComplete="family-name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="input-field"
          />
        </div>
      </div>
      <div>
        <label htmlFor="reg-email" className="label-field">
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="input-field"
        />
      </div>
      <div>
        <label htmlFor="reg-password" className="label-field">
          Password
        </label>
        <input
          id="reg-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="input-field"
        />
        <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
      </div>
      {error && <p className="text-sm font-medium text-error-text">{error}</p>}
      <button type="submit" disabled={busy} className="btn-gold w-full">
        {busy ? 'Creating account…' : 'Create account'}
      </button>
      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-gold-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
