/**
 * Slug generation — nobody should have to type a URL-safe string by hand.
 * The admin form derives this from the product name; the server is the
 * final authority and de-duplicates against existing slugs.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** Appends -2, -3, ... until `taken` no longer contains the candidate. */
export function dedupeSlug(base: string, taken: ReadonlySet<string>): string {
  const root = base || 'product'
  if (!taken.has(root)) return root
  let n = 2
  while (taken.has(`${root}-${n}`)) n++
  return `${root}-${n}`
}
