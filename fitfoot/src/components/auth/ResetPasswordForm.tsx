'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (password !== confirm) {
      setError('The passwords do not match.')
      return
    }
    setBusy(true)
    setError('')
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    if (res.ok) {
      router.push('/login?reset=1')
    } else {
      setBusy(false)
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      setError(body?.error ?? 'Could not reset your password. Please try again.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="card mt-8 space-y-4">
      <div>
        <label htmlFor="rp-password" className="label-field">
          New password
        </label>
        <input
          id="rp-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />
        <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="rp-confirm" className="label-field">
          Confirm new password
        </label>
        <input
          id="rp-confirm"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="input-field"
        />
      </div>
      {error && <p className="text-sm font-medium text-error-text">{error}</p>}
      <button type="submit" disabled={busy} className="btn-gold w-full">
        {busy ? 'Saving…' : 'Set new password'}
      </button>
    </form>
  )
}
