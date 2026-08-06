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
function sourceFilesWithDirective(): string[] {
  const out = execSync(
    `grep -rl --include=*.tsx --include=*.ts -e "^\\s*['\\"]use client['\\"]" src || true`,
    { encoding: 'utf8', cwd: process.cwd() }
  )
  return out.split('\n').filter(Boolean)
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
