'use client'

import { useState, FormEvent } from 'react'

interface InviteResult {
  success: boolean
  user?: { code: string; name: string; email: string }
  emailSent?: boolean
  error?: string
}

export function InviteForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; result: InviteResult }
    | { status: 'error'; message: string }
  >({ status: 'idle' })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setState({ status: 'loading' })

    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })
      const data: InviteResult = await res.json()

      if (!data.success) {
        setState({ status: 'error', message: data.error || 'Fehler beim Einladen' })
        return
      }

      setState({ status: 'success', result: data })
      setName('')
      setEmail('')
    } catch {
      setState({ status: 'error', message: 'Netzwerkfehler – bitte erneut versuchen' })
    }
  }

  function reset() {
    setState({ status: 'idle' })
  }

  if (state.status === 'success' && state.result.user) {
    const { user, emailSent } = state.result
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg" role="status">
          <p className="font-medium text-green-800 mb-1">Mitarbeiter eingeladen</p>
          <p className="text-sm text-green-700">
            {user.name} ({user.email}) wurde erstellt.
          </p>
          {emailSent ? (
            <p className="text-sm text-green-700 mt-1">
              Einladungs-E-Mail gesendet mit Zugangscode.
            </p>
          ) : (
            <div className="mt-3 p-3 bg-white border border-green-200 rounded">
              <p className="text-xs text-gray-500 mb-1">E-Mail nicht gesendet — Code manuell übermitteln:</p>
              <p className="font-mono text-lg font-bold text-gray-900 tracking-wider">{user.code}</p>
            </div>
          )}
        </div>
        <button
          onClick={reset}
          className="text-sm text-aoz-primary hover:underline"
        >
          Weitere Person einladen
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {state.status === 'error' && (
        <p role="alert" className="text-sm text-red-600 p-3 bg-red-50 border border-red-200 rounded">
          {state.message}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="invite-name" className="label">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="invite-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vorname Nachname"
            required
            minLength={2}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="invite-email" className="label">
            E-Mail-Adresse <span className="text-red-500">*</span>
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            className="input"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={state.status === 'loading'}
        className="btn-primary min-h-[44px] px-6 disabled:opacity-50"
      >
        {state.status === 'loading' ? 'Wird gesendet...' : 'Einladung senden'}
      </button>
    </form>
  )
}
