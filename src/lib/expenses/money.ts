/**
 * Money handling for shared expenses.
 *
 * All amounts are integer Rappen end to end — parsing happens once at the
 * input boundary (chfToRappen), formatting once at the display boundary
 * (formatRappen). Nothing in between ever touches floats.
 */

/**
 * Parse user input like "12", "12.5", "12,50", "1'234.50" into Rappen.
 * Returns null for anything that is not an unambiguous non-negative amount.
 */
export function chfToRappen(input: string): number | null {
  const cleaned = input
    .trim()
    .replace(/[’'\s]/g, '')
    .replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  const [francs, cents = ''] = cleaned.split('.')
  const rappen = parseInt(francs, 10) * 100 + parseInt((cents + '00').slice(0, 2), 10)
  return Number.isSafeInteger(rappen) ? rappen : null
}

/** Format Rappen as Swiss francs, e.g. 1234550 → "CHF 12'345.50". */
export function formatRappen(rappen: number): string {
  const sign = rappen < 0 ? '-' : ''
  const abs = Math.abs(rappen)
  const francs = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "'")
  const cents = (abs % 100).toString().padStart(2, '0')
  return `${sign}CHF ${francs}.${cents}`
}
