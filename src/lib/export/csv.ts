/**
 * CSV generation using papaparse.
 * Transforms data rows using column config and produces a CSV string.
 */

import Papa from 'papaparse'
import type { ExportColumn } from './config'

export function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
): string {
  const rows = data.map((row) =>
    columns.reduce(
      (acc, col) => {
        const value = row[col.key]
        acc[col.header] = col.transform ? col.transform(value, row) : String(value ?? '')
        return acc
      },
      {} as Record<string, string>,
    ),
  )

  const headers = columns.map((c) => c.header)

  if (rows.length === 0) {
    return Papa.unparse({ fields: headers, data: [] })
  }

  return Papa.unparse(rows, { columns: headers })
}
