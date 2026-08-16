'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CHORE_LABELS,
  TASK_CATEGORY_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_TYPE_LABELS,
} from '@/lib/config/household-tasks'
import { unitLabel } from '@/lib/utils/unit-name'

interface UnitOption {
  id: string
  code: string
  nickname: string | null
}

/**
 * Staff creating a chore for a unit.
 *
 * Posts FormData to `/api/chores`, which validates with the SAME schema the
 * resident form uses. Two definitions of what a task is would drift, and the
 * drift would surface as a task residents can see but not complete.
 *
 * The unit is chosen explicitly because staff are not in one — the resident
 * route infers it from the author's own placement, which is exactly the
 * assumption that made this feature impossible for them.
 */
export function StaffChoreForm({ units }: { units: UnitOption[] }) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('saving')
    setError(null)

    try {
      const response = await fetch('/api/chores', {
        method: 'POST',
        body: new FormData(event.currentTarget),
      })
      const result = await response.json()
      if (!result.success) {
        setStatus('error')
        setError(result.error ?? CHORE_LABELS.form.createError)
        return
      }
      router.push('/chores')
      router.refresh()
    } catch {
      setStatus('error')
      setError(CHORE_LABELS.form.createError)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 max-w-2xl">
      <label className="block">
        <span className="label">{CHORE_LABELS.admin.colUnit}</span>
        <select name="housingUnitId" required className="input" defaultValue="">
          <option value="" disabled>
            {CHORE_LABELS.admin.chooseUnit}
          </option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unitLabel(unit)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="label">{CHORE_LABELS.form.title}</span>
        <input name="title" required maxLength={200} className="input" />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="label">{CHORE_LABELS.form.category}</span>
          <select name="category" className="input" defaultValue="OTHER">
            {Object.entries(TASK_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="label">{CHORE_LABELS.form.priority}</span>
          <select name="priority" className="input" defaultValue="NORMAL">
            {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="label">{CHORE_LABELS.form.taskType}</span>
        <select name="taskType" className="input" defaultValue="RECURRING_SCHEDULED">
          {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="label">{CHORE_LABELS.form.schedule}</span>
        <input name="scheduleHuman" maxLength={100} className="input" />
      </label>

      <label className="block">
        <span className="label">{CHORE_LABELS.form.description}</span>
        <textarea name="description" rows={3} maxLength={2000} className="input" />
      </label>

      <label className="block">
        <span className="label">{CHORE_LABELS.form.checklist}</span>
        <textarea name="checklist" rows={3} className="input" />
        <span className="text-sm text-ui-muted">{CHORE_LABELS.form.checklistHint}</span>
      </label>

      {error && (
        <div role="alert" className="alert-error">
          {error}
        </div>
      )}

      <button type="submit" disabled={status === 'saving'} className="btn-secondary">
        {status === 'saving' ? CHORE_LABELS.actions.completing : CHORE_LABELS.actions.create}
      </button>
    </form>
  )
}
