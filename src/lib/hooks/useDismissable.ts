'use client'

import { useEffect, useRef, type RefObject } from 'react'

/**
 * Wires up the "open dropdown / drawer / popover" cleanup contract once:
 *  • Escape key closes
 *  • mousedown outside the container closes
 *  • body scroll lock (optional, for full-screen overlays)
 *  • returns the container ref so the caller wires it onto the surface
 *
 * Eliminates the bespoke useEffect blocks duplicated across UserMenu,
 * MobileNav, PortalNav, ChoreActions, BedGrid popovers, etc.
 */
export function useDismissable<T extends HTMLElement>(
  isOpen: boolean,
  onDismiss: () => void,
  options: { lockBody?: boolean } = {},
): RefObject<T> {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!isOpen) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onDismiss()
    }

    function onMouseDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onDismiss()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onMouseDown)
    const prevOverflow = options.lockBody ? document.body.style.overflow : null
    if (options.lockBody) document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onMouseDown)
      if (options.lockBody) document.body.style.overflow = prevOverflow ?? ''
    }
  }, [isOpen, onDismiss, options.lockBody])

  return ref
}
