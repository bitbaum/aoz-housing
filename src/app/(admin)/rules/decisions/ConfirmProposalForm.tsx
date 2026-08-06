'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { confirmProposal } from '@/lib/actions/governance'

/**
 * Staff sign-off on a house decision.
 *
 * A veto asks for a note because the house will see this outcome: "abgelehnt"
 * with no reason reads as arbitrary and is the quickest way to teach residents
 * that taking part is pointless.
 */
export function ConfirmProposalForm({ proposalId }: { proposalId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(decision: 'CONFIRMED' | 'VETOED') {
    if (decision === 'VETOED' && notes.trim().length < 5) {
      setError('Bitte begründe die Ablehnung — die Bewohnenden sehen diese Antwort.')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await confirmProposal({ proposalId, decision, staffNotes: notes || undefined })
      if (result.success) router.refresh()
      else setError(result.error)
    })
  }

  return (
    <div className="mt-4 border-t border-ui-border pt-4">
      <label htmlFor={`notes-${proposalId}`} className="label">
        Antwort an die Bewohnenden
      </label>
      <textarea
        id={`notes-${proposalId}`}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={2}
        className="input w-full"
        placeholder="Optional bei Bestätigung, nötig bei Ablehnung"
      />

      {error && (
        <p className="mt-2 text-sm text-status-error-text" role="alert">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => submit('CONFIRMED')}
          disabled={isPending}
          className="btn-primary min-h-[44px]"
        >
          Bestätigen
        </button>
        <button
          type="button"
          onClick={() => submit('VETOED')}
          disabled={isPending}
          className="btn-secondary min-h-[44px]"
        >
          Ablehnen
        </button>
      </div>
    </div>
  )
}
