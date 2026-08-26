'use client'

import { useEffect, useRef, useState } from 'react'

function readDraft<T>(key: string, enabled: boolean): T | null {
  if (!enabled || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    // Corrupt or inaccessible storage — ignore, just start fresh.
    return null
  }
}

/**
 * Autosaves form state to localStorage as the person types, and offers to
 * restore it on the next visit. A lost connection or an accidental tab
 * close should never mean retyping a whole product from scratch.
 *
 * `key` and `enabled` are read once at mount (they derive from a stable id
 * such as a product id, not from user input) via a lazy initializer —
 * reading storage in an effect-plus-setState would trigger an avoidable
 * extra render on every mount.
 */
export function useDraftAutosave<T>(key: string, value: T, enabled: boolean) {
  const [restored] = useState<T | null>(() => readDraft<T>(key, enabled))
  const [dismissed, setDismissed] = useState(false)
  const hydrated = useRef(false)

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
    setDismissed(true)
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
