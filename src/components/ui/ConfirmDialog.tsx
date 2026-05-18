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
          <div className="bg-ui-elevated rounded-lg shadow-card-hover border border-ui-border max-w-md w-full mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-ui-border">
              <h3 className="text-lg font-semibold text-ui-text">{title}</h3>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-ui-muted">{message}</p>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-ui-border flex justify-end gap-3">
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
                    ? 'bg-status-error text-ui-on-accent px-4 py-2.5 rounded-md font-medium hover:bg-status-error/90 disabled:opacity-50 min-h-[44px]'
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
