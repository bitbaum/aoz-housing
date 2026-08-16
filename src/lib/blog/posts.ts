import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

/**
 * The engineering blog, read from `docs/blog/*.md`.
 *
 * WHY THE MARKDOWN FILES ARE THE SSOT. The posts already existed as reviewed
 * files in the repo, and they are the artefact people edit. Copying them into
 * `src/content/` to make them easier to import would create a second copy that
 * drifts the first time someone fixes a typo in the wrong one. So the folder
 * stays where it is and this module reads it.
 *
 * WHY THERE IS NO FRONTMATTER. The title is the `# h1` and the date is in the
 * filename — both already load-bearing, both already conventions the folder
 * follows. Adding `title:` frontmatter would mean the title exists twice in one
 * file, which is the same drift one level down.
 *
 * WHY THIS ONLY EVER RUNS AT BUILD TIME. The blog routes are `force-static`
 * with `dynamicParams = false`, so every page is prerendered on the CI runner,
 * where the whole repo is present. The deployed standalone bundle never reads
 * `docs/` — it serves HTML that was already rendered. Making a blog page
 * dynamic would break that quietly in production, which is why the routes pin
 * it rather than relying on Next's inference.
 */

const BLOG_DIR = join(process.cwd(), 'docs', 'blog')

/** `YYYY-MM-DD-slug.md` — the naming convention documented in the folder README. */
const FILENAME_PATTERN = /^(\d{4}-\d{2}-\d{2})-([a-z0-9-]+)\.md$/

export interface BlogPost {
  /** URL segment: the filename stem with the date prefix removed. */
  slug: string
  title: string
  /** ISO date, taken from the filename — the structural source. */
  date: string
  /** Markdown body, with the `# title` and the `*date*` line removed. */
  body: string
  /** First paragraph as plain text: index teaser and meta description. */
  excerpt: string
  /** The file this came from, so an error message can name it. */
  filename: string
}

function parsePost(filename: string, raw: string): BlogPost {
  const match = FILENAME_PATTERN.exec(filename)
  if (!match) {
    throw new Error(
      `Blog post "${filename}" does not follow the YYYY-MM-DD-slug.md convention.`
    )
  }
  const [, date, slug] = match

  const lines = raw.split('\n')

  const titleIndex = lines.findIndex(line => line.startsWith('# '))
  if (titleIndex === -1) {
    throw new Error(`Blog post "${filename}" has no "# Title" heading.`)
  }
  const title = lines[titleIndex].slice(2).trim()

  // The rendered page prints the date from the filename, so the `*2026-08-15*`
  // line the posts carry for plain-file readers is dropped here rather than
  // shown twice. Only the one directly under the title is treated as the
  // dateline; an emphasised line further down is ordinary prose.
  const rest = lines.slice(titleIndex + 1)
  const datelineIndex = rest.findIndex(line => line.trim() !== '')
  const isDateline =
    datelineIndex !== -1 && /^\*\d{4}-\d{2}-\d{2}\*$/.test(rest[datelineIndex].trim())

  const body = (isDateline ? rest.slice(datelineIndex + 1) : rest).join('\n').trim()

  return { slug, title, date, body, excerpt: firstParagraph(body), filename }
}

/**
 * First prose paragraph, flattened to plain text. Skips anything that is not
 * running prose (headings, tables, code fences, lists) so a post that opens on
 * a table does not get a row of pipes as its teaser.
 */
function firstParagraph(body: string): string {
  const blocks = body.split(/\n\s*\n/)
  const prose = blocks.find(block => {
    const trimmed = block.trim()
    return trimmed.length > 0 && !/^[#>|\-*`]/.test(trimmed)
  })
  if (!prose) return ''

  return prose
    .replace(/\s+/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → their text
    .replace(/[*_`]/g, '')
    .trim()
}

/** Every post, newest first. Ties break on slug so the order is deterministic. */
export function getAllPosts(): BlogPost[] {
  const files = readdirSync(BLOG_DIR).filter(name => FILENAME_PATTERN.test(name))

  return files
    .map(name => parsePost(name, readFileSync(join(BLOG_DIR, name), 'utf8')))
    .sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date)))
}

export function getPostBySlug(slug: string): BlogPost | null {
  return getAllPosts().find(post => post.slug === slug) ?? null
}
