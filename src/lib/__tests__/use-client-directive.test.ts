import { execSync } from 'child_process'
import { readFileSync } from 'fs'

/**
 * `'use client'` must be the first *statement* in a file — only comments may
 * precede it. Next.js rejects anything else at build time.
 *
 * Why this guard exists: nothing else in `npm run verify` catches it. tsc,
 * ESLint and Jest all pass happily on a file whose directive sits below an
 * import; only `next build` fails. A codemod that inserted an import at the
 * top of every touched file put one import above the directive, shipped
 * through a green verify, and broke the production build — with CI unavailable
 * to catch it. This test closes that gap at zero cost.
 */
function filesWithDirective(directive: 'use client' | 'use server'): string[] {
  const out = execSync(
    `grep -rl --include=*.tsx --include=*.ts -e "^\\s*['\\"]${directive}['\\"]" src || true`,
    { encoding: 'utf8', cwd: process.cwd() }
  )
  return out.split('\n').filter(Boolean)
}

function sourceFilesWithDirective(): string[] {
  return filesWithDirective('use client')
}

/** Strip leading comments and blank lines — both are legal before a directive. */
function firstStatement(source: string): string {
  const lines = source.split('\n')
  let i = 0
  let inBlockComment = false

  while (i < lines.length) {
    const line = lines[i].trim()

    if (inBlockComment) {
      if (line.includes('*/')) inBlockComment = false
      i++
      continue
    }
    if (line === '' || line.startsWith('//')) {
      i++
      continue
    }
    if (line.startsWith('/*')) {
      if (!line.includes('*/')) inBlockComment = true
      i++
      continue
    }
    return line
  }
  return ''
}

describe("'use client' placement", () => {
  const files = sourceFilesWithDirective()

  it('finds client components to check', () => {
    // A zero-length list would make this suite silently vacuous.
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files)('%s declares the directive before any import', (file) => {
    const first = firstStatement(readFileSync(file, 'utf8'))

    expect(first).toMatch(/^['"]use client['"]/)
  })
})

/**
 * The same trap on the server side: a `'use server'` file may export ONLY async
 * functions. A `export const SOME_PATH = '/x'` next to the actions reads as
 * ordinary tidy code, type-checks, lints, and passes 3000 tests — and fails
 * `next build` with an error about a line nobody was editing.
 *
 * This one is not hypothetical either: adding a shared route constant to the
 * opportunity actions cost exactly that build. Erased type exports are fine,
 * since nothing of them survives to the runtime boundary.
 */
function offendingServerExports(source: string): string[] {
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('export '))
    .filter((line) => !/^export\s+(type|interface)\b/.test(line))
    .filter((line) => !/^export\s+async\s+function\b/.test(line))
    .filter((line) => !/^export\s+default\s+async\s+function\b/.test(line))
}

describe("'use server' exports", () => {
  // Only MODULE-level directives. `'use server'` also appears indented inside a
  // single function to mark one inline action, and that form carries no
  // restriction on what the surrounding file exports — a page using one still
  // needs its `export const metadata`.
  const files = filesWithDirective('use server').filter((file) =>
    /^['"]use server['"]/.test(firstStatement(readFileSync(file, 'utf8')))
  )

  it('finds server action modules to check', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files)('%s exports only async functions', (file) => {
    const offenders = offendingServerExports(readFileSync(file, 'utf8'))

    expect({ file, offenders }).toEqual({ file, offenders: [] })
  })

  it('would catch the export that broke the build', () => {
    // Proves the matcher rather than trusting it: the real offending line
    // fails, and the legal neighbours it sits among do not.
    expect(offendingServerExports(`export const PATH = '/portal/opportunities'`)).toHaveLength(1)
    expect(offendingServerExports('export async function doThing() {}')).toHaveLength(0)
    expect(offendingServerExports('export type Outcome = string')).toHaveLength(0)
  })
})
