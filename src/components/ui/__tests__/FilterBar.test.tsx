import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SelectFilter, SearchInput } from '../FilterBar'

describe('SelectFilter', () => {
  const options = [
    { value: 'all', label: 'Alle' },
    { value: 'active', label: 'Aktiv' },
  ]

  it('exposes an accessible name from its label', () => {
    render(<SelectFilter label="Status" value="all" options={options} onChange={() => {}} />)
    // The (visually hidden) label is associated via htmlFor/id, so the
    // combobox resolves its accessible name from it.
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument()
  })

  it('renders all options and reports changes', () => {
    const onChange = vi.fn()
    render(<SelectFilter label="Status" value="all" options={options} onChange={onChange} />)
    expect(screen.getByRole('option', { name: 'Alle' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Aktiv' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'active' } })
    expect(onChange).toHaveBeenCalledWith('active')
  })
})

describe('SearchInput', () => {
  it('has an accessible name even without a visible label', () => {
    render(<SearchInput value="" onChange={() => {}} placeholder="Bewohner suchen" />)
    expect(screen.getByRole('textbox', { name: 'Bewohner suchen' })).toBeInTheDocument()
  })

  it('reports typed input', () => {
    const onChange = vi.fn()
    render(<SearchInput value="" onChange={onChange} placeholder="Suchen" />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } })
    expect(onChange).toHaveBeenCalledWith('abc')
  })
})
