'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Autosaves form state to localStorage as the person types, and offers to
 * restore it on the next visit. A lost connection or an accidental tab
 * close should never mean retyping a whole product from scratch.
 */
export function useDraftAutosave<T>(key: string, value: T, enabled: boolean) {
  const [restored, setRestored] = useState<T | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const hydrated = useRef(false)

  useEffect(() => {
    if (!enabled) return
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) setRestored(JSON.parse(raw) as T)
    } catch {
      // Corrupt or inaccessible storage — ignore, just start fresh.
    }
  }, [key, enabled])

  useEffect(() => {
    if (!enabled) return
    if (!hydrated.current) {
      // Skip the very first write so we don't immediately overwrite a
      // not-yet-shown restore prompt with the form's empty initial state.
      hydrated.current = true
      return
    }
    const handle = window.setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // Storage full or unavailable — draft saving is best-effort.
      }
    }, 500)
    return () => window.clearTimeout(handle)
  }, [key, value, enabled])

  function clearDraft() {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Best-effort.
    }
    setRestored(null)
  }

  function dismissRestore() {
    setDismissed(true)
  }

  return {
    draft: dismissed ? null : restored,
    clearDraft,
    dismissRestore,
  }
}
