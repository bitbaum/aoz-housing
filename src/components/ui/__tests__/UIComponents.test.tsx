/**
 * Tests for small UI primitive components:
 * Tabs, TabButton, StaticTabs, TabLink, TabPanel,
 * SelectFilter, SearchInput, FilterBar,
 * CollapsibleSection, ToastContainer/showToast, SubmitButton
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent, act } from '@testing-library/react'

// --- Mocks ---

jest.mock('next/link', () => ({
  __esModule: true,
  // Pass every prop through: a mock that cherry-picks attributes silently drops
  // the a11y attributes under test (that is how the aria-current regression
  // would have slipped past).
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

// useFormStatus mock — default: not pending
const mockFormStatus = { pending: false }
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormStatus: () => mockFormStatus,
}))

jest.mock('@/lib/constants', () => ({
  UI_LABELS: { submitting: 'Wird gesendet...' },
}))

// --- Component imports (after mocks) ---
import { Tabs, TabButton, StaticTabs, TabLink, TabLinkGroup, TabPanel } from '../Tabs'
import { SelectFilter, SearchInput, FilterBar } from '../FilterBar'
import { CollapsibleSection } from '../CollapsibleSection'
import { ToastContainer, showToast } from '../Toast'
import { SubmitButton } from '../SubmitButton'

// =============================================================================
// Tabs
// =============================================================================

describe('Tabs', () => {
  const TABS = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'details', label: 'Details', count: 3 },
  ]

  it('renders a tablist', () => {
    render(<Tabs tabs={TABS} activeTab="overview" onChange={jest.fn()} />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('renders each tab as a button with role=tab', () => {
    render(<Tabs tabs={TABS} activeTab="overview" onChange={jest.fn()} />)
    expect(screen.getAllByRole('tab').length).toBe(2)
  })

  it('marks the active tab as aria-selected=true', () => {
    render(<Tabs tabs={TABS} activeTab="details" onChange={jest.fn()} />)
    expect(screen.getByRole('tab', { name: /Details/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('marks inactive tabs as aria-selected=false', () => {
    render(<Tabs tabs={TABS} activeTab="details" onChange={jest.fn()} />)
    expect(screen.getByRole('tab', { name: 'Übersicht' })).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onChange with tab id when clicked', () => {
    const onChange = jest.fn()
    render(<Tabs tabs={TABS} activeTab="overview" onChange={onChange} />)
    fireEvent.click(screen.getByRole('tab', { name: /Details/ }))
    expect(onChange).toHaveBeenCalledWith('details')
  })

  it('shows count badge when count is defined', () => {
    render(<Tabs tabs={TABS} activeTab="overview" onChange={jest.fn()} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('hides count badge when count is undefined', () => {
    render(<Tabs tabs={[{ id: 'a', label: 'A' }]} activeTab="a" onChange={jest.fn()} />)
    // No numeric badge rendered
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument()
  })

  it('sets aria-controls to tabpanel-<id>', () => {
    render(<Tabs tabs={TABS} activeTab="overview" onChange={jest.fn()} />)
    expect(screen.getByRole('tab', { name: 'Übersicht' })).toHaveAttribute('aria-controls', 'tabpanel-overview')
  })
})

// =============================================================================
// TabButton
// =============================================================================

describe('TabButton', () => {
  it('renders with role=tab', () => {
    render(<TabButton>Label</TabButton>)
    expect(screen.getByRole('tab')).toBeInTheDocument()
  })

  it('aria-selected=true when active', () => {
    render(<TabButton active>Label</TabButton>)
    expect(screen.getByRole('tab')).toHaveAttribute('aria-selected', 'true')
  })

  it('aria-selected=false when not active', () => {
    render(<TabButton>Label</TabButton>)
    expect(screen.getByRole('tab')).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onClick when clicked', () => {
    const onClick = jest.fn()
    render(<TabButton onClick={onClick}>Label</TabButton>)
    fireEvent.click(screen.getByRole('tab'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

// =============================================================================
// TabLink
// =============================================================================

describe('TabLink', () => {
  // TabLink navigates to a URL and controls no in-page tabpanel, so it must
  // stay a plain link — role="tab" both lied to assistive tech and triggered
  // axe aria-required-parent (no tablist ancestor).
  it('renders as a link, not a tab', () => {
    render(<TabLink href="/path" label="Profile" />)
    expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('links to the correct href', () => {
    render(<TabLink href="/residents" label="Bewohner" />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/residents')
  })

  it('marks the active link with aria-current=page', () => {
    render(<TabLink href="/path" label="Profile" active />)
    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page')
  })

  it('omits aria-current when not active', () => {
    render(<TabLink href="/path" label="Profile" />)
    expect(screen.getByRole('link')).not.toHaveAttribute('aria-current')
  })

  it('shows count badge when provided', () => {
    render(<TabLink href="/path" label="Items" count={7} />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })
})

// =============================================================================
// TabLinkGroup
// =============================================================================

describe('TabLinkGroup', () => {
  it('renders a navigation landmark with its label', () => {
    render(
      <TabLinkGroup label="Filter">
        <TabLink href="/a" label="A" />
      </TabLinkGroup>
    )
    expect(screen.getByRole('navigation', { name: 'Filter' })).toBeInTheDocument()
  })
})

// =============================================================================
// TabPanel
// =============================================================================

describe('TabPanel', () => {
  it('renders with role=tabpanel', () => {
    render(<TabPanel id="overview">Content</TabPanel>)
    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
  })

  it('has id=tabpanel-<id>', () => {
    render(<TabPanel id="overview">Content</TabPanel>)
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'tabpanel-overview')
  })

  it('has aria-labelledby=tab-<id>', () => {
    render(<TabPanel id="overview">Content</TabPanel>)
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'tab-overview')
  })

  it('renders children', () => {
    render(<TabPanel id="x">Hello World</TabPanel>)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})

// =============================================================================
// SelectFilter
// =============================================================================

describe('SelectFilter', () => {
  const OPTIONS = [
    { value: '', label: 'Alle' },
    { value: 'ACTIVE', label: 'Aktiv' },
    { value: 'ENDED', label: 'Beendet' },
  ]

  it('renders a select with aria-label', () => {
    render(<SelectFilter label="Status" value="" options={OPTIONS} onChange={jest.fn()} />)
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument()
  })

  it('renders all options', () => {
    render(<SelectFilter label="Status" value="" options={OPTIONS} onChange={jest.fn()} />)
    expect(screen.getByRole('option', { name: 'Alle' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Aktiv' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Beendet' })).toBeInTheDocument()
  })

  it('reflects current value', () => {
    render(<SelectFilter label="Status" value="ACTIVE" options={OPTIONS} onChange={jest.fn()} />)
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('ACTIVE')
  })

  it('calls onChange with selected value', () => {
    const onChange = jest.fn()
    render(<SelectFilter label="Status" value="" options={OPTIONS} onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'ENDED' } })
    expect(onChange).toHaveBeenCalledWith('ENDED')
  })
})

// =============================================================================
// SearchInput
// =============================================================================

describe('SearchInput', () => {
  it('renders a text input', () => {
    render(<SearchInput value="" onChange={jest.fn()} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows provided placeholder', () => {
    render(<SearchInput value="" onChange={jest.fn()} placeholder="Suche nach Code..." />)
    expect(screen.getByPlaceholderText('Suche nach Code...')).toBeInTheDocument()
  })

  it('uses default placeholder when none given', () => {
    render(<SearchInput value="" onChange={jest.fn()} />)
    expect(screen.getByPlaceholderText('Suchen...')).toBeInTheDocument()
  })

  it('reflects current value', () => {
    render(<SearchInput value="hello" onChange={jest.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('hello')
  })

  it('calls onChange with input value', () => {
    const onChange = jest.fn()
    render(<SearchInput value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } })
    expect(onChange).toHaveBeenCalledWith('abc')
  })
})

// =============================================================================
// FilterBar
// =============================================================================

describe('FilterBar', () => {
  it('renders children', () => {
    render(<FilterBar><span>Filter A</span><span>Filter B</span></FilterBar>)
    expect(screen.getByText('Filter A')).toBeInTheDocument()
    expect(screen.getByText('Filter B')).toBeInTheDocument()
  })
})

// =============================================================================
// CollapsibleSection
// =============================================================================

describe('CollapsibleSection', () => {
  it('renders the title', () => {
    render(<CollapsibleSection title="Mein Abschnitt"><p>Inhalt</p></CollapsibleSection>)
    expect(screen.getByText('Mein Abschnitt')).toBeInTheDocument()
  })

  it('shows content by default (defaultOpen=true)', () => {
    render(<CollapsibleSection title="Test"><p>Sichtbar</p></CollapsibleSection>)
    expect(screen.getByText('Sichtbar')).toBeInTheDocument()
  })

  it('hides content when defaultOpen=false', () => {
    render(<CollapsibleSection title="Test" defaultOpen={false}><p>Versteckt</p></CollapsibleSection>)
    expect(screen.queryByText('Versteckt')).not.toBeInTheDocument()
  })

  it('toggle button has aria-expanded=true when open', () => {
    render(<CollapsibleSection title="Test"><p>X</p></CollapsibleSection>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
  })

  it('toggle button has aria-expanded=false when closed', () => {
    render(<CollapsibleSection title="Test" defaultOpen={false}><p>X</p></CollapsibleSection>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking toggle closes open section', () => {
    render(<CollapsibleSection title="Test"><p>Inhalt</p></CollapsibleSection>)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('Inhalt')).not.toBeInTheDocument()
  })

  it('clicking toggle opens closed section', () => {
    render(<CollapsibleSection title="Test" defaultOpen={false}><p>Inhalt</p></CollapsibleSection>)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Inhalt')).toBeInTheDocument()
  })

  it('content div id is derived from title', () => {
    const { container } = render(<CollapsibleSection title="Mein Abschnitt"><p>X</p></CollapsibleSection>)
    expect(container.querySelector('#section-mein-abschnitt')).toBeInTheDocument()
  })
})

// =============================================================================
// ToastContainer + showToast
// =============================================================================

describe('ToastContainer', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('renders nothing initially', () => {
    const { container } = render(<ToastContainer />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a success toast after showToast call', () => {
    render(<ToastContainer />)
    act(() => { showToast('success', 'Gespeichert!') })
    expect(screen.getByText('Gespeichert!')).toBeInTheDocument()
  })

  it('shows an error toast', () => {
    render(<ToastContainer />)
    act(() => { showToast('error', 'Fehler!') })
    expect(screen.getByText('Fehler!')).toBeInTheDocument()
  })

  it('shows an info toast', () => {
    render(<ToastContainer />)
    act(() => { showToast('info', 'Hinweis') })
    expect(screen.getByText('Hinweis')).toBeInTheDocument()
  })

  it('auto-removes toast after 4 seconds', () => {
    render(<ToastContainer />)
    act(() => { showToast('success', 'Temporär') })
    expect(screen.getByText('Temporär')).toBeInTheDocument()
    act(() => { jest.advanceTimersByTime(4000) })
    expect(screen.queryByText('Temporär')).not.toBeInTheDocument()
  })

  it('renders multiple toasts', () => {
    render(<ToastContainer />)
    act(() => {
      showToast('success', 'Eins')
      showToast('error', 'Zwei')
    })
    expect(screen.getByText('Eins')).toBeInTheDocument()
    expect(screen.getByText('Zwei')).toBeInTheDocument()
  })

  it('has aria-live=polite region', () => {
    render(<ToastContainer />)
    act(() => { showToast('success', 'Test') })
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })
})

// =============================================================================
// SubmitButton
// =============================================================================

describe('SubmitButton', () => {
  beforeEach(() => {
    mockFormStatus.pending = false
  })

  it('renders children when not pending', () => {
    render(<SubmitButton>Speichern</SubmitButton>)
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeInTheDocument()
  })

  it('renders pendingText when pending', () => {
    mockFormStatus.pending = true
    render(<SubmitButton>Speichern</SubmitButton>)
    expect(screen.getByRole('button', { name: 'Wird gesendet...' })).toBeInTheDocument()
  })

  it('renders custom pendingText when provided', () => {
    mockFormStatus.pending = true
    render(<SubmitButton pendingText="Lädt...">Speichern</SubmitButton>)
    expect(screen.getByRole('button', { name: 'Lädt...' })).toBeInTheDocument()
  })

  it('is disabled when pending', () => {
    mockFormStatus.pending = true
    render(<SubmitButton>Speichern</SubmitButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is disabled when disabled prop set', () => {
    render(<SubmitButton disabled>Speichern</SubmitButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is not disabled when idle', () => {
    render(<SubmitButton>Speichern</SubmitButton>)
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('has type=submit', () => {
    render(<SubmitButton>Speichern</SubmitButton>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('applies className prop', () => {
    const { container } = render(<SubmitButton className="btn-primary">Go</SubmitButton>)
    expect(container.querySelector('.btn-primary')).toBeInTheDocument()
  })
})
