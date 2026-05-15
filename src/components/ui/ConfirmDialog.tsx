'use client'

import { useState, useTransition } from 'react'
import { UI_LABELS } from '@/lib/constants'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => Promise<void> | void
  children: React.ReactNode
  variant?: 'primary' | 'danger'
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = UI_LABELS.confirm,
  cancelLabel = UI_LABELS.cancel,
  onConfirm,
  children,
  variant = 'primary',
}: ConfirmDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      await onConfirm()
      setIsOpen(false)
    })
  }

  return (
    <>
      {/* Trigger */}
      <div onClick={() => setIsOpen(true)}>{children}</div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-card-hover max-w-md w-full mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-gray-600">{message}</p>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="btn-outline"
              >
                {cancelLabel}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className={
                  variant === 'danger'
                    ? 'bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50'
                    : 'btn-primary'
                }
              >
                {isPending ? UI_LABELS.processing : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
