import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { DynamicFormField } from '../DynamicFormField'
import type {
  EnumFactorDef,
  ScaleFactorDef,
  BooleanFactorDef,
  MultiFactorDef,
  TextFactorDef,
} from '@/lib/config/types'

// =============================================================================
// TEST FIXTURES
// =============================================================================

const baseFields = {
  formSection: 'test',
  formOrder: 1,
}

const textFactor: TextFactorDef = {
  ...baseFields,
  id: 'testText',
  type: 'text',
  label: 'Test Text Field',
  placeholder: 'Enter text here',
  required: true,
}

const notesFactor: TextFactorDef = {
  ...baseFields,
  id: 'notes',
  type: 'text',
  label: 'Notizen',
  placeholder: 'Write notes...',
  description: 'Additional notes',
}

const enumFactor: EnumFactorDef = {
  ...baseFields,
  id: 'testEnum',
  type: 'enum',
  label: 'Schlafrhythmus',
  description: 'When does the person sleep?',
  required: true,
  options: ['EARLY_BIRD', 'STANDARD', 'NIGHT_OWL'] as const,
  optionLabels: {
    EARLY_BIRD: 'Fruehaufsteher',
    STANDARD: 'Normal',
    NIGHT_OWL: 'Nachteule',
  },
}

const scaleFactor: ScaleFactorDef = {
  ...baseFields,
  id: 'testScale',
  type: 'scale',
  label: 'Laermtoleranz',
  description: 'How sensitive to noise?',
  min: 1,
  max: 5,
  default: 3,
  lowLabel: 'Sehr empfindlich',
  highLabel: 'Sehr tolerant',
}

const largeScaleFactor: ScaleFactorDef = {
  ...baseFields,
  id: 'testLargeScale',
  type: 'scale',
  label: 'Age',
  min: 0,
  max: 100,
  default: 25,
  lowLabel: 'Young',
  highLabel: 'Old',
}

const booleanFactor: BooleanFactorDef = {
  ...baseFields,
  id: 'testBoolean',
  type: 'boolean',
  label: 'Medizinische Geraete',
  description: 'Needs medical equipment space',
  default: false,
}

const multiFactor: MultiFactorDef = {
  ...baseFields,
  id: 'testMulti',
  type: 'multi',
  label: 'Sprachen',
  description: 'Which languages are spoken?',
  required: true,
  options: ['DE', 'EN', 'FR'] as const,
  optionLabels: {
    DE: 'Deutsch',
    EN: 'Englisch',
    FR: 'Franzoesisch',
  },
}

// =============================================================================
// TEXT FIELD TESTS
// =============================================================================

describe('DynamicFormField', () => {
  describe('text type', () => {
    it('renders a text input with label and placeholder', () => {
      render(<DynamicFormField factor={textFactor} />)

      expect(screen.getByText(/Test Text Field/)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument()
    })

    it('shows required marker when factor is required', () => {
      render(<DynamicFormField factor={textFactor} />)

      expect(screen.getByText(/\*/)).toBeInTheDocument()
    })

    it('renders with a default value', () => {
      render(<DynamicFormField factor={textFactor} value="hello" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('hello')
    })

    it('shows disabled message when disabled', () => {
      render(<DynamicFormField factor={textFactor} disabled />)

      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
      expect(screen.getByText('Kann nicht geändert werden')).toBeInTheDocument()
    })

    it('renders a textarea for notes factor', () => {
      render(<DynamicFormField factor={notesFactor} />)

      const textarea = screen.getByRole('textbox')
      expect(textarea.tagName).toBe('TEXTAREA')
      expect(textarea).toHaveAttribute('rows', '4')
    })

    it('shows description when provided', () => {
      render(<DynamicFormField factor={notesFactor} />)

      expect(screen.getByText('Additional notes')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ENUM FIELD TESTS
  // ===========================================================================

  describe('enum type', () => {
    it('renders a select with placeholder option', () => {
      render(<DynamicFormField factor={enumFactor} />)

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
      expect(screen.getByText('Bitte wählen')).toBeInTheDocument()
    })

    it('renders all options with correct labels', () => {
      render(<DynamicFormField factor={enumFactor} />)

      expect(screen.getByText('Fruehaufsteher')).toBeInTheDocument()
      expect(screen.getByText('Normal')).toBeInTheDocument()
      expect(screen.getByText('Nachteule')).toBeInTheDocument()
    })

    it('shows label and required marker', () => {
      render(<DynamicFormField factor={enumFactor} />)

      expect(screen.getByText(/Schlafrhythmus/)).toBeInTheDocument()
      expect(screen.getByText(/\*/)).toBeInTheDocument()
    })

    it('shows description when provided', () => {
      render(<DynamicFormField factor={enumFactor} />)

      expect(screen.getByText('When does the person sleep?')).toBeInTheDocument()
    })

    it('renders with pre-selected value', () => {
      render(<DynamicFormField factor={enumFactor} value="NIGHT_OWL" />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveValue('NIGHT_OWL')
    })

    it('is disabled when disabled prop is passed', () => {
      render(<DynamicFormField factor={enumFactor} disabled />)

      const select = screen.getByRole('combobox')
      expect(select).toBeDisabled()
    })
  })

  // ===========================================================================
  // SCALE FIELD TESTS (visual 1-5 radios)
  // ===========================================================================

  describe('scale type (1-5 range)', () => {
    it('renders radio buttons for each level', () => {
      render(<DynamicFormField factor={scaleFactor} />)

      const radios = screen.getAllByRole('radio')
      expect(radios).toHaveLength(5)
    })

    it('shows label and description', () => {
      render(<DynamicFormField factor={scaleFactor} />)

      expect(screen.getByText(/Laermtoleranz/)).toBeInTheDocument()
      expect(screen.getByText('How sensitive to noise?')).toBeInTheDocument()
    })

    it('shows low and high labels', () => {
      render(<DynamicFormField factor={scaleFactor} />)

      expect(screen.getByText('Sehr empfindlich')).toBeInTheDocument()
      expect(screen.getByText('Sehr tolerant')).toBeInTheDocument()
    })

    it('checks default value radio', () => {
      render(<DynamicFormField factor={scaleFactor} />)

      const radios = screen.getAllByRole('radio')
      // Default is 3 (index 2 in 1-5 range)
      expect(radios[2]).toBeChecked()
    })

    it('checks provided value instead of default', () => {
      render(<DynamicFormField factor={scaleFactor} value={5} />)

      const radios = screen.getAllByRole('radio')
      expect(radios[4]).toBeChecked()
    })

    it('disables all radios when disabled', () => {
      render(<DynamicFormField factor={scaleFactor} disabled />)

      const radios = screen.getAllByRole('radio')
      radios.forEach((radio) => {
        expect(radio).toBeDisabled()
      })
    })
  })

  // ===========================================================================
  // SCALE FIELD TESTS (large range — number input)
  // ===========================================================================

  describe('scale type (large range)', () => {
    it('renders a number input for ranges > 5', () => {
      render(<DynamicFormField factor={largeScaleFactor} />)

      const input = screen.getByRole('spinbutton')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '100')
    })

    it('sets default value on number input', () => {
      render(<DynamicFormField factor={largeScaleFactor} />)

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveValue(25)
    })
  })

  // ===========================================================================
  // BOOLEAN FIELD TESTS
  // ===========================================================================

  describe('boolean type', () => {
    it('renders a checkbox with label', () => {
      render(<DynamicFormField factor={booleanFactor} />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()
      expect(screen.getByText('Medizinische Geraete')).toBeInTheDocument()
    })

    it('is unchecked by default when default is false', () => {
      render(<DynamicFormField factor={booleanFactor} />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()
    })

    it('is checked when value is true', () => {
      render(<DynamicFormField factor={booleanFactor} value={true} />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('shows description in parentheses', () => {
      render(<DynamicFormField factor={booleanFactor} />)

      expect(screen.getByText('(Needs medical equipment space)')).toBeInTheDocument()
    })

    it('is disabled when disabled prop is passed', () => {
      render(<DynamicFormField factor={booleanFactor} disabled />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeDisabled()
    })
  })

  // ===========================================================================
  // MULTI FIELD TESTS
  // ===========================================================================

  describe('multi type', () => {
    it('renders a checkbox for each option', () => {
      render(<DynamicFormField factor={multiFactor} />)

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes).toHaveLength(3)
    })

    it('shows option labels', () => {
      render(<DynamicFormField factor={multiFactor} />)

      expect(screen.getByText('Deutsch')).toBeInTheDocument()
      expect(screen.getByText('Englisch')).toBeInTheDocument()
      expect(screen.getByText('Franzoesisch')).toBeInTheDocument()
    })

    it('shows label, description, and required marker', () => {
      render(<DynamicFormField factor={multiFactor} />)

      expect(screen.getByText(/Sprachen/)).toBeInTheDocument()
      expect(screen.getByText('Which languages are spoken?')).toBeInTheDocument()
      expect(screen.getByText(/\*/)).toBeInTheDocument()
    })

    it('pre-selects values from value prop', () => {
      render(<DynamicFormField factor={multiFactor} value={['DE', 'FR']} />)

      const checkboxes = screen.getAllByRole('checkbox')
      // DE is first, EN is second, FR is third
      expect(checkboxes[0]).toBeChecked()
      expect(checkboxes[1]).not.toBeChecked()
      expect(checkboxes[2]).toBeChecked()
    })

    it('disables all checkboxes when disabled', () => {
      render(<DynamicFormField factor={multiFactor} disabled />)

      const checkboxes = screen.getAllByRole('checkbox')
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeDisabled()
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('edge cases', () => {
    it('returns null for unknown factor type', () => {
      const unknownFactor = {
        ...baseFields,
        id: 'unknown',
        type: 'unknown' as never,
        label: 'Unknown',
      }

      const { container } = render(<DynamicFormField factor={unknownFactor} />)
      expect(container.innerHTML).toBe('')
    })

    it('does not show required marker when not required', () => {
      const optionalFactor: TextFactorDef = {
        ...baseFields,
        id: 'optional',
        type: 'text',
        label: 'Optional Field',
      }

      render(<DynamicFormField factor={optionalFactor} />)
      expect(screen.queryByText(/\*/)).not.toBeInTheDocument()
    })

    it('does not show description when not provided', () => {
      const noDescFactor: EnumFactorDef = {
        ...baseFields,
        id: 'noDesc',
        type: 'enum',
        label: 'No Description',
        options: ['A'] as const,
        optionLabels: { A: 'Option A' },
      }

      const { container } = render(<DynamicFormField factor={noDescFactor} />)
      const descriptions = container.querySelectorAll('.text-gray-500')
      expect(descriptions.length).toBe(0)
    })
  })
})
