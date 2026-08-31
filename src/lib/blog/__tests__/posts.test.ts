import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { getAllPosts, getPostBySlug } from '@/lib/blog/posts'
import { renderMarkdown } from '@/lib/blog/markdown'

jest.mock(
  'marked',
  () => ({
    Marked: class {
      parse(input: string) {
        if (input.includes('|---|'))
          return '<table><thead><tr><th>a</th><th>b</th></tr></thead></table>'
        return input.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      }
    },
  }),
  { virtual: true },
)

const BLOG_DIR = join(process.cwd(), 'docs', 'blog')

const posts = getAllPosts()

describe('blog posts', () => {
  it('reads every markdown file in docs/blog', () => {
    const files = readdirSync(BLOG_DIR).filter(
      (name) => name.endsWith('.md') && name !== 'README.md',
    )

    expect(posts).toHaveLength(files.length)
    expect(posts.length).toBeGreaterThan(0)
  })

  it('orders newest first', () => {
    const dates = posts.map((post) => post.date)
    expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates)
  })

  it('gives every post a title, a date and a body', () => {
    for (const post of posts) {
      expect({ slug: post.slug, hasTitle: post.title.length > 0 }).toEqual({
        slug: post.slug,
        hasTitle: true,
      })
      expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(post.body.length).toBeGreaterThan(200)
    }
  })

  it('keeps slugs unique', () => {
    // The slug drops the date prefix, so two posts published on different days
    // under the same name would collide on one URL and silently hide one.
    const slugs = posts.map((post) => post.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('agrees with the dateline printed inside each post', () => {
    // The date exists twice — in the filename (used for the URL and ordering)
    // and in the `*2026-08-15*` line a reader sees when opening the raw file.
    // Only one of them can be right, so they are pinned to each other here
    // rather than left to drift.
    for (const post of posts) {
      const raw = readFileSync(join(BLOG_DIR, post.filename), 'utf8')
      const dateline = /^\*(\d{4}-\d{2}-\d{2})\*$/m.exec(raw)

      expect({ file: post.filename, dateline: dateline?.[1] }).toEqual({
        file: post.filename,
        dateline: post.date,
      })
    }
  })

  it('strips the title and dateline out of the body', () => {
    for (const post of posts) {
      expect(post.body.startsWith('#')).toBe(false)
      expect(post.body).not.toMatch(/^\*\d{4}-\d{2}-\d{2}\*/)
    }
  })

  it('builds a prose excerpt, never a table row or a heading', () => {
    for (const post of posts) {
      expect(post.excerpt.length).toBeGreaterThan(40)
      expect(post.excerpt).not.toContain('|')
      expect(post.excerpt.startsWith('#')).toBe(false)
    }
  })

  it('is listed in the folder README', () => {
    // The README is how the posts are found when reading the repo rather than
    // the site. A post missing from it is invisible in one of its two homes.
    const readme = readFileSync(join(BLOG_DIR, 'README.md'), 'utf8')

    for (const post of posts) {
      expect({ slug: post.slug, indexed: readme.includes(post.filename) }).toEqual({
        slug: post.slug,
        indexed: true,
      })
    }
  })

  it('resolves posts by slug and rejects unknown ones', () => {
    expect(getPostBySlug(posts[0].slug)?.title).toBe(posts[0].title)
    expect(getPostBySlug('not-a-post')).toBeNull()
  })
})

describe('blog markdown rendering', () => {
  it('rewrites links between posts to their routes', () => {
    const html = renderMarkdown('See [that one](2026-08-14-cohabitation-os.md).')

    expect(html).toContain('href="/blog/cohabitation-os"')
    expect(html).not.toContain('.md')
  })

  it('keeps a fragment when rewriting', () => {
    const html = renderMarkdown('[x](2026-08-14-cohabitation-os.md#why)')
    expect(html).toContain('href="/blog/cohabitation-os#why"')
  })

  it('leaves external links alone', () => {
    const html = renderMarkdown('[docs](https://example.com/a.md)')
    expect(html).toContain('href="https://example.com/a.md"')
  })

  it('points a link to another repo doc at that file on GitHub', () => {
    // `../ROADMAP.md` is a real link in a real post. It reads correctly in the
    // repo and 404s on the web, so it resolves to where the file is published.
    const html = renderMarkdown('the [roadmap](../ROADMAP.md)')

    expect(html).toContain(
      'href="https://github.com/bitbaum/aoz-housing/blob/master/docs/ROADMAP.md"',
    )
  })

  it('never serves a real post with a link to a .md file', () => {
    // The failure this prevents is a 404 on the live site that renders as a
    // perfectly normal-looking link.
    for (const post of posts) {
      const html = renderMarkdown(post.body)
      const brokenLinks = Array.from(html.matchAll(/href="([^"]*\.md[^"]*)"/g))
        .map((match) => match[1])
        .filter((href) => !href.startsWith('http'))

      expect({ slug: post.slug, brokenLinks }).toEqual({ slug: post.slug, brokenLinks: [] })
    }
  })

  it('only sends readers to repo files that exist', () => {
    // Rewriting to a GitHub URL turns a broken link from something a test can
    // see into something only a reader can — unless the target is checked
    // against the working tree, which is the one place that knows.
    const repoRoot = process.cwd()

    for (const post of posts) {
      const html = renderMarkdown(post.body)
      const missing = Array.from(
        html.matchAll(/href="https:\/\/github\.com\/[^/]+\/[^/]+\/blob\/master\/([^"#]+)"/g),
      )
        .map((match) => match[1])
        .filter((path) => !existsSync(join(repoRoot, path)))

      expect({ slug: post.slug, missing }).toEqual({ slug: post.slug, missing: [] })
    }
  })

  it('renders GFM tables, which the posts rely on', () => {
    const html = renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |')

    expect(html).toContain('<table>')
    expect(html).toContain('<th>')
  })
})
