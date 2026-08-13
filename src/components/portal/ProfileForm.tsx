'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { PROFILE_LIMITS } from '@/lib/config/profile'

const L = PORTAL_LABELS.profile

export function ProfileForm({ displayName, bio }: { displayName: string; bio: string }) {
  const router = useRouter()
  const [name, setName] = useState(displayName)
  const [about, setAbout] = useState(bio)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setStatus('saving')
    setError(null)
    try {
      const response = await fetch('/api/portal/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name, bio: about }),
      })
      const body = await response.json()
      if (!body.success) {
        setStatus('error')
        setError(body.error || PORTAL_LABELS.form.errorGeneric)
        return
      }
      setStatus('saved')
      router.refresh()
    } catch {
      setStatus('error')
      setError(PORTAL_LABELS.form.errorGeneric)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="block max-w-sm">
        <span className="label">{L.displayNameLabel}</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={L.displayNamePlaceholder}
          maxLength={PROFILE_LIMITS.maxDisplayNameLength}
          className="input"
        />
      </label>

      <label className="block mt-4">
        <span className="label">{L.bioLabel}</span>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder={L.bioPlaceholder}
          maxLength={PROFILE_LIMITS.maxBioLength}
          rows={3}
          className="input"
        />
      </label>

      {error && (
        <div role="alert" className="alert-error mt-4">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={status === 'saving'} className="btn-primary">
          {status === 'saving' ? PORTAL_LABELS.form.saving : PORTAL_LABELS.form.submit}
        </button>
        {status === 'saved' && (
          <span className="text-sm text-status-success-text">{PORTAL_LABELS.form.saved}</span>
        )}
      </div>
    </form>
  )
}
