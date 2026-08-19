'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export function CrmNoteForm({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const res = await fetch(`/api/admin/customers/${customerId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    if (res.ok) {
      setBody('')
      router.refresh()
    } else {
      const resBody = (await res.json().catch(() => null)) as { error?: string } | null
      setError(resBody?.error ?? 'Could not save the note.')
    }
    setBusy(false)
  }

  return (
    <form onSubmit={onSubmit} className="mt-3">
      <label htmlFor="crm-note" className="sr-only">
        New note
      </label>
      <textarea
        id="crm-note"
        rows={3}
        required
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a note about this customer…"
        className="input-field text-sm"
      />
      {error && <p className="mt-1 text-sm font-medium text-error-text">{error}</p>}
      <button type="submit" disabled={busy || !body.trim()} className="btn-dark mt-2 text-sm">
        {busy ? 'Saving…' : 'Add note'}
      </button>
    </form>
  )
}
