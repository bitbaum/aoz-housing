import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

// =============================================================================
// Shared mocks
// =============================================================================

const mockRouterReplace = vi.hoisted(() => vi.fn())
const mockShowToast = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
  usePathname: () => '/residents',
  useSearchParams: () => mockSearchParams,
}))

let mockSearchParams = new URLSearchParams()

vi.mock('@/components/ui/Toast', () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}))

// DynamicFormField stub: renders a div showing factor id + disabled flag
vi.mock('../DynamicFormField', () => ({
  DynamicFormField: ({
    factor,
    disabled,
  }: {
    factor: { id: string; type: string; label: string }
    value?: unknown
    disabled?: boolean
  }) => (
    <div
      data-testid={`field-${factor.id}`}
      data-disabled={String(!!disabled)}
      data-type={factor.type}
    >
      {factor.label}
    </div>
  ),
}))

// Config mocks for DynamicFormSection (props-based, no module mock needed)
// Config mocks for HousingFormFields / ResidentFormFields
vi.mock('@/lib/config/housing-factors', () => ({
  HOUSING_FORM_SECTIONS: [
    { id: 'basic', label: 'Grunddaten', order: 1 },
    { id: 'facilities', label: 'Ausstattung', order: 2 },
  ],
  getHousingFactorsBySection: (id: string) => {
    if (id === 'basic')
      return [
        { id: 'code', type: 'text', label: 'Code', formSection: 'basic', formOrder: 1 },
        { id: 'address', type: 'text', label: 'Adresse', formSection: 'basic', formOrder: 2 },
      ]
    if (id === 'facilities')
      return [
        {
          id: 'wheelchair',
          type: 'boolean',
          label: 'Rollstuhlgerecht',
          formSection: 'facilities',
          formOrder: 1,
        },
      ]
    return []
  },
}))

const codeFactor = vi.hoisted(() => ({
  id: 'code',
  type: 'text',
  label: 'Code',
  formSection: 'basic',
  formOrder: 1,
}))

vi.mock('@/lib/config/resident-factors', () => ({
  RESIDENT_FORM_SECTIONS: [{ id: 'basic', label: 'Stammdaten', order: 1 }],
  // The AI field registry and the form's starting values are both derived from
  // RESIDENT_FACTORS, so the mock has to provide it too.
  RESIDENT_FACTORS: { code: codeFactor },
  getFactorsBySection: (id: string) => {
    if (id === 'basic') return [codeFactor]
    return []
  },
  isEssentialFactor: () => true,
}))

vi.mock('@/lib/constants', () => ({
  RESIDENT_FORM_LABELS: {
    medDocTitle: 'Medizinische Dokumentation',
    medDocDesc: 'Berechtigung für besondere Unterbringungsbedürfnisse',
    medDocCheckboxLabel: 'Medizinische Dokumentation vorhanden',
    medDocCheckboxDesc: 'Ärztliche Bestätigung erforderlich',
    medDocTypeLabel: 'Art der Berechtigung',
  },
  AI_FORM_LABELS: {
    fillTitle: 'Aus Gesprächsnotizen ausfüllen',
    fillHint: 'Beschreibe das Gespräch.',
    fillPlaceholder: 'z.B. Frau, 34…',
    fillSubmit: 'Ausfüllen',
    refineTitle: 'Änderung beschreiben',
    refineHint: 'Sag, was anders sein soll.',
    refinePlaceholder: 'z.B. Lärmtoleranz eher 2',
    refineSubmit: 'Übernehmen',
    working: 'Einen Moment…',
    undo: 'Rückgängig',
    changedOne: '1 Feld aktualisiert',
    changedMany: (count: number) => `${count} Felder aktualisiert`,
  },
}))

vi.mock('@/lib/config/placement-spots', () => ({
  MEDICAL_DOC_TYPE_LABELS: {
    PRIVATE_ROOM: 'Einzelzimmer',
    STUDIO: 'Studio',
    BOTH: 'Beides',
  },
}))

// =============================================================================
// Component imports (after mocks)
// =============================================================================

import { DynamicFormSection } from '../DynamicFormSection'
import { HousingFormFields } from '../HousingFormFields'
import { ResidentFormFields } from '../ResidentFormFields'
import { SuccessToast } from '@/components/ui/SuccessToast'
import type { FactorDef, FormSectionConfig } from '@/lib/config/types'

// =============================================================================
// DynamicFormSection
// =============================================================================

describe('DynamicFormSection', () => {
  const section: FormSectionConfig = {
    id: 'preferences',
    label: 'Präferenzen',
    order: 1,
  }

  const textFactor = (id: string): FactorDef => ({
    id,
    label: `Label ${id}`,
    type: 'text',
    formSection: 'preferences',
    formOrder: 1,
  })

  const boolFactor = (id: string): FactorDef => ({
    id,
    label: `Bool ${id}`,
    type: 'boolean',
    default: false,
    formSection: 'preferences',
    formOrder: 2,
  })

  it('renders section heading', () => {
    render(<DynamicFormSection section={section} factors={[textFactor('name')]} />)
    expect(screen.getByText('Präferenzen')).toBeInTheDocument()
  })

  it('renders section description when provided', () => {
    const s = { ...section, description: 'Optionale Angaben' }
    render(<DynamicFormSection section={s} factors={[textFactor('name')]} />)
    expect(screen.getByText('Optionale Angaben')).toBeInTheDocument()
  })

  it('hides description when not provided', () => {
    render(<DynamicFormSection section={section} factors={[textFactor('name')]} />)
    expect(screen.queryByText('Optionale Angaben')).not.toBeInTheDocument()
  })

  it('renders non-boolean factors', () => {
    render(
      <DynamicFormSection
        section={section}
        factors={[textFactor('field1'), textFactor('field2')]}
      />,
    )
    expect(screen.getByTestId('field-field1')).toBeInTheDocument()
    expect(screen.getByTestId('field-field2')).toBeInTheDocument()
  })

  it('renders boolean factors separately', () => {
    render(
      <DynamicFormSection section={section} factors={[textFactor('txt'), boolFactor('bool1')]} />,
    )
    expect(screen.getByTestId('field-txt')).toBeInTheDocument()
    expect(screen.getByTestId('field-bool1')).toBeInTheDocument()
  })

  it('renders only boolean factors when all are boolean', () => {
    render(<DynamicFormSection section={section} factors={[boolFactor('b1'), boolFactor('b2')]} />)
    expect(screen.getByTestId('field-b1')).toBeInTheDocument()
    expect(screen.getByTestId('field-b2')).toBeInTheDocument()
  })

  it('passes disabled=true to field in disabledFields list', () => {
    render(
      <DynamicFormSection
        section={section}
        factors={[textFactor('code')]}
        disabledFields={['code']}
      />,
    )
    expect(screen.getByTestId('field-code')).toHaveAttribute('data-disabled', 'true')
  })

  it('passes disabled=false to fields not in disabledFields', () => {
    render(
      <DynamicFormSection
        section={section}
        factors={[textFactor('name')]}
        disabledFields={['code']}
      />,
    )
    expect(screen.getByTestId('field-name')).toHaveAttribute('data-disabled', 'false')
  })

  it('passes values to each field', () => {
    render(
      <DynamicFormSection
        section={section}
        factors={[textFactor('name')]}
        values={{ name: 'Alice' }}
      />,
    )
    expect(screen.getByTestId('field-name')).toBeInTheDocument()
  })

  it('renders nothing when factors array is empty', () => {
    const { container } = render(<DynamicFormSection section={section} factors={[]} />)
    expect(container.querySelectorAll('[data-testid^="field-"]')).toHaveLength(0)
  })
})

// =============================================================================
// HousingFormFields
// =============================================================================

describe('HousingFormFields', () => {
  it('renders section headings from config', () => {
    render(<HousingFormFields />)
    expect(screen.getByText('Grunddaten')).toBeInTheDocument()
    expect(screen.getByText('Ausstattung')).toBeInTheDocument()
  })

  it('renders fields in each section', () => {
    render(<HousingFormFields />)
    expect(screen.getByTestId('field-code')).toBeInTheDocument()
    expect(screen.getByTestId('field-address')).toBeInTheDocument()
    expect(screen.getByTestId('field-wheelchair')).toBeInTheDocument()
  })

  it('disables code field when isEdit=true', () => {
    render(<HousingFormFields isEdit />)
    expect(screen.getByTestId('field-code')).toHaveAttribute('data-disabled', 'true')
  })

  it('does not disable code field when isEdit=false', () => {
    render(<HousingFormFields />)
    expect(screen.getByTestId('field-code')).toHaveAttribute('data-disabled', 'false')
  })
})

// =============================================================================
// ResidentFormFields — MedicalDocumentationSection
// =============================================================================

describe('ResidentFormFields — MedicalDocumentationSection', () => {
  it('renders med-doc section heading', () => {
    render(<ResidentFormFields />)
    expect(screen.getByText('Medizinische Dokumentation')).toBeInTheDocument()
  })

  it('renders med-doc checkbox', () => {
    render(<ResidentFormFields />)
    expect(
      screen.getByRole('checkbox', { name: /Medizinische Dokumentation vorhanden/ }),
    ).toBeInTheDocument()
  })

  it('checkbox is unchecked when hasMedicalDocumentation not in defaultValues', () => {
    render(<ResidentFormFields />)
    expect(
      screen.getByRole('checkbox', { name: /Medizinische Dokumentation vorhanden/ }),
    ).not.toBeChecked()
  })

  it('hides doc-type fields initially when checkbox unchecked', () => {
    render(<ResidentFormFields />)
    expect(screen.queryByText('Art der Berechtigung')).not.toBeInTheDocument()
  })

  it('shows doc-type fields when checkbox clicked', () => {
    render(<ResidentFormFields />)
    fireEvent.click(screen.getByRole('checkbox', { name: /Medizinische Dokumentation vorhanden/ }))
    expect(screen.getByText('Art der Berechtigung')).toBeInTheDocument()
  })

  it('shows MEDICAL_DOC_TYPE radio options when checkbox checked', () => {
    render(<ResidentFormFields />)
    fireEvent.click(screen.getByRole('checkbox', { name: /Medizinische Dokumentation vorhanden/ }))
    expect(screen.getByLabelText('Einzelzimmer')).toBeInTheDocument()
    expect(screen.getByLabelText('Studio')).toBeInTheDocument()
    expect(screen.getByLabelText('Beides')).toBeInTheDocument()
  })

  it('hides doc-type fields again when checkbox unchecked', () => {
    render(<ResidentFormFields />)
    const checkbox = screen.getByRole('checkbox', { name: /Medizinische Dokumentation vorhanden/ })
    fireEvent.click(checkbox)
    fireEvent.click(checkbox)
    expect(screen.queryByText('Art der Berechtigung')).not.toBeInTheDocument()
  })

  it('checkbox is pre-checked when hasMedicalDocumentation=true in defaultValues', () => {
    render(<ResidentFormFields defaultValues={{ hasMedicalDocumentation: true }} />)
    expect(
      screen.getByRole('checkbox', { name: /Medizinische Dokumentation vorhanden/ }),
    ).toBeChecked()
  })

  it('shows doc-type fields immediately when hasMedicalDocumentation=true', () => {
    render(<ResidentFormFields defaultValues={{ hasMedicalDocumentation: true }} />)
    expect(screen.getByText('Art der Berechtigung')).toBeInTheDocument()
  })
})

// =============================================================================
// SuccessToast
// =============================================================================

describe('SuccessToast', () => {
  beforeEach(() => {
    mockShowToast.mockClear()
    mockRouterReplace.mockClear()
    mockSearchParams = new URLSearchParams()
  })

  it('renders nothing (returns null)', () => {
    const { container } = render(
      <SuccessToast triggers={[{ param: 'placed', message: 'Platziert!' }]} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('does not show toast when trigger param absent from URL', () => {
    mockSearchParams = new URLSearchParams()
    render(<SuccessToast triggers={[{ param: 'placed', message: 'Platziert!' }]} />)
    expect(mockShowToast).not.toHaveBeenCalled()
  })

  it('does not show toast when trigger param is not "true"', () => {
    mockSearchParams = new URLSearchParams('placed=false')
    render(<SuccessToast triggers={[{ param: 'placed', message: 'Platziert!' }]} />)
    expect(mockShowToast).not.toHaveBeenCalled()
  })

  it('shows toast when trigger param equals "true"', () => {
    mockSearchParams = new URLSearchParams('placed=true')
    render(<SuccessToast triggers={[{ param: 'placed', message: 'Platziert!' }]} />)
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Platziert!')
  })

  it('calls router.replace to clean up the URL param', () => {
    mockSearchParams = new URLSearchParams('placed=true')
    render(<SuccessToast triggers={[{ param: 'placed', message: 'Platziert!' }]} />)
    expect(mockRouterReplace).toHaveBeenCalledWith('/residents', { scroll: false })
  })

  it('shows only first matching trigger toast', () => {
    mockSearchParams = new URLSearchParams('placed=true&saved=true')
    render(
      <SuccessToast
        triggers={[
          { param: 'placed', message: 'Platziert!' },
          { param: 'saved', message: 'Gespeichert!' },
        ]}
      />,
    )
    expect(mockShowToast).toHaveBeenCalledTimes(1)
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Platziert!')
  })
})
