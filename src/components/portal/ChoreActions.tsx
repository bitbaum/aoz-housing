'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CHORE_LABELS } from '@/lib/config/household-tasks'
import { UI_LABELS } from '@/lib/constants/labels'

interface Roommate {
  id: string
  code: string
}

interface ChoreActionsProps {
  taskId: string
  roommates: Roommate[]
}

type ActiveModal = 'complete' | 'request' | 'attention' | 'complaint' | null

export function ChoreActions({ taskId, roommates }: ChoreActionsProps) {
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm" role="status" aria-live="polite">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { setActiveModal('complete'); setSuccess(null); setError(null) }}
          className="min-h-[44px] px-4 py-3 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors"
        >
          ✓ {CHORE_LABELS.actions.complete}
        </button>
        <button
          onClick={() => { setActiveModal('request'); setSuccess(null); setError(null) }}
          className="min-h-[44px] px-4 py-3 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-sm font-medium transition-colors"
        >
          📩 {CHORE_LABELS.actions.request}
        </button>
        <button
          onClick={() => { setActiveModal('attention'); setSuccess(null); setError(null) }}
          className="min-h-[44px] px-4 py-3 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg text-sm font-medium transition-colors"
        >
          ⚠️ {CHORE_LABELS.actions.attention}
        </button>
        <button
          onClick={() => { setActiveModal('complaint'); setSuccess(null); setError(null) }}
          className="min-h-[44px] px-4 py-3 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
        >
          🚨 {CHORE_LABELS.actions.complaint}
        </button>
      </div>

      {/* Modal forms */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                {activeModal === 'complete' && CHORE_LABELS.complete.title}
                {activeModal === 'request' && CHORE_LABELS.request.title}
                {activeModal === 'attention' && CHORE_LABELS.attention.title}
                {activeModal === 'complaint' && CHORE_LABELS.complaint.title}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700"
                aria-label={UI_LABELS.close}
              >
                ✕
              </button>
            </div>

            {activeModal === 'complete' && (
              <form onSubmit={handleComplete} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {CHORE_LABELS.complete.notes}
                  </label>
                  <textarea
                    name="notes"
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm"
                    rows={3}
                    placeholder={CHORE_LABELS.complete.notesPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {CHORE_LABELS.complete.duration}
                  </label>
                  <input
                    name="durationMinutes"
                    type="number"
                    min="1"
                    max="480"
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm"
                  />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {CHORE_LABELS.request.selectRoommate}
                  </label>
                  <select
                    name="requestedResidentId"
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm min-h-[44px]"
                  >
                    <option value="">{CHORE_LABELS.request.broadcast}</option>
                    {roommates.map(r => (
                      <option key={r.id} value={r.id}>{r.code}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">{CHORE_LABELS.request.broadcastDesc}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {CHORE_LABELS.request.message}
                  </label>
                  <textarea
                    name="message"
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {CHORE_LABELS.attention.message}
                  </label>
                  <textarea
                    name="message"
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm"
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
                <p className="text-sm text-gray-500">{CHORE_LABELS.complaint.note}</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {CHORE_LABELS.complaint.description}
                  </label>
                  <textarea
                    name="description"
                    required
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm"
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
