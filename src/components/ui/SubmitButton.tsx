'use client'

import { useFormStatus } from 'react-dom'
import { UI_LABELS } from '@/lib/constants'

interface SubmitButtonProps {
  children: React.ReactNode
  pendingText?: string
  className?: string
}

export function SubmitButton({ children, pendingText = UI_LABELS.submitting, className }: SubmitButtonProps) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  )
}
