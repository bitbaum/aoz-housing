import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import {
  TextField as ControlledTextField,
  EnumField as ControlledEnumField,
  ScaleField as ControlledScaleField,
  BooleanField as ControlledBooleanField,
  MultiField as ControlledMultiField,
} from '../DynamicFormFieldInputs'

// These inputs are controlled — the AI assistant and the user write to one
// shared store, which is only possible if state is lifted out of them. These
// tests are about rendering, not editing, so `onChange` is defaulted once here
// rather than added to every call site below.
const noop = () => {}

type ChangeOptional<P extends { onChange: unknown }> = Omit<P, 'onChange'> & {
  onChange?: P['onChange']
}
type PropsOf<F extends (props: never) => unknown> = Parameters<F>[0]

const TextField = (props: ChangeOptional<PropsOf<typeof ControlledTextField>>) => (
  <ControlledTextField onChange={noop} {...props} />
)
const EnumField = (props: ChangeOptional<PropsOf<typeof ControlledEnumField>>) => (
  <ControlledEnumField onChange={noop} {...props} />
)
const ScaleField = (props: ChangeOptional<PropsOf<typeof ControlledScaleField>>) => (
  <ControlledScaleField onChange={noop} {...props} />
)
const BooleanField = (props: ChangeOptional<PropsOf<typeof ControlledBooleanField>>) => (
  <ControlledBooleanField onChange={noop} {...props} />
)
const MultiField = (props: ChangeOptional<PropsOf<typeof ControlledMultiField>>) => (
  <ControlledMultiField onChange={noop} {...props} />
)

// --- Mocks ---

vi.mock('@/lib/constants/labels', async () => ({
  UI_LABELS: { selectPlaceholder: 'Bitte wählen' },
  AI_FORM_LABELS: { aiMarker: 'KI', aiMarkerTitle: 'Von der KI ausgefüllt — bitte prüfen' },
  FORM_VALIDATION_UX_LABELS: {
    readOnly: 'Kann nicht geändert werden',
    requiredFields: 'Bitte prüfen Sie die markierten Pflichtfelder.',
    fieldRequired: 'Dieses Feld ist erforderlich',
  },
}))

// --- Helpers ---

function makeBase(id = 'field', label = 'Mein Feld') {
  return { id, label, formSection: 'basic', formOrder: 1 }
}

// =============================================================================
// TextField
// =============================================================================

describe('TextField', () => {
  const textFactor = { ...makeBase('name', 'Name'), type: 'text' as const }

  it('renders a text input', () => {
    render(<TextField factor={textFactor} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders the label', () => {
    render(<TextField factor={textFactor} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
  })

  it('shows asterisk when required', () => {
    const f = { ...textFactor, required: true }
    render(<TextField factor={f} />)
    expect(screen.getByText(/Name \*/)).toBeInTheDocument()
  })

  it('shows description when provided', () => {
    const f = { ...textFactor, description: 'Hinweis zum Feld' }
    render(<TextField factor={f} />)
    expect(screen.getByText('Hinweis zum Feld')).toBeInTheDocument()
  })

  it('renders textarea for id=notes', () => {
    const f = { ...makeBase('notes', 'Notizen'), type: 'text' as const }
    render(<TextField factor={f} />)
    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA')
  })

  it('renders textarea for id=concerns', () => {
    const f = { ...makeBase('concerns', 'Bedenken'), type: 'text' as const }
    render(<TextField factor={f} />)
    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA')
  })

  it('does not apply the factor default itself', () => {
    // Defaults are resolved once, in DynamicFormField via factorDisplayValue,
    // so that "unanswered" stays distinguishable from "answered with the
    // default". These inputs render exactly what they are handed.
    const f = { ...textFactor, default: 'Standardwert' }
    render(<TextField factor={f} />)
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('shows provided value over default', () => {
    const f = { ...textFactor, default: 'Standard' }
    render(<TextField factor={f} value="Aktuell" />)
    expect(screen.getByRole('textbox')).toHaveValue('Aktuell')
  })

  it('shows read-only message when disabled', () => {
    render(<TextField factor={textFactor} disabled />)
    expect(screen.getByText('Kann nicht geändert werden')).toBeInTheDocument()
  })

  it('disables the input when disabled', () => {
    render(<TextField factor={textFactor} disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('does not show read-only message when not disabled', () => {
    render(<TextField factor={textFactor} />)
    expect(screen.queryByText('Kann nicht geändert werden')).not.toBeInTheDocument()
  })
})

// =============================================================================
// EnumField
// =============================================================================

describe('EnumField', () => {
  const enumFactor = {
    ...makeBase('status', 'Status'),
    type: 'enum' as const,
    options: ['ACTIVE', 'INACTIVE'] as const,
    optionLabels: { ACTIVE: 'Aktiv', INACTIVE: 'Inaktiv' },
    default: 'ACTIVE',
  }

  it('renders a select (combobox)', () => {
    render(<EnumField factor={enumFactor} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders the label', () => {
    render(<EnumField factor={enumFactor} />)
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('renders placeholder option', () => {
    render(<EnumField factor={enumFactor} />)
    expect(screen.getByRole('option', { name: 'Bitte wählen' })).toBeInTheDocument()
  })

  it('renders all options', () => {
    render(<EnumField factor={enumFactor} />)
    expect(screen.getByRole('option', { name: 'Aktiv' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Inaktiv' })).toBeInTheDocument()
  })

  it('shows description when provided', () => {
    const f = { ...enumFactor, description: 'Wählen Sie einen Wert' }
    render(<EnumField factor={f} />)
    expect(screen.getByText('Wählen Sie einen Wert')).toBeInTheDocument()
  })

  it('uses provided value', () => {
    render(<EnumField factor={enumFactor} value="INACTIVE" />)
    expect(screen.getByRole('combobox')).toHaveValue('INACTIVE')
  })

  it('is disabled when disabled prop set', () => {
    render(<EnumField factor={enumFactor} disabled />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('shows asterisk when required', () => {
    const f = { ...enumFactor, required: true }
    render(<EnumField factor={f} />)
    expect(screen.getByText(/Status \*/)).toBeInTheDocument()
  })
})

// =============================================================================
// ScaleField — radio button variant (max <= 5)
// =============================================================================

describe('ScaleField (radio buttons, max ≤ 5)', () => {
  const scaleFactor = {
    ...makeBase('noise', 'Lärmtoleranz'),
    type: 'scale' as const,
    min: 1,
    max: 5,
    default: 3,
    lowLabel: 'Leise',
    highLabel: 'Laut',
  }

  it('renders a fieldset with legend', () => {
    const { container } = render(<ScaleField factor={scaleFactor} />)
    expect(container.querySelector('fieldset')).toBeInTheDocument()
    expect(screen.getByText('Lärmtoleranz')).toBeInTheDocument()
  })

  it('renders one radio per step', () => {
    render(<ScaleField factor={scaleFactor} />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(5)
  })

  it('has low and high labels', () => {
    render(<ScaleField factor={scaleFactor} />)
    expect(screen.getByText('Leise')).toBeInTheDocument()
    expect(screen.getByText('Laut')).toBeInTheDocument()
  })

  it('checks nothing without a value — defaults belong to DynamicFormField', () => {
    render(<ScaleField factor={scaleFactor} />)
    expect(screen.getByRole('radio', { name: '3' })).not.toBeChecked()
  })

  it('pre-checks provided value', () => {
    render(<ScaleField factor={scaleFactor} value={5} />)
    const radio5 = screen.getByRole('radio', { name: /5/ })
    expect(radio5).toBeChecked()
  })

  it('uses low/high aria-labels on boundary radios', () => {
    render(<ScaleField factor={scaleFactor} />)
    expect(screen.getByRole('radio', { name: '1 – Leise' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '5 – Laut' })).toBeInTheDocument()
  })

  it('disables all radios when disabled', () => {
    render(<ScaleField factor={scaleFactor} disabled />)
    screen.getAllByRole('radio').forEach((r) => expect(r).toBeDisabled())
  })
})

// =============================================================================
// ScaleField — number input variant (max > 5)
// =============================================================================

describe('ScaleField (number input, max > 5)', () => {
  const largeFactor = {
    ...makeBase('capacity', 'Kapazität'),
    type: 'scale' as const,
    min: 1,
    max: 20,
    default: 10,
    lowLabel: '',
    highLabel: '',
  }

  it('renders a number input when max > 5', () => {
    render(<ScaleField factor={largeFactor} />)
    expect(screen.getByRole('spinbutton')).toBeInTheDocument()
  })

  it('stays empty without a value — defaults belong to DynamicFormField', () => {
    render(<ScaleField factor={largeFactor} />)
    expect(screen.getByRole('spinbutton')).toHaveValue(null)
  })

  it('shows provided value', () => {
    render(<ScaleField factor={largeFactor} value={15} />)
    expect(screen.getByRole('spinbutton')).toHaveValue(15)
  })
})

// =============================================================================
// BooleanField
// =============================================================================

describe('BooleanField', () => {
  const boolFactor = {
    ...makeBase('wheelchair', 'Rollstuhlgerecht'),
    type: 'boolean' as const,
    default: false,
  }

  it('renders a checkbox', () => {
    render(<BooleanField factor={boolFactor} />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('renders the label text', () => {
    render(<BooleanField factor={boolFactor} />)
    expect(screen.getByText('Rollstuhlgerecht')).toBeInTheDocument()
  })

  it('is unchecked when default is false', () => {
    render(<BooleanField factor={boolFactor} />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('is unchecked without a value even when the default is true', () => {
    // The important half of the contract: an unanswered tri-state must not
    // render as a "Ja" that nobody actually gave.
    const f = { ...boolFactor, default: true }
    render(<BooleanField factor={f} />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('is checked when value prop is true', () => {
    render(<BooleanField factor={boolFactor} value />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('shows description when provided', () => {
    const f = { ...boolFactor, description: 'Nur für EG-Zimmer' }
    render(<BooleanField factor={f} />)
    expect(screen.getByText(/Nur für EG-Zimmer/)).toBeInTheDocument()
  })

  it('is disabled when disabled prop set', () => {
    render(<BooleanField factor={boolFactor} disabled />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })
})

// =============================================================================
// MultiField
// =============================================================================

describe('MultiField', () => {
  const multiFactor = {
    ...makeBase('languages', 'Sprachen'),
    type: 'multi' as const,
    options: ['de', 'en', 'ar'] as const,
    optionLabels: { de: 'Deutsch', en: 'Englisch', ar: 'Arabisch' },
    default: ['de'],
  }

  it('renders a fieldset with legend', () => {
    const { container } = render(<MultiField factor={multiFactor} />)
    expect(container.querySelector('fieldset')).toBeInTheDocument()
    expect(screen.getByText('Sprachen')).toBeInTheDocument()
  })

  it('renders one checkbox per option', () => {
    render(<MultiField factor={multiFactor} />)
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)
  })

  it('renders option labels', () => {
    render(<MultiField factor={multiFactor} />)
    expect(screen.getByText('Deutsch')).toBeInTheDocument()
    expect(screen.getByText('Englisch')).toBeInTheDocument()
    expect(screen.getByText('Arabisch')).toBeInTheDocument()
  })

  it('checks nothing without a value — defaults belong to DynamicFormField', () => {
    render(<MultiField factor={multiFactor} />)
    expect(screen.getByRole('checkbox', { name: 'Deutsch' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Englisch' })).not.toBeChecked()
  })

  it('pre-checks provided value array', () => {
    render(<MultiField factor={multiFactor} value={['en', 'ar']} />)
    expect(screen.getByRole('checkbox', { name: 'Englisch' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Arabisch' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Deutsch' })).not.toBeChecked()
  })

  it('disables all checkboxes when disabled', () => {
    render(<MultiField factor={multiFactor} disabled />)
    screen.getAllByRole('checkbox').forEach((cb) => expect(cb).toBeDisabled())
  })

  it('shows description when provided', () => {
    const f = { ...multiFactor, description: 'Mehrfachauswahl möglich' }
    render(<MultiField factor={f} />)
    expect(screen.getByText('Mehrfachauswahl möglich')).toBeInTheDocument()
  })
})
