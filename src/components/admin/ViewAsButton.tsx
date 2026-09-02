'use client'

import { useState } from 'react'
import { IMPERSONATION_LABELS } from '@/lib/auth/impersonation'

interface ViewAsButtonProps {
  userId: string
  /** Only for the accessible name — the row already shows it visually. */
  name: string
}

/**
 * Opens a colleague's view from the team roster.
 *
 * Deliberately NOT a link: this changes which session the browser holds, which
 * is a POST, and a GET that mutates a session is how a stray prefetch signs you
 * in as somebody else.
 */
export function ViewAsButton({ userId, name }: ViewAsButtonProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function open() {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = (await response.json()) as { success: boolean; error?: string }
      if (!response.ok || !data.success) {
        setError(data.error ?? IMPERSONATION_LABELS.notPermitted)
        setBusy(false)
        return
      }
      // Hard navigation for the same reason the banner uses one: every server
      // component cached for the old identity must be thrown away.
      window.location.assign('/')
    } catch {
      setError(IMPERSONATION_LABELS.notPermitted)
      setBusy(false)
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="btn-outline text-xs"
        aria-label={`${IMPERSONATION_LABELS.open}: ${name}`}
        title={IMPERSONATION_LABELS.openHint}
      >
        {IMPERSONATION_LABELS.open}
      </button>
      {error && (
        <p className="mt-1 text-xs text-status-error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
