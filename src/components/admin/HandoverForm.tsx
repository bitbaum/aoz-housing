'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HANDOVER_LABELS } from '@/lib/constants/labels/handover'

interface HandoverFormProps {
  userId: string
  name: string
}

/**
 * Gives a colleague who was provisioned by script their own way in.
 *
 * Collapsed to a single control until pressed: the roster's job is to show the
 * team at a glance, and five inline email inputs would bury that under a form.
 */
export function HandoverForm({ userId, name }: HandoverFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email }),
      })
      const data = (await response.json()) as { success: boolean; error?: string }
      if (!response.ok || !data.success) {
        setError(data.error ?? HANDOVER_LABELS.sendFailed)
        setBusy(false)
        return
      }
      setSentTo(email)
      setOpen(false)
      setBusy(false)
      // The roster now shows this person's address, so re-read the server data
      // rather than leaving a row that contradicts what just happened.
      router.refresh()
    } catch {
      setError(HANDOVER_LABELS.sendFailed)
      setBusy(false)
    }
  }

  if (sentTo) {
    return (
      <p className="text-xs text-status-success-text" role="status">
        {HANDOVER_LABELS.success} {sentTo}
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-outline text-xs"
        aria-label={`${HANDOVER_LABELS.action}: ${name}`}
        title={HANDOVER_LABELS.actionHint}
      >
        {HANDOVER_LABELS.action}
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center justify-end gap-2">
      <label className="sr-only" htmlFor={`handover-${userId}`}>
        {HANDOVER_LABELS.emailField} — {name}
      </label>
      <input
        id={`handover-${userId}`}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={HANDOVER_LABELS.emailPlaceholder}
        className="input text-sm"
      />
      <button type="submit" disabled={busy} className="btn-secondary text-xs">
        {busy ? HANDOVER_LABELS.sending : HANDOVER_LABELS.submit}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="btn-ghost text-xs">
        {HANDOVER_LABELS.cancel}
      </button>
      {error && (
        <p className="w-full text-right text-xs text-status-error-text" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
