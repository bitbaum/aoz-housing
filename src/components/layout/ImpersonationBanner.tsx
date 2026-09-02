'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { IMPERSONATION_LABELS } from '@/lib/auth/impersonation'

interface ImpersonationBannerProps {
  /** Whose view this is. Named, never a bare code. */
  viewingAsName: string
  /** Their care domain, so the banner says WHY the screen looks like this. */
  roleLabel: string
}

/**
 * The one piece of chrome a borrowed session must never be without.
 *
 * Rendered above everything, in the warning register rather than the brand
 * one: brand red marks the action that matters on a screen, and this is not an
 * action — it is a standing statement that what you are reading is not yours.
 *
 * It says three things because leaving any of them out has a failure mode:
 * WHOSE view (or you misattribute what you see), that it is read-only (or you
 * press a button and read the refusal as a bug), and the way out (or you go
 * looking for a logout and end the session entirely).
 */
export function ImpersonationBanner({ viewingAsName, roleLabel }: ImpersonationBannerProps) {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)

  async function exit() {
    setLeaving(true)
    try {
      await fetch('/api/auth/impersonate', { method: 'DELETE' })
      // Full reload, not router.push: every server component on the page was
      // rendered for the borrowed identity, and a client-side navigation would
      // leave that cache in place — showing a colleague's data under your own
      // name, which is the exact confusion this banner exists to prevent.
      window.location.assign('/')
    } catch {
      setLeaving(false)
    }
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 border-b border-status-warning bg-status-warning/15 px-4 py-2 text-sm sm:px-6"
    >
      <p className="text-ui-text">
        <span className="eyebrow mr-2">{IMPERSONATION_LABELS.bannerPrefix}</span>
        <strong className="font-semibold">{viewingAsName}</strong>
        <span className="text-ui-muted"> · {roleLabel}</span>
        <span className="ml-2 text-ui-muted">{IMPERSONATION_LABELS.readOnly}</span>
      </p>
      <button type="button" onClick={exit} disabled={leaving} className="btn-outline">
        {IMPERSONATION_LABELS.exit}
      </button>
    </div>
  )
}
