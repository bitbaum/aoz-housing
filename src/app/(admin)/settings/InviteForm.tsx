'use client'

import { useState, FormEvent } from 'react'
import { INVITE_FORM_LABELS, ROLE_LABELS, SCOPE_LABELS } from '@/lib/constants'
import {
  ASSIGNABLE_STAFF_ROLES,
  STAFF_SCOPES,
  type StaffRole,
  type StaffScopeId,
} from '@/lib/auth/role-policy'

interface InviteResult {
  success: boolean
  user?: { code: string; name: string; email: string }
  emailSent?: boolean
  error?: string
}

export function InviteForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<StaffRole>('BETREUUNG')
  const [scope, setScope] = useState<StaffScopeId>('OWN_DOMAIN')
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
        body: JSON.stringify({ name: name.trim(), email: email.trim(), role, scope }),
      })
      const data: InviteResult = await res.json()

      if (!data.success) {
        setState({ status: 'error', message: data.error || INVITE_FORM_LABELS.errorGeneric })
        return
      }

      setState({ status: 'success', result: data })
      setName('')
      setEmail('')
      setRole('BETREUUNG')
      setScope('OWN_DOMAIN')
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
        <div
          className="p-4 bg-status-success/10 border border-status-success/25 rounded-lg"
          role="status"
        >
          <p className="font-medium text-status-success-text mb-1">
            {INVITE_FORM_LABELS.successTitle}
          </p>
          <p className="text-sm text-status-success-text">
            {INVITE_FORM_LABELS.successDesc(user.name, user.email)}
          </p>
          {emailSent ? (
            <p className="text-sm text-status-success-text mt-1">{INVITE_FORM_LABELS.emailSent}</p>
          ) : (
            <div className="mt-3 p-3 bg-ui-surface border border-status-success/25 rounded">
              <p className="text-xs text-ui-muted mb-1">{INVITE_FORM_LABELS.emailNotSent}</p>
              <p className="font-mono text-lg font-bold text-ui-text tracking-wider">{user.code}</p>
            </div>
          )}
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center min-h-[44px] px-1 text-sm text-brand-primary hover:underline"
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
        <div>
          <label htmlFor="invite-role" className="label">
            {INVITE_FORM_LABELS.fieldRole} <span className="text-status-error-text">*</span>
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            className="input"
          >
            {/* ASSIGNABLE, not every role in the enum. "Leitung" (ADMIN) is
                retired and the API refuses it — offering it here made the one
                UI that creates colleagues point at the one value that must
                never be created again. */}
            {ASSIGNABLE_STAFF_ROLES.map((id) => (
              <option key={id} value={id}>
                {ROLE_LABELS[id] || id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="invite-scope" className="label">
            {INVITE_FORM_LABELS.fieldScope} <span className="text-status-error-text">*</span>
          </label>
          <select
            id="invite-scope"
            value={scope}
            onChange={(e) => setScope(e.target.value as StaffScopeId)}
            className="input"
          >
            {STAFF_SCOPES.map((id) => (
              <option key={id} value={id}>
                {SCOPE_LABELS[id] || id}
              </option>
            ))}
          </select>
          {/* Why this field exists at all: without it the only way to describe
              a Betreuerin who also covers every domain was to pick "Leitung",
              which is precisely how the retired role stayed alive in the UI. */}
          <p className="mt-1 text-xs text-ui-muted">{INVITE_FORM_LABELS.fieldScopeHint}</p>
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
