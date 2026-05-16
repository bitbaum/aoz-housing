import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { ActionMenu } from '../ActionMenu'

// --- Mocks ---

jest.mock('@/lib/config/crud-actions', () => ({
  CRUD_ACTIONS: {
    edit: { label: 'Bearbeiten' },
    duplicate: { label: 'Duplizieren' },
    delete: { label: 'Löschen' },
  },
  ACTION_ICONS: {
    ellipsis: 'M5 12h14',
    pencil: 'M16 3l5 5',
    copy: 'M8 4H4v16',
    trash: 'M3 6h18',
  },
}))

jest.mock('@/lib/constants/labels', () => ({
  UI_LABELS: { actions: 'Aktionen' },
}))

// --- Helpers ---

function openMenu() {
  fireEvent.click(screen.getByRole('button', { name: 'Aktionen' }))
}

// --- Tests ---

describe('ActionMenu', () => {
  afterEach(() => jest.clearAllMocks())

  // ── No actions → renders nothing ────────────────────────────────────────

  it('renders nothing when no action handlers are provided', () => {
    const { container } = render(<ActionMenu />)
    expect(container.firstChild).toBeNull()
  })

  // ── Trigger ──────────────────────────────────────────────────────────────

  it('renders the trigger button when at least one action is provided', () => {
    render(<ActionMenu onEdit={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Aktionen' })).toBeInTheDocument()
  })

  it('does not show the dropdown menu before the trigger is clicked', () => {
    render(<ActionMenu onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('shows the dropdown menu after the trigger is clicked', () => {
    render(<ActionMenu onEdit={jest.fn()} />)
    openMenu()
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('closes the dropdown when the trigger is clicked a second time', () => {
    render(<ActionMenu onEdit={jest.fn()} />)
    openMenu()
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Aktionen' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  // ── Edit item ────────────────────────────────────────────────────────────

  it('shows the edit menu item when onEdit is provided', () => {
    render(<ActionMenu onEdit={jest.fn()} />)
    openMenu()
    expect(screen.getByRole('menuitem', { name: /Bearbeiten/ })).toBeInTheDocument()
  })

  it('does not show edit item when onEdit is not provided', () => {
    render(<ActionMenu onDelete={jest.fn()} />)
    openMenu()
    expect(screen.queryByRole('menuitem', { name: /Bearbeiten/ })).not.toBeInTheDocument()
  })

  it('calls onEdit and closes menu when edit item is clicked', () => {
    const onEdit = jest.fn()
    render(<ActionMenu onEdit={onEdit} />)
    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: /Bearbeiten/ }))
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  // ── Duplicate item ───────────────────────────────────────────────────────

  it('shows the duplicate item when onDuplicate is provided', () => {
    render(<ActionMenu onDuplicate={jest.fn()} />)
    openMenu()
    expect(screen.getByRole('menuitem', { name: /Duplizieren/ })).toBeInTheDocument()
  })

  it('does not show duplicate item when onDuplicate is not provided', () => {
    render(<ActionMenu onEdit={jest.fn()} />)
    openMenu()
    expect(screen.queryByRole('menuitem', { name: /Duplizieren/ })).not.toBeInTheDocument()
  })

  it('calls onDuplicate and closes menu when duplicate item is clicked', () => {
    const onDuplicate = jest.fn()
    render(<ActionMenu onDuplicate={onDuplicate} />)
    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: /Duplizieren/ }))
    expect(onDuplicate).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  // ── Delete item ──────────────────────────────────────────────────────────

  it('shows the delete item when onDelete is provided', () => {
    render(<ActionMenu onDelete={jest.fn()} />)
    openMenu()
    expect(screen.getByRole('menuitem', { name: /Löschen/ })).toBeInTheDocument()
  })

  it('uses custom deleteLabel when provided', () => {
    render(<ActionMenu onDelete={jest.fn()} deleteLabel="Archivieren" />)
    openMenu()
    expect(screen.getByRole('menuitem', { name: /Archivieren/ })).toBeInTheDocument()
  })

  it('calls onDelete and closes menu when delete item is clicked', () => {
    const onDelete = jest.fn()
    render(<ActionMenu onDelete={onDelete} />)
    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: /Löschen/ }))
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  // ── Separator ────────────────────────────────────────────────────────────

  it('renders a separator between edit/duplicate and delete when all three are present', () => {
    const { container } = render(
      <ActionMenu onEdit={jest.fn()} onDuplicate={jest.fn()} onDelete={jest.fn()} />
    )
    openMenu()
    // Separator is a <div> with border-t
    const separator = container.querySelector('.border-t')
    expect(separator).toBeInTheDocument()
  })

  it('does not render a separator when only delete is present', () => {
    const { container } = render(<ActionMenu onDelete={jest.fn()} />)
    openMenu()
    expect(container.querySelector('.border-t')).not.toBeInTheDocument()
  })

  // ── Escape key ───────────────────────────────────────────────────────────

  it('closes the menu when Escape is pressed', () => {
    render(<ActionMenu onEdit={jest.fn()} />)
    openMenu()
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  // ── Outside click ────────────────────────────────────────────────────────

  it('closes the menu when clicking outside the component', () => {
    render(
      <div>
        <ActionMenu onEdit={jest.fn()} />
        <button>Outside</button>
      </div>
    )
    openMenu()
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByText('Outside'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  // ── aria-expanded ────────────────────────────────────────────────────────

  it('sets aria-expanded=false on the trigger when menu is closed', () => {
    render(<ActionMenu onEdit={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Aktionen' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  it('sets aria-expanded=true on the trigger when menu is open', () => {
    render(<ActionMenu onEdit={jest.fn()} />)
    openMenu()
    expect(screen.getByRole('button', { name: 'Aktionen' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })
})
