'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { PROFILE_LIMITS } from '@/lib/config/profile'

const L = PORTAL_LABELS.apartment

/** Inline editor for the resident-chosen apartment name (e.g. "Singapur"). */
export function ApartmentNameEditor({ nickname }: { nickname: string | null }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(nickname ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const response = await fetch('/api/portal/apartment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: value }),
      })
      const body = await response.json()
      if (!body.success) {
        setError(body.error || PORTAL_LABELS.form.errorGeneric)
        return
      }
      setEditing(false)
      router.refresh()
    } catch {
      setError(PORTAL_LABELS.form.errorGeneric)
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-2xl font-bold tracking-tight text-ui-text">
          {nickname || <span className="text-ui-muted font-normal">{L.unnamed}</span>}
        </p>
        <button
          type="button"
          onClick={() => {
            setValue(nickname ?? '')
            setEditing(true)
          }}
          className="btn-icon text-ui-muted"
          aria-label={L.nameEdit}
        >
          <Pencil className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSave}>
      <label className="block max-w-sm">
        <span className="label">{L.nameLabel}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={L.namePlaceholder}
          maxLength={PROFILE_LIMITS.maxNicknameLength}
          className="input"
          autoFocus
        />
      </label>
      <p className="text-xs text-ui-muted mt-1">{L.nameHint}</p>
      {error && (
        <div role="alert" className="alert-error mt-2">
          {error}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? PORTAL_LABELS.form.saving : L.nameSave}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="btn-ghost">
          {PORTAL_LABELS.form.cancel}
        </button>
      </div>
    </form>
  )
}
