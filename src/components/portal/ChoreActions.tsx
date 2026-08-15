'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { CHORE_LABELS } from '@/lib/config/household-tasks'
import { residentName, type NamedResident } from '@/lib/utils/resident-name'

interface Roommate extends NamedResident {
  id: string
}

interface ChoreActionsProps {
  taskId: string
  roommates: Roommate[]
  /** The task's agreed definition of done. Empty = this house hasn't set one. */
  checklist?: string[]
  /** Minutes this task is expected to take — what counts if nothing is logged. */
  estimatedMinutes?: number | null
}

type ActiveModal = 'complete' | 'request' | 'attention' | 'complaint' | null

export function ChoreActions({
  taskId,
  roommates,
  checklist = [],
  estimatedMinutes,
}: ChoreActionsProps) {
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const modalPanelRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  const closeModal = () => setActiveModal(null)

  useEffect(() => {
    if (!activeModal) return
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    modalPanelRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeModal()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocusedRef.current?.focus?.()
    }
  }, [activeModal])

  async function submitChoreAction(
    endpoint: string,
    buildBody: (form: FormData) => Record<string, unknown>,
    successMessage: string,
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/portal/chores/${taskId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(form)),
      })
      if (res.ok) {
        setSuccess(successMessage)
        setActiveModal(null)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || CHORE_LABELS.errors.generic)
      }
    } catch {
      setError(CHORE_LABELS.errors.generic)
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = (e: React.FormEvent<HTMLFormElement>) =>
    submitChoreAction('complete', (form) => ({
      notes: form.get('notes') || undefined,
      durationMinutes: form.get('durationMinutes') ? Number(form.get('durationMinutes')) : undefined,
      // Partial ticks are deliberately allowed. Someone who did four of five
      // things has done four things; forcing all-or-nothing would push them to
      // either overclaim or log nothing at all, and both corrupt the record.
      completedItems: form.getAll('completedItems').map(String),
    }), CHORE_LABELS.success.completed, e)

  const handleRequest = (e: React.FormEvent<HTMLFormElement>) =>
    submitChoreAction('request', (form) => ({
      requestedResidentId: form.get('requestedResidentId') || undefined,
      message: form.get('message') || undefined,
    }), CHORE_LABELS.success.requested, e)

  const handleAttention = (e: React.FormEvent<HTMLFormElement>) =>
    submitChoreAction('attention', (form) => ({
      message: form.get('message') || undefined,
    }), CHORE_LABELS.success.flagged, e)

  const handleComplaint = (e: React.FormEvent<HTMLFormElement>) =>
    submitChoreAction('complaint', (form) => ({
      description: form.get('description'),
    }), CHORE_LABELS.success.complained, e)

  return (
    <div>
      {/* Success / Error messages */}
      {success && (
        <div className="mb-4 alert-success" role="status" aria-live="polite">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 alert-error" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { setActiveModal('complete'); setSuccess(null); setError(null) }}
          className="min-h-[44px] px-4 py-3 bg-status-success/10 text-status-success-text hover:bg-status-success/15 rounded-lg text-sm font-medium transition-colors"
        >
          ✓ {CHORE_LABELS.actions.complete}
        </button>
        <button
          onClick={() => { setActiveModal('request'); setSuccess(null); setError(null) }}
          className="min-h-[44px] px-4 py-3 bg-brand-secondary/10 text-brand-secondary hover:bg-brand-secondary/15 rounded-lg text-sm font-medium transition-colors"
        >
          📩 {CHORE_LABELS.actions.request}
        </button>
        <button
          onClick={() => { setActiveModal('attention'); setSuccess(null); setError(null) }}
          className="min-h-[44px] px-4 py-3 bg-status-warning/10 text-status-warning-text hover:bg-status-warning/15 rounded-lg text-sm font-medium transition-colors"
        >
          ⚠️ {CHORE_LABELS.actions.attention}
        </button>
        <button
          onClick={() => { setActiveModal('complaint'); setSuccess(null); setError(null) }}
          className="min-h-[44px] px-4 py-3 bg-status-error/8 text-status-error-text hover:bg-status-error/12 rounded-lg text-sm font-medium transition-colors"
        >
          🚨 {CHORE_LABELS.actions.complaint}
        </button>
      </div>

      {/* Modal forms */}
      {activeModal && (
        <div className="scrim z-50 flex items-end justify-center p-4 sm:items-center">
          <div
            ref={modalPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chore-modal-title"
            tabIndex={-1}
            className="bg-ui-surface rounded-t-xl sm:rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto p-6 focus:outline-none"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="chore-modal-title" className="font-semibold text-ui-text">
                {activeModal === 'complete' && CHORE_LABELS.complete.title}
                {activeModal === 'request' && CHORE_LABELS.request.title}
                {activeModal === 'attention' && CHORE_LABELS.attention.title}
                {activeModal === 'complaint' && CHORE_LABELS.complaint.title}
              </h3>
              <button
                onClick={closeModal}
                className="btn-icon"
                aria-label="Schliessen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeModal === 'complete' && (
              <form onSubmit={handleComplete} className="space-y-4">
                {checklist.length > 0 && (
                  <fieldset>
                    <legend className="block text-sm font-medium text-ui-muted mb-1">
                      {CHORE_LABELS.complete.checklistTitle}
                    </legend>
                    <p className="text-xs text-ui-muted mb-2">
                      {CHORE_LABELS.complete.checklistHint}
                    </p>
                    <div className="space-y-1">
                      {checklist.map(item => (
                        <label
                          key={item}
                          className="flex items-center gap-3 min-h-[44px] px-2 -mx-2 rounded-lg cursor-pointer hover:bg-ui-subtle"
                        >
                          <input
                            type="checkbox"
                            name="completedItems"
                            value={item}
                            defaultChecked
                            className="w-5 h-5 shrink-0 accent-brand-primary"
                          />
                          <span className="text-sm text-ui-text">{item}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                <div>
                  <label className="block text-sm font-medium text-ui-muted mb-1">
                    {CHORE_LABELS.complete.notes}
                  </label>
                  <textarea
                    name="notes"
                    className="w-full rounded-lg border border-ui-border-strong p-3 text-sm"
                    rows={3}
                    placeholder={CHORE_LABELS.complete.notesPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ui-muted mb-1">
                    {CHORE_LABELS.complete.duration}
                  </label>
                  <input
                    name="durationMinutes"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="480"
                    placeholder={estimatedMinutes ? String(estimatedMinutes) : undefined}
                    className="w-full rounded-lg border border-ui-border-strong p-3 text-sm"
                  />
                  <p className="text-xs text-ui-muted mt-1">{CHORE_LABELS.complete.durationHint}</p>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full min-h-[44px]"
                >
                  {submitting ? CHORE_LABELS.actions.completing : CHORE_LABELS.actions.complete}
                </button>
              </form>
            )}

            {activeModal === 'request' && (
              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ui-muted mb-1">
                    {CHORE_LABELS.request.selectRoommate}
                  </label>
                  <select
                    name="requestedResidentId"
                    className="w-full rounded-lg border border-ui-border-strong p-3 text-sm min-h-[44px]"
                  >
                    <option value="">{CHORE_LABELS.request.broadcast}</option>
                    {roommates.map(r => (
                      <option key={r.id} value={r.id}>{residentName(r)}</option>
                    ))}
                  </select>
                  <p className="text-xs text-ui-muted mt-1">{CHORE_LABELS.request.broadcastDesc}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ui-muted mb-1">
                    {CHORE_LABELS.request.message}
                  </label>
                  <textarea
                    name="message"
                    className="w-full rounded-lg border border-ui-border-strong p-3 text-sm"
                    rows={2}
                    placeholder={CHORE_LABELS.request.messagePlaceholder}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full min-h-[44px]"
                >
                  {submitting ? CHORE_LABELS.request.submitting : CHORE_LABELS.request.submit}
                </button>
              </form>
            )}

            {activeModal === 'attention' && (
              <form onSubmit={handleAttention} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ui-muted mb-1">
                    {CHORE_LABELS.attention.message}
                  </label>
                  <textarea
                    name="message"
                    className="w-full rounded-lg border border-ui-border-strong p-3 text-sm"
                    rows={3}
                    placeholder={CHORE_LABELS.attention.messagePlaceholder}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full min-h-[44px]"
                >
                  {submitting ? CHORE_LABELS.attention.submitting : CHORE_LABELS.attention.submit}
                </button>
              </form>
            )}

            {activeModal === 'complaint' && (
              <form onSubmit={handleComplaint} className="space-y-4">
                <p className="text-sm text-ui-muted">{CHORE_LABELS.complaint.note}</p>
                <div>
                  <label className="block text-sm font-medium text-ui-muted mb-1">
                    {CHORE_LABELS.complaint.description}
                  </label>
                  <textarea
                    name="description"
                    required
                    className="w-full rounded-lg border border-ui-border-strong p-3 text-sm"
                    rows={4}
                    placeholder={CHORE_LABELS.complaint.descriptionPlaceholder}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full min-h-[44px]"
                >
                  {submitting ? CHORE_LABELS.complaint.submitting : CHORE_LABELS.complaint.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
