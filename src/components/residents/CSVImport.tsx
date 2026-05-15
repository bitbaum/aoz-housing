'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { EXPORT_LABELS } from '@/lib/constants/labels/export'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'

interface ImportResult {
  success: boolean
  created: number
  skipped: number
  errors: { row: number; error: string }[]
}

export function CSVImport() {
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setError(null)

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      preview: 5,
      complete: (results) => {
        setPreview(results.data as Record<string, string>[])
      },
      error: () => {
        setError('CSV konnte nicht gelesen werden')
      },
    })
  }

  async function handleSubmit() {
    if (!file) return
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/import/residents', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      setResult(data)
      setPreview(null)
    } catch {
      setError('Import fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="min-h-[44px] rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {EXPORT_LABELS.selectFile}
        </button>
        <a
          href="/api/export/template"
          className="text-sm text-blue-600 hover:underline"
        >
          {EXPORT_LABELS.downloadTemplate}
        </a>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {preview && preview.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            {EXPORT_LABELS.preview} (erste {preview.length} Zeilen)
          </h3>
          <div className="overflow-x-auto rounded border">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(preview[0]).map((key) => (
                    <th
                      scope="col"
                      key={key}
                      className="px-3 py-2 text-left font-medium text-gray-500"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {preview.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td
                        key={j}
                        className="whitespace-nowrap px-3 py-2 text-gray-700"
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="min-h-[44px] rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? EXPORT_LABELS.importing : EXPORT_LABELS.importButton}
          </button>
        </div>
      )}

      {result && (
        <div className="rounded-md bg-gray-50 p-4 space-y-2">
          <p className="text-sm font-medium">
            {EXPORT_LABELS.result}: {result.created} {EXPORT_LABELS.created},{' '}
            {result.skipped} {EXPORT_LABELS.skipped}
          </p>
          {result.errors.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-red-600">
                {EXPORT_LABELS.errors}:
              </p>
              {result.errors.slice(0, DISPLAY_LIMITS.importErrorPreview).map((err, i) => (
                <p key={i} className="text-xs text-red-600">
                  {EXPORT_LABELS.row} {err.row}: {err.error}
                </p>
              ))}
              {result.errors.length > 10 && (
                <p className="text-xs text-gray-500">
                  ...und {result.errors.length - 10} weitere Fehler
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
