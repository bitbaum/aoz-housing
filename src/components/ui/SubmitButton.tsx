'use client'

import { useFormStatus } from 'react-dom'
import { UI_LABELS } from '@/lib/constants'
import clsx from 'clsx'

interface SubmitButtonProps {
  children: React.ReactNode
  pendingText?: string
  className?: string
  disabled?: boolean
}

export function SubmitButton({
  children,
  pendingText = UI_LABELS.submitting,
  className,
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus()
  const isDisabled = pending || disabled
  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={clsx('btn-primary disabled:opacity-50 disabled:cursor-not-allowed', className)}
    >
      {pending ? pendingText : children}
    </button>
  )
}
