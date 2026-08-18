/**
 * SKU generation — staff should never have to invent a stock code. Derived
 * from the product slug, size and color; deduplicated against what exists.
 */
function initials(text: string, length: number): string {
  const letters = text.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return letters.slice(0, length) || 'GEN'
}

export function generateSku(productSlug: string, size: string, color: string): string {
  const prefix = initials(productSlug.replace(/-/g, ''), 3)
  const sizePart = size.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'OS'
  const colorPart = color ? `-${initials(color, 3)}` : ''
  return `${prefix}-${sizePart}${colorPart}`
}

/** Appends -2, -3, ... until `taken` no longer contains the candidate. */
export function dedupeSku(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}
