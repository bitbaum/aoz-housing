/**
 * Money — integer Rappen end to end. Parse once at the input boundary,
 * format once at display. No floats between.
 */

/** Parse a CHF amount ("89.90", "89,90", "89") into integer Rappen. Throws on garbage. */
export function chfToRappen(input: string | number): number {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) throw new Error(`Invalid CHF amount: ${input}`)
    return Math.round(input * 100)
  }
  const normalized = input.trim().replace(/'/g, '').replace(',', '.')
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`Invalid CHF amount: ${input}`)
  }
  const [francs, rappen = ''] = normalized.split('.')
  const sign = francs.startsWith('-') ? -1 : 1
  const francsAbs = Math.abs(parseInt(francs, 10))
  const rappenPart = parseInt(rappen.padEnd(2, '0') || '0', 10)
  return sign * (francsAbs * 100 + rappenPart)
}

/** Format integer Rappen as "CHF 89.90" (Swiss style). */
export function formatRappen(rappen: number): string {
  if (!Number.isInteger(rappen)) throw new Error(`Rappen must be an integer: ${rappen}`)
  const sign = rappen < 0 ? '-' : ''
  const abs = Math.abs(rappen)
  const francs = Math.floor(abs / 100)
  const rest = abs % 100
  const grouped = francs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'")
  return `${sign}CHF ${grouped}.${rest.toString().padStart(2, '0')}`
}
