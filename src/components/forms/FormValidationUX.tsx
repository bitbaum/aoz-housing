'use client'

import { useEffect } from 'react'
import { FORM_VALIDATION_UX_LABELS } from '@/lib/constants'

interface Props {
  formId: string
  summaryId: string
}

/**
 * Enhanced form validation UX
 * - Shows summary message when required fields empty
 * - Auto-scrolls to first invalid field
 * - Adds inline error styling to invalid fields
 * - Hides errors when corrected
 */
export function FormValidationUX({ formId, summaryId }: Props) {
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null
    const summary = document.getElementById(summaryId) as HTMLDivElement | null
    if (!form || !summary) return

    const showSummary = () => {
      summary.textContent = FORM_VALIDATION_UX_LABELS.requiredFields
      summary.classList.remove('hidden')
    }

    const onInvalid = (event: Event) => {
      const target = event.target as HTMLElement | null
      showSummary()

      // Add inline error styling
      if (target) {
        target.classList.add('border-red-500', 'ring-1', 'ring-red-500')

        // Add error message below the field if not already present
        const fieldContainer = target.closest('.field-group') || target.parentElement
        if (fieldContainer && !fieldContainer.querySelector('.field-error')) {
          const errorMsg = document.createElement('p')
          errorMsg.className = 'field-error text-status-error-text text-xs mt-1'
          errorMsg.textContent = FORM_VALIDATION_UX_LABELS.fieldRequired
          errorMsg.setAttribute('role', 'alert')
          fieldContainer.appendChild(errorMsg)
        }

        if ('scrollIntoView' in target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }

    const onInput = (event: Event) => {
      const target = event.target as HTMLElement | null

      // Remove inline error from the changed field
      if (target) {
        target.classList.remove('border-red-500', 'ring-1', 'ring-red-500')
        const fieldContainer = target.closest('.field-group') || target.parentElement
        const errorMsg = fieldContainer?.querySelector('.field-error')
        if (errorMsg) errorMsg.remove()
      }

      if (form.checkValidity()) {
        summary.classList.add('hidden')
      }
    }

    form.addEventListener('invalid', onInvalid, true)
    form.addEventListener('input', onInput)

    return () => {
      form.removeEventListener('invalid', onInvalid, true)
      form.removeEventListener('input', onInput)
    }
  }, [formId, summaryId])

  return null
}
