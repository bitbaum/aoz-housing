/**
 * Introspection helpers for drizzle where-expressions in unit tests.
 *
 * Prisma mocks could dispatch on plain `where` objects (`{ code: 'AOZ-1' }`);
 * drizzle where-args are opaque SQL trees. These helpers pull the
 * `column = value` pairs back out of eq()/and(eq(), …) expressions so mocks
 * keep the same discriminating power without asserting on internal tree
 * shapes. (A Column chunk carries `name` + `table`; a Param chunk carries
 * `value` + `encoder`.)
 */

interface SqlChunkNode {
  queryChunks?: unknown[]
}

/** All `column = value` pairs in an eq()/and(eq(), …) expression. */
export function whereParts(where: unknown): Record<string, unknown> {
  const pairs: Record<string, unknown> = {}
  let column: string | undefined
  const walk = (node: unknown): void => {
    for (const chunk of (node as SqlChunkNode)?.queryChunks ?? []) {
      if (!chunk || typeof chunk !== 'object') continue
      if ('queryChunks' in chunk) walk(chunk)
      else if ('name' in chunk && 'table' in chunk) column = (chunk as { name: string }).name
      else if ('encoder' in chunk && column !== undefined) {
        pairs[column] = (chunk as unknown as { value: unknown }).value
        column = undefined
      }
    }
  }
  walk(where)
  return pairs
}

/** The single `column = value` pair of a bare eq() expression. */
export function eqParts(where: unknown): { column?: string; value?: unknown } {
  const entries = Object.entries(whereParts(where))
  return entries.length ? { column: entries[0][0], value: entries[0][1] } : {}
}

/**
 * The literal text of a sql`` / sql.raw() query — its StringChunk pieces
 * joined. Parameters and columns are omitted; enough to tell one raw
 * statement from another (e.g. the pg_tables SELECT from the TRUNCATE).
 */
export function sqlText(query: unknown): string {
  let text = ''
  const walk = (node: unknown): void => {
    for (const chunk of (node as SqlChunkNode)?.queryChunks ?? []) {
      if (!chunk || typeof chunk !== 'object') continue
      if ('queryChunks' in chunk) walk(chunk)
      else if ('value' in chunk && Array.isArray((chunk as { value: unknown }).value)) {
        text += ((chunk as { value: string[] }).value ?? []).join('')
      }
    }
  }
  walk(query)
  return text
}
