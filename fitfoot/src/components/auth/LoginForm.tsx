'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const body = (await res.json().catch(() => null)) as { error?: string; role?: string } | null
    if (res.ok) {
      const next = searchParams.get('next')
      const fallback = body?.role === 'STAFF' || body?.role === 'ADMIN' ? '/admin' : '/account'
      router.push(next && next.startsWith('/') ? next : fallback)
      router.refresh()
    } else {
      setBusy(false)
      setError(body?.error ?? 'Sign-in failed. Please try again.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="card mt-8 space-y-4">
      <div>
        <label htmlFor="login-email" className="label-field">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="input-field"
        />
      </div>
      <div>
        <label htmlFor="login-password" className="label-field">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          required
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="input-field"
        />
        <Link
          href="/forgot-password"
          className="mt-1 inline-block text-sm text-muted hover:text-gold-600"
        >
          Forgot your password?
        </Link>
      </div>
      {error && <p className="text-sm font-medium text-error-text">{error}</p>}
      <button type="submit" disabled={busy} className="btn-gold w-full">
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-center text-sm text-muted">
        New to FitFoot?{' '}
        <Link href="/register" className="font-medium text-gold-600 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  )
}
