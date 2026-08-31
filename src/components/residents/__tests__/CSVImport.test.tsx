import type { Mock } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { CSVImport } from '../CSVImport'

// --- Mocks ---

vi.mock('@/lib/constants/labels/export', () => ({
  EXPORT_LABELS: {
    selectFile: 'CSV-Datei wählen',
    downloadTemplate: 'Vorlage herunterladen',
    importing: 'Importiere...',
    importButton: 'Importieren',
    preview: 'Vorschau',
    result: 'Ergebnis',
    created: 'erstellt',
    skipped: 'übersprungen',
    errors: 'Fehler',
    row: 'Zeile',
  },
}))

vi.mock('@/lib/config/thresholds', async () => ({
  ...(await vi.importActual<Record<string, unknown>>('@/lib/config/thresholds')),
  DISPLAY_LIMITS: { importErrorPreview: 10 },
}))

// Capture the Papa.parse callback so tests can trigger it synchronously.
let capturedParseCall: {
  file: File
  config: { complete: (r: { data: unknown[] }) => void; error: () => void }
} | null = null

vi.mock('papaparse', () => ({
  __esModule: true,
  default: {
    parse: (
      file: File,
      config: { complete: (r: { data: unknown[] }) => void; error: () => void },
    ) => {
      capturedParseCall = { file, config }
    },
  },
}))

// --- Helpers ---

function makeFile(name = 'residents.csv', content = 'name,age\nAlice,30') {
  return new File([content], name, { type: 'text/csv' })
}

function renderImport() {
  return render(<CSVImport />)
}

function fireFileChange(input: HTMLElement, file: File) {
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  fireEvent.change(input)
}

function triggerParseComplete(rows: Record<string, string>[]) {
  capturedParseCall?.config.complete({ data: rows })
}

function triggerParseError() {
  capturedParseCall?.config.error()
}

const PREVIEW_ROWS = [
  { name: 'Alice', age: '30' },
  { name: 'Bob', age: '25' },
]

// --- Tests ---

describe('CSVImport', () => {
  beforeEach(() => {
    capturedParseCall = null
    global.fetch = vi.fn()
  })
  afterEach(() => vi.restoreAllMocks())

  // ── Initial render ───────────────────────────────────────────────────────

  it('renders the select-file button and template link', () => {
    renderImport()
    expect(screen.getByRole('button', { name: 'CSV-Datei wählen' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Vorlage herunterladen' })).toBeInTheDocument()
  })

  it('does not show preview or result on initial render', () => {
    renderImport()
    expect(screen.queryByText(/Vorschau/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Ergebnis/)).not.toBeInTheDocument()
  })

  // ── File selection + Papa.parse ──────────────────────────────────────────

  it('calls Papa.parse when a file is selected', () => {
    const { container } = renderImport()
    const input = container.querySelector('input[type="file"]') as HTMLElement
    fireFileChange(input, makeFile())
    expect(capturedParseCall).not.toBeNull()
    expect(capturedParseCall?.file.name).toBe('residents.csv')
  })

  it('shows preview table with correct headers after parse completes', () => {
    const { container } = renderImport()
    const input = container.querySelector('input[type="file"]') as HTMLElement
    fireFileChange(input, makeFile())
    act(() => {
      triggerParseComplete(PREVIEW_ROWS)
    })

    expect(screen.getByText(/Vorschau/)).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'name' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'age' })).toBeInTheDocument()
  })

  it('shows preview row data in the table', () => {
    const { container } = renderImport()
    const input = container.querySelector('input[type="file"]') as HTMLElement
    fireFileChange(input, makeFile())
    act(() => {
      triggerParseComplete(PREVIEW_ROWS)
    })

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows the import button once preview is available', () => {
    const { container } = renderImport()
    const input = container.querySelector('input[type="file"]') as HTMLElement
    fireFileChange(input, makeFile())
    act(() => {
      triggerParseComplete(PREVIEW_ROWS)
    })

    expect(screen.getByRole('button', { name: 'Importieren' })).toBeInTheDocument()
  })

  it('shows error message when Papa.parse errors', () => {
    const { container } = renderImport()
    const input = container.querySelector('input[type="file"]') as HTMLElement
    fireFileChange(input, makeFile())
    act(() => {
      triggerParseError()
    })

    expect(screen.getByText('CSV konnte nicht gelesen werden')).toBeInTheDocument()
  })

  it('clears a previous error when a new valid file is selected', () => {
    const { container } = renderImport()
    const input = container.querySelector('input[type="file"]') as HTMLElement

    // First file: parse error
    fireFileChange(input, makeFile('bad.csv'))
    act(() => {
      triggerParseError()
    })
    expect(screen.getByText('CSV konnte nicht gelesen werden')).toBeInTheDocument()

    // Second file: successful parse
    capturedParseCall = null
    fireFileChange(input, makeFile('good.csv'))
    act(() => {
      triggerParseComplete(PREVIEW_ROWS)
    })

    expect(screen.queryByText('CSV konnte nicht gelesen werden')).not.toBeInTheDocument()
  })

  // ── Submit + loading state ───────────────────────────────────────────────

  it('sends a POST request to /api/import/residents when import button is clicked', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true, created: 2, skipped: 0, errors: [] }),
    })

    const { container } = renderImport()
    const input = container.querySelector('input[type="file"]') as HTMLElement
    fireFileChange(input, makeFile())
    act(() => {
      triggerParseComplete(PREVIEW_ROWS)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Importieren' }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    const [url, opts] = (global.fetch as Mock).mock.calls[0]
    expect(url).toBe('/api/import/residents')
    expect(opts.method).toBe('POST')
    expect(opts.body).toBeInstanceOf(FormData)
  })

  it('appends the selected file under the key "file" in the FormData', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true, created: 1, skipped: 0, errors: [] }),
    })

    const { container } = renderImport()
    const input = container.querySelector('input[type="file"]') as HTMLElement
    const csvFile = makeFile('upload.csv')
    fireFileChange(input, csvFile)
    act(() => {
      triggerParseComplete(PREVIEW_ROWS)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Importieren' }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const formData: FormData = (global.fetch as Mock).mock.calls[0][1].body
    expect(formData.get('file')).toBe(csvFile)
  })

  it('shows the importing label while the request is in flight', async () => {
    let resolve!: (v: { json: () => Promise<object> }) => void
    global.fetch = vi.fn().mockReturnValue(
      new Promise((r) => {
        resolve = r as typeof resolve
      }),
    )

    const { container } = renderImport()
    const input = container.querySelector('input[type="file"]') as HTMLElement
    fireFileChange(input, makeFile())
    act(() => {
      triggerParseComplete(PREVIEW_ROWS)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Importieren' }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Importiere...' })).toBeInTheDocument(),
    )
    expect(screen.getByRole('button', { name: 'Importiere...' })).toBeDisabled()

    await act(async () => {
      resolve({ json: async () => ({ success: true, created: 0, skipped: 0, errors: [] }) })
    })
  })

  // ── Success result display ───────────────────────────────────────────────

  it('shows created and skipped counts on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true, created: 5, skipped: 2, errors: [] }),
    })

    const { container } = renderImport()
    const input = container.querySelector('input[type="file"]') as HTMLElement
    fireFileChange(input, makeFile())
    act(() => {
      triggerParseComplete(PREVIEW_ROWS)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Importieren' }))

    await waitFor(() => screen.getByText(/Ergebnis/))
    expect(screen.getByText(/5 erstellt/)).toBeInTheDocument()
    expect(screen.getByText(/2 übersprungen/)).toBeInTheDocument()
  })

  it('hides preview table after successful import', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true, created: 1, skipped: 0, errors: [] }),
    })

    const { container } = renderImport()
    const input = container.querySelector('input[type="file"]') as HTMLElement
    fireFileChange(input, makeFile())
    act(() => {
      triggerParseComplete(PREVIEW_ROWS)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Importieren' }))

    await waitFor(() => screen.getByText(/Ergebnis/))
    expect(screen.queryByText(/Vorschau/)).not.toBeInTheDocument()
  })

  it('does not show error list when result has no errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true, created: 3, skipped: 0, errors: [] }),
    })

    const { container } = renderImport()
    const input = container.querySelector('input[type="file"]') as HTMLElement
    fireFileChange(input, makeFile())
    act(() => {
      triggerParseComplete(PREVIEW_ROWS)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Importieren' }))

    await waitFor(() => screen.getByText(/Ergebnis/))
    expect(screen.queryByText('Fehler:')).not.toBeInTheDocument()
  })

  // ── Error display in result ──────────────────────────────────────────────

  it('shows per-row errors returned by the API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        created: 0,
        skipped: 1,
        errors: [{ row: 2, error: 'Ungültiger Wert' }],
      }),
    })

    const { container } = renderImport()
    const input = container.querySelector('input[type="file"]') as HTMLElement
    fireFileChange(input, makeFile())
    act(() => {
      triggerParseComplete(PREVIEW_ROWS)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Importieren' }))

    await waitFor(() => screen.getByText(/Ergebnis/))
    expect(screen.getByText('Fehler:')).toBeInTheDocument()
    expect(screen.getByText(/Zeile 2: Ungültiger Wert/)).toBeInTheDocument()
  })

  it('truncates error list at DISPLAY_LIMITS.importErrorPreview (10) and shows overflow count', async () => {
    const errors = Array.from({ length: 13 }, (_, i) => ({ row: i + 2, error: `Fehler ${i + 1}` }))
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: false, created: 0, skipped: 0, errors }),
    })

    const { container } = renderImport()
    const input = container.querySelector('input[type="file"]') as HTMLElement
    fireFileChange(input, makeFile())
    act(() => {
      triggerParseComplete(PREVIEW_ROWS)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Importieren' }))

    await waitFor(() => screen.getByText(/Ergebnis/))
    // Only 10 shown
    expect(screen.getByText(/Zeile 2: Fehler 1/)).toBeInTheDocument()
    expect(screen.getByText(/Zeile 11: Fehler 10/)).toBeInTheDocument()
    expect(screen.queryByText(/Zeile 12/)).not.toBeInTheDocument()
    // Overflow notice
    expect(screen.getByText(/...und 3 weitere Fehler/)).toBeInTheDocument()
  })

  it('does not show overflow notice when errors fit within limit', async () => {
    const errors = Array.from({ length: 3 }, (_, i) => ({ row: i + 2, error: `Fehler ${i + 1}` }))
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: false, created: 0, skipped: 0, errors }),
    })

    const { container } = renderImport()
    const input = container.querySelector('input[type="file"]') as HTMLElement
    fireFileChange(input, makeFile())
    act(() => {
      triggerParseComplete(PREVIEW_ROWS)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Importieren' }))

    await waitFor(() => screen.getByText(/Ergebnis/))
    expect(screen.queryByText(/weitere Fehler/)).not.toBeInTheDocument()
  })

  // ── Network/fetch error ──────────────────────────────────────────────────

  it('shows "Import fehlgeschlagen" when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network'))

    const { container } = renderImport()
    const input = container.querySelector('input[type="file"]') as HTMLElement
    fireFileChange(input, makeFile())
    act(() => {
      triggerParseComplete(PREVIEW_ROWS)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Importieren' }))

    await waitFor(() => screen.getByText('Import fehlgeschlagen'))
  })
})
