'use client'

import { useState, useEffect, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastMessage {
  id: number
  type: ToastType
  message: string
}

let toastId = 0
let addToastExternal: ((type: ToastType, message: string) => void) | null = null

/** Show a toast notification from anywhere */
export function showToast(type: ToastType, message: string) {
  if (addToastExternal) {
    addToastExternal(type, message)
  }
}

/** Toast container — mount once in the layout */
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  useEffect(() => {
    addToastExternal = addToast
    return () => { addToastExternal = null }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2" aria-live="polite" role="status">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-slide-up max-w-sm ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : toast.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-white'
          }`}
        >
          <span className="mr-2">
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
          </span>
          {toast.message}
        </div>
      ))}
    </div>
  )
}
