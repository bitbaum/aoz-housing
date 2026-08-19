'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { EXPENSE_CATEGORIES } from '@/lib/config/expenses'
import { chfToRappen } from '@/lib/expenses/money'

interface Member {
  id: string
  name: string
}

interface AddExpenseFormProps {
  myResidentId: string
  members: Member[]
}

const L = PORTAL_LABELS.expenses

export function AddExpenseForm({ myResidentId, members }: AddExpenseFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0].id)
  const [paidById, setPaidById] = useState(myResidentId)
  const [participantIds, setParticipantIds] = useState<string[]>(members.map((m) => m.id))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function toggleParticipant(id: string) {
    setParticipantIds((current) =>
      current.includes(id) ? current.filter((p) => p !== id) : [...current, id]
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    const amountRappen = chfToRappen(amount)
    if (amountRappen === null || amountRappen === 0) {
      setError(L.amountInvalid)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/portal/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          category,
          amountRappen,
          paidById,
          participantIds,
        }),
      })
      const body = await response.json()
      if (!body.success) {
        setError(body.error || PORTAL_LABELS.form.errorGeneric)
        return
      }
      setDescription('')
      setAmount('')
      setParticipantIds(members.map((m) => m.id))
      setOpen(false)
      router.push('/portal/expenses?created=true')
    } catch {
      setError(PORTAL_LABELS.form.errorGeneric)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <div className="mb-6">
        <button type="button" onClick={() => setOpen(true)} className="btn-secondary">
          <Plus className="w-4 h-4" aria-hidden="true" />
          {L.addTitle}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card mb-6">
      <h2 className="text-lg font-semibold text-ui-text mb-4">{L.addTitle}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-ui-text">{L.descriptionLabel}</span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={L.descriptionPlaceholder}
            required
            className="input mt-1"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ui-text">{L.amountLabel}</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={L.amountPlaceholder}
            required
            className="input mt-1 numeric"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ui-text">{L.categoryLabel}</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input mt-1"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ui-text">{L.paidByLabel}</span>
          <select
            value={paidById}
            onChange={(e) => setPaidById(e.target.value)}
            className="input mt-1"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id === myResidentId ? `${m.name} (${L.you})` : m.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-ui-text">
          {L.participantsLabel}{' '}
          <span className="font-normal text-ui-muted">({L.participantsHint})</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {members.map((m) => (
            <label key={m.id} className="inline-flex items-center gap-2 min-h-[44px] text-sm text-ui-text">
              <input
                type="checkbox"
                checked={participantIds.includes(m.id)}
                onChange={() => toggleParticipant(m.id)}
                className="w-4 h-4"
              />
              {m.name}
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <div role="alert" className="alert-error mt-4">
          {error}
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <button type="submit" disabled={submitting || participantIds.length === 0} className="btn-primary">
          {submitting ? PORTAL_LABELS.form.saving : L.submit}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
          {PORTAL_LABELS.form.cancel}
        </button>
      </div>
    </form>
  )
}
