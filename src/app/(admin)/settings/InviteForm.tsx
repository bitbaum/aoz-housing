'use client'

import { useState, FormEvent } from 'react'
import { INVITE_FORM_LABELS } from '@/lib/constants'

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
        setState({ status: 'error', message: data.error || INVITE_FORM_LABELS.errorGeneric })
        return
      }

      setState({ status: 'success', result: data })
      setName('')
      setEmail('')
    } catch {
      setState({ status: 'error', message: INVITE_FORM_LABELS.errorNetwork })
    }
  }

  function reset() {
    setState({ status: 'idle' })
  }

  if (state.status === 'success' && state.result.user) {
    const { user, emailSent } = state.result
    return (
      <div className="space-y-4">
        <div className="p-4 bg-status-success/10 border border-status-success/25 rounded-lg" role="status">
          <p className="font-medium text-status-success-text mb-1">{INVITE_FORM_LABELS.successTitle}</p>
          <p className="text-sm text-status-success-text">
            {INVITE_FORM_LABELS.successDesc(user.name, user.email)}
          </p>
          {emailSent ? (
            <p className="text-sm text-status-success-text mt-1">
              {INVITE_FORM_LABELS.emailSent}
            </p>
          ) : (
            <div className="mt-3 p-3 bg-ui-surface border border-status-success/25 rounded">
              <p className="text-xs text-ui-muted mb-1">{INVITE_FORM_LABELS.emailNotSent}</p>
              <p className="font-mono text-lg font-bold text-ui-text tracking-wider">{user.code}</p>
            </div>
          )}
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center min-h-[44px] px-1 text-sm text-aoz-primary hover:underline"
        >
          {INVITE_FORM_LABELS.inviteAnother}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {state.status === 'error' && (
        <p role="alert" className="alert-error">
          {state.message}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="invite-name" className="label">
            {INVITE_FORM_LABELS.fieldName} <span className="text-status-error-text">*</span>
          </label>
          <input
            id="invite-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={INVITE_FORM_LABELS.fieldNamePlaceholder}
            required
            minLength={2}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="invite-email" className="label">
            {INVITE_FORM_LABELS.fieldEmail} <span className="text-status-error-text">*</span>
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={INVITE_FORM_LABELS.fieldEmailPlaceholder}
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
        {state.status === 'loading' ? INVITE_FORM_LABELS.sending : INVITE_FORM_LABELS.submit}
      </button>
    </form>
  )
}
