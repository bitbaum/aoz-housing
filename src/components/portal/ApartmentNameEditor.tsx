'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { PROFILE_LIMITS } from '@/lib/config/profile'
import { useT } from '@/lib/i18n/LocaleProvider'
import { buildApartmentLabels } from '@/lib/i18n/portal-surfaces'

/** Inline editor for the resident-chosen apartment name (e.g. "Singapur"). */
export function ApartmentNameEditor({ nickname }: { nickname: string | null }) {
  const router = useRouter()
  const t = useT()
  const L = buildApartmentLabels(t)
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
        setError(body.error || t('error.generic'))
        return
      }
      setEditing(false)
      router.refresh()
    } catch {
      setError(t('error.generic'))
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
          {saving ? t('action.saving') : L.nameSave}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="btn-ghost">
          {t('action.cancel')}
        </button>
      </div>
    </form>
  )
}
