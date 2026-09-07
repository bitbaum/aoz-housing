'use client'

import { useActionState, useState } from 'react'

import { reviewClientFact, type ClientFactFormState } from '@/lib/actions/client-facts'
import { CLIENT_FACT_LABELS as L } from '@/lib/constants/labels'

/**
 * "Gesehen" or "Zurückweisen", on one entry.
 *
 * The note is required on a rejection and optional on a confirmation, which is
 * why the textarea appears only when rejecting: telling somebody their entry
 * was refused without saying what is wrong leaves them with nothing to do, and
 * they cannot ask a follow-up question here — this is not a chat.
 *
 * The action RETURNS its outcome, so a validation failure leaves the note the
 * reviewer typed exactly where it was.
 */
export function ReviewFactForm({ id, kind }: { id: string; kind: string }) {
  const [state, action, pending] = useActionState<ClientFactFormState, FormData>(
    reviewClientFact,
    {},
  )
  const [rejecting, setRejecting] = useState(false)

  return (
    <form action={action} className="mt-3 border-t border-ui-border pt-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="decision" value={rejecting ? 'REJECTED' : 'CONFIRMED'} />

      {rejecting && (
        <div className="mb-2">
          <label className="block text-xs text-ui-muted" htmlFor={`note-${id}`}>
            {L.review.noteLabel}
          </label>
          <textarea
            id={`note-${id}`}
            name="staffNote"
            rows={2}
            placeholder={L.review.notePlaceholder}
            className="w-full rounded-lg border border-ui-border p-3"
          />
          {state.fieldErrors?.staffNote && (
            <p className="mt-1 text-xs text-status-error-text">{state.fieldErrors.staffNote[0]}</p>
          )}
        </div>
      )}

      {state.error && <p className="mb-2 text-xs text-status-error-text">{state.error}</p>}

      <div className="flex flex-wrap gap-2">
        {rejecting ? (
          <>
            <button className="btn-warning" disabled={pending}>
              {L.review.reject}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setRejecting(false)}>
              {L.review.confirm}
            </button>
          </>
        ) : (
          <>
            <button className="btn-primary" disabled={pending}>
              {L.review.confirm}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setRejecting(true)}>
              {L.review.reject}
            </button>
          </>
        )}
      </div>
    </form>
  )
}
