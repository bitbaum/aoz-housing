'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { PROFILE_LIMITS } from '@/lib/config/profile'
import { PROFILE_VISIBILITY_OPTIONS } from '@/lib/privacy/profile-visibility'
import type { ProfileVisibility } from '@prisma/client'

const L = PORTAL_LABELS.profile

export function ProfileForm({
  displayName,
  bio,
  profileVisibility,
}: {
  displayName: string
  bio: string
  profileVisibility: ProfileVisibility
}) {
  const router = useRouter()
  const [name, setName] = useState(displayName)
  const [about, setAbout] = useState(bio)
  const [visibility, setVisibility] = useState<ProfileVisibility>(profileVisibility)
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
        body: JSON.stringify({ displayName: name, bio: about, profileVisibility: visibility }),
      })
      const body = await response.json()
      if (!body.success) {
        setStatus('error')
        setError(body.error || PORTAL_LABELS.form.errorGeneric)
        return
      }
      setStatus('saved')
      router.push('/portal/profile?saved=true')
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

      <fieldset className="mt-6">
        <legend className="label">{L.visibilityLabel}</legend>

        <div className="mt-2 space-y-2">
          {PROFILE_VISIBILITY_OPTIONS.map((option) => (
            <label
              key={option}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                visibility === option
                  ? 'border-brand-primary bg-ui-subtle'
                  : 'border-ui-border hover:border-ui-border-strong'
              }`}
            >
              <input
                type="radio"
                name="profileVisibility"
                value={option}
                checked={visibility === option}
                onChange={() => setVisibility(option)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-ui-text">
                  {L.visibilityOptions[option]}
                </span>
                <span className="block text-sm text-ui-muted">{L.visibilityHints[option]}</span>
              </span>
            </label>
          ))}
        </div>

        {/* Said out loud, on the same screen as the choice. A resident deciding
            what to share is owed the fact that staff can always see it. */}
        <p className="mt-2 text-sm text-ui-muted">{L.visibilityStaffNote}</p>
      </fieldset>

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
