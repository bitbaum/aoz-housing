'use client'

import { useActionState, useEffect, useRef } from 'react'
import { addCrmNoteAction } from '@/lib/actions/crm'
import type { ActionState } from '@/lib/actions/types'

export function CrmNoteForm({ customerId }: { customerId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addCrmNoteAction.bind(null, customerId),
    {}
  )

  useEffect(() => {
    if (state.ok) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="mt-3">
      <label htmlFor="crm-note" className="sr-only">
        New note
      </label>
      <textarea
        id="crm-note"
        name="body"
        rows={3}
        required
        placeholder="Add a note about this customer…"
        className="input-field text-sm"
      />
      {state.error && <p className="mt-1 text-sm font-medium text-error-text">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-dark mt-2 text-sm">
        {pending ? 'Saving…' : 'Add note'}
      </button>
    </form>
  )
}
