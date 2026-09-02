import React from 'react'
import { render, act } from '@testing-library/react'
import { FormValidationUX } from '../FormValidationUX'

vi.mock('@/lib/constants', async () => ({
  FORM_VALIDATION_UX_LABELS: {
    requiredFields: 'Bitte prüfen Sie die markierten Pflichtfelder.',
    fieldRequired: 'Dieses Feld ist erforderlich',
    readOnly: 'Kann nicht geändert werden',
  },
}))

function setupDOM() {
  const form = document.createElement('form')
  form.id = 'test-form'
  document.body.appendChild(form)

  const input = document.createElement('input')
  input.required = true
  input.name = 'field1'
  form.appendChild(input)

  const summary = document.createElement('div')
  summary.id = 'test-summary'
  summary.classList.add('hidden')
  document.body.appendChild(summary)

  return { form, input, summary }
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('FormValidationUX', () => {
  it('renders null — no DOM output from component', () => {
    setupDOM()
    const { container } = render(<FormValidationUX formId="test-form" summaryId="test-summary" />)
    expect(container.firstChild).toBeNull()
  })

  it('is a no-op when formId element does not exist', () => {
    const { summary } = setupDOM()
    render(<FormValidationUX formId="nonexistent-form" summaryId="test-summary" />)

    act(() => {
      const event = new Event('invalid', { bubbles: false, cancelable: true })
      summary.dispatchEvent(event)
    })

    expect(summary.textContent).toBe('')
    expect(summary.classList.contains('hidden')).toBe(true)
  })

  it('is a no-op when summaryId element does not exist', () => {
    const { form, input } = setupDOM()
    render(<FormValidationUX formId="test-form" summaryId="nonexistent-summary" />)

    act(() => {
      const event = new Event('invalid', { bubbles: false, cancelable: true })
      input.dispatchEvent(event)
    })

    // No error thrown — silently skipped
    expect(form.querySelector('.field-error')).toBeNull()
  })

  describe('invalid event', () => {
    it('sets summary text and removes hidden class', () => {
      const { form, input, summary } = setupDOM()
      render(<FormValidationUX formId="test-form" summaryId="test-summary" />)

      act(() => {
        const event = new Event('invalid', { bubbles: false, cancelable: true })
        input.dispatchEvent(event)
      })

      expect(summary.textContent).toBe('Bitte prüfen Sie die markierten Pflichtfelder.')
      expect(summary.classList.contains('hidden')).toBe(false)
    })

    it('adds red border and ring classes to the invalid field', () => {
      const { input, summary } = setupDOM()
      render(<FormValidationUX formId="test-form" summaryId="test-summary" />)

      act(() => {
        input.dispatchEvent(new Event('invalid', { bubbles: false, cancelable: true }))
      })

      expect(input.classList.contains('border-status-error')).toBe(true)
      expect(input.classList.contains('ring-1')).toBe(true)
      expect(input.classList.contains('ring-status-error')).toBe(true)
    })

    it('appends a .field-error p with role="alert" below the field', () => {
      const { input, summary } = setupDOM()
      render(<FormValidationUX formId="test-form" summaryId="test-summary" />)

      act(() => {
        const event = new Event('invalid', { bubbles: false, cancelable: true })
        input.dispatchEvent(event)
      })

      const parent = input.parentElement!
      const errorEl = parent.querySelector('.field-error')
      expect(errorEl).not.toBeNull()
      expect(errorEl!.getAttribute('role')).toBe('alert')
      expect(errorEl!.textContent).toBe('Dieses Feld ist erforderlich')
    })

    it('does not add duplicate .field-error when invalid fires twice', () => {
      const { input } = setupDOM()
      render(<FormValidationUX formId="test-form" summaryId="test-summary" />)

      act(() => {
        input.dispatchEvent(new Event('invalid', { bubbles: false, cancelable: true }))
        input.dispatchEvent(new Event('invalid', { bubbles: false, cancelable: true }))
      })

      const parent = input.parentElement!
      expect(parent.querySelectorAll('.field-error').length).toBe(1)
    })

    it('prefers .field-group ancestor over parentElement for error placement', () => {
      const { form, summary } = setupDOM()
      const group = document.createElement('div')
      group.className = 'field-group'
      const input2 = document.createElement('input')
      input2.required = true
      group.appendChild(input2)
      form.appendChild(group)

      render(<FormValidationUX formId="test-form" summaryId="test-summary" />)

      act(() => {
        input2.dispatchEvent(new Event('invalid', { bubbles: false, cancelable: true }))
      })

      expect(group.querySelector('.field-error')).not.toBeNull()
      expect(input2.parentElement!.querySelector('.field-error')).not.toBeNull()
    })
  })

  describe('input event', () => {
    it('removes red classes from the corrected field', () => {
      const { form, input, summary } = setupDOM()
      render(<FormValidationUX formId="test-form" summaryId="test-summary" />)

      act(() => {
        input.dispatchEvent(new Event('invalid', { bubbles: false, cancelable: true }))
      })
      expect(input.classList.contains('border-status-error')).toBe(true)

      act(() => {
        input.value = 'some value'
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })

      expect(input.classList.contains('border-status-error')).toBe(false)
      expect(input.classList.contains('ring-1')).toBe(false)
      expect(input.classList.contains('ring-status-error')).toBe(false)
    })

    it('removes .field-error element from corrected field', () => {
      const { input } = setupDOM()
      render(<FormValidationUX formId="test-form" summaryId="test-summary" />)

      act(() => {
        input.dispatchEvent(new Event('invalid', { bubbles: false, cancelable: true }))
      })
      expect(input.parentElement!.querySelector('.field-error')).not.toBeNull()

      act(() => {
        input.value = 'some value'
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })

      expect(input.parentElement!.querySelector('.field-error')).toBeNull()
    })

    it('hides summary when form becomes fully valid', () => {
      const { form, input, summary } = setupDOM()
      render(<FormValidationUX formId="test-form" summaryId="test-summary" />)

      act(() => {
        input.dispatchEvent(new Event('invalid', { bubbles: false, cancelable: true }))
      })
      expect(summary.classList.contains('hidden')).toBe(false)

      // Make form valid
      vi.spyOn(form, 'checkValidity').mockReturnValue(true)

      act(() => {
        input.value = 'filled'
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })

      expect(summary.classList.contains('hidden')).toBe(true)
    })

    it('does not hide summary when form still has invalid fields', () => {
      const { form, input, summary } = setupDOM()
      render(<FormValidationUX formId="test-form" summaryId="test-summary" />)

      act(() => {
        input.dispatchEvent(new Event('invalid', { bubbles: false, cancelable: true }))
      })

      vi.spyOn(form, 'checkValidity').mockReturnValue(false)

      act(() => {
        input.value = 'partial'
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })

      expect(summary.classList.contains('hidden')).toBe(false)
    })
  })

  describe('cleanup on unmount', () => {
    it('removes invalid listener so events have no effect after unmount', () => {
      const { input, summary } = setupDOM()
      const { unmount } = render(<FormValidationUX formId="test-form" summaryId="test-summary" />)

      unmount()

      act(() => {
        input.dispatchEvent(new Event('invalid', { bubbles: false, cancelable: true }))
      })

      expect(summary.textContent).toBe('')
      expect(summary.classList.contains('hidden')).toBe(true)
    })

    it('removes input listener so events have no effect after unmount', () => {
      const { form, input } = setupDOM()
      const spy = vi.spyOn(form, 'checkValidity').mockReturnValue(true)
      const { unmount } = render(<FormValidationUX formId="test-form" summaryId="test-summary" />)

      unmount()

      act(() => {
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })

      expect(spy).not.toHaveBeenCalled()
    })
  })
})
