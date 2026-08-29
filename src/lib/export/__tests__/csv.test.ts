/**
 * Tests for CSV generation utility.
 * Covers: header generation, transforms, special characters, empty data, null values.
 */

import { generateCSV } from '../csv'
import type { ExportColumn } from '../config'

describe('generateCSV', () => {
  const basicColumns: ExportColumn[] = [
    { key: 'name', header: 'Name' },
    { key: 'status', header: 'Status' },
  ]

  it('generates CSV with correct headers', () => {
    const data = [
      { name: 'Alice', status: 'ACTIVE' },
      { name: 'Bob', status: 'PLACED' },
    ]

    const csv = generateCSV(data, basicColumns)
    const lines = csv.split('\r\n')

    expect(lines[0]).toBe('Name,Status')
    expect(lines[1]).toBe('Alice,ACTIVE')
    expect(lines[2]).toBe('Bob,PLACED')
  })

  it('handles German umlauts and special characters in headers and data', () => {
    const columns: ExportColumn[] = [
      { key: 'name', header: 'Lärmtoleranz' },
      { key: 'description', header: 'Beschreibung' },
    ]

    const data = [{ name: 'Müller', description: 'Strasse 42, Zürich' }]

    const csv = generateCSV(data, columns)
    const lines = csv.split('\r\n')

    expect(lines[0]).toBe('Lärmtoleranz,Beschreibung')
    expect(lines[1]).toBe('Müller,"Strasse 42, Zürich"')
  })

  it('handles empty data array', () => {
    const csv = generateCSV([], basicColumns)
    const lines = csv.split('\r\n')

    expect(lines[0]).toBe('Name,Status')
    // Only header, no data rows
    expect(lines.filter((l) => l.trim()).length).toBe(1)
  })

  it('applies transform functions', () => {
    const columns: ExportColumn[] = [
      { key: 'code', header: 'Code' },
      {
        key: 'languages',
        header: 'Sprachen',
        transform: (v: unknown) => (Array.isArray(v) ? v.join(', ') : String(v || '')),
      },
      {
        key: 'createdAt',
        header: 'Erstellt am',
        transform: (v: unknown) =>
          v instanceof Date ? v.toISOString().split('T')[0] : String(v || ''),
      },
    ]

    const testDate = new Date('2024-06-15T10:30:00Z')
    const data = [
      {
        code: 'RES-001',
        languages: ['de', 'en', 'fr'],
        createdAt: testDate,
      },
    ]

    const csv = generateCSV(data, columns)
    const lines = csv.split('\r\n')

    expect(lines[0]).toBe('Code,Sprachen,Erstellt am')
    expect(lines[1]).toBe('RES-001,"de, en, fr",2024-06-15')
  })

  it('handles null and undefined values gracefully', () => {
    const data = [
      { name: null, status: undefined },
      { name: 'Alice', status: null },
    ]

    const csv = generateCSV(data as unknown as Record<string, unknown>[], basicColumns)
    const lines = csv.split('\r\n')

    expect(lines[1]).toBe(',')
    expect(lines[2]).toBe('Alice,')
  })

  it('passes the full row to transform functions', () => {
    const transformFn = jest.fn(
      (_value: unknown, row: Record<string, unknown>) => `${row.first} ${row.last}`,
    )

    const columns: ExportColumn[] = [
      {
        key: 'first',
        header: 'Full Name',
        transform: transformFn,
      },
    ]

    const data = [{ first: 'Alice', last: 'Smith' }]
    generateCSV(data, columns)

    expect(transformFn).toHaveBeenCalledWith('Alice', data[0])
  })

  it('handles commas and quotes in data values', () => {
    const data = [{ name: 'Smith, John', status: 'Has "special" chars' }]

    const csv = generateCSV(data, basicColumns)
    const lines = csv.split('\r\n')

    // papaparse should properly escape commas and quotes
    expect(lines[1]).toContain('Smith')
    expect(lines[1]).toContain('John')
    expect(csv).toContain('special')
  })

  it('handles date strings in transform functions', () => {
    const columns: ExportColumn[] = [
      {
        key: 'date',
        header: 'Datum',
        transform: (v: unknown) => {
          if (v instanceof Date) return v.toISOString().split('T')[0]
          if (typeof v === 'string' && v) return new Date(v).toISOString().split('T')[0]
          return ''
        },
      },
    ]

    const data = [{ date: '2024-03-15T12:00:00.000Z' }, { date: null }]

    const csv = generateCSV(data as unknown as Record<string, unknown>[], columns)
    const lines = csv.split('\r\n')

    expect(lines[1]).toBe('2024-03-15')
    expect(lines[2]).toBe('')
  })
})
