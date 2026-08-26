import { readdirSync, readFileSync, existsSync } from 'fs'
import { join, dirname, relative, sep } from 'path'
import { PUBLIC_ROUTES, matchesRoute } from '@/lib/auth/route-boundaries'
import { PREFIXED_LOCALE_IDS } from '@/lib/config/public-locales'

/**
 * "Public" has to mean the page actually renders for a signed-out visitor.
 *
 * It did not. `/algorithm` was declared in PUBLIC_ROUTES while living in the
 * `(admin)` group, whose layout redirects anyone without a staff session — so
 * the middleware waved the request through and the layout bounced it one step
 * later. Nothing failed; the route simply was not what the list said it was,
 * and the only way to find out was to curl production.
 *
 * A grep for the route name could not have caught that, because the mistake is
 * a relationship between two files that never mention each other. So the check
 * is structural: resolve each declared public route to the page file Next would
 * actually serve, then read the layouts that wrap it.
 */

const APP_DIR = join(process.cwd(), 'src', 'app')

/** Marks a layout as gating: it reads a session, so it can turn a visitor away. */
const AUTH_READS = ['getCurrentUser', 'getPortalAuth', 'requireStaffAuth', 'requireResidentAuth']

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return entry.name === 'page.tsx' ? [full] : []
  })
}

/** File path → the URL Next serves it at. Route groups `(x)` are not segments. */
function urlPathOf(pageFile: string): string {
  const segments = relative(APP_DIR, dirname(pageFile))
    .split(sep)
    .filter(segment => segment !== '' && !segment.startsWith('('))
  return `/${segments.join('/')}`.replace(/\/$/, '') || '/'
}

/** Every layout.tsx from the page's own folder up to src/app, root included. */
function ancestorLayouts(pageFile: string): string[] {
  const layouts: string[] = []
  let dir = dirname(pageFile)
  for (;;) {
    const layout = join(dir, 'layout.tsx')
    if (existsSync(layout)) layouts.push(layout)
    if (dir === APP_DIR) break
    dir = dirname(dir)
  }
  return layouts
}

const pages = walk(APP_DIR).map(file => ({ file, url: urlPathOf(file) }))

describe('declared public routes are actually public', () => {
  // API routes guard themselves inside the handler and have no layout chain.
  const publicPageRoutes = PUBLIC_ROUTES.filter(route => !route.startsWith('/api/'))

  it('finds pages for the declared public routes', () => {
    // Guards the walker itself: if the traversal broke, every assertion below
    // would pass vacuously over an empty list.
    expect(pages.length).toBeGreaterThan(20)
  })

  it.each(publicPageRoutes)('%s does not live in the staff-gated (admin) group', route => {
    const matching = pages.filter(page => matchesRoute(page.url, route))

    for (const page of matching) {
      expect(page.file).not.toContain(`${sep}(admin)${sep}`)
    }
  })

  it('every page in the (public) group is wrapped only by non-gating layouts', () => {
    const publicPages = pages.filter(page => page.file.includes(`${sep}(public)${sep}`))
    expect(publicPages.length).toBeGreaterThan(0)

    for (const page of publicPages) {
      for (const layout of ancestorLayouts(page.file)) {
        const source = readFileSync(layout, 'utf8')
        for (const read of AUTH_READS) {
          // Asserted as an object so a failure names the layout and the call
          // it found, rather than reporting `true !== false`.
          expect({ layout: relative(APP_DIR, layout), read, gates: source.includes(read) })
            .toEqual({ layout: relative(APP_DIR, layout), read, gates: false })
        }
      }
    }
  })

  it('every page in the (public) group is declared in PUBLIC_ROUTES', () => {
    // The closed side of the rule. Without it a new anonymous page could ship
    // without ever being named as a public surface.
    const publicPages = pages.filter(page => page.file.includes(`${sep}(public)${sep}`))

    for (const page of publicPages) {
      for (const url of concreteUrls(page.url)) {
        const declared = PUBLIC_ROUTES.some(route => matchesRoute(url, route))
        expect({ page: url, declared }).toEqual({ page: url, declared: true })
      }
    }
  })
})

/**
 * A page file's URL is a TEMPLATE; middleware sees concrete paths.
 *
 * `matchesRoute` is a literal prefix test, and it must stay one — it is what
 * middleware uses to decide whether a request needs a session, and teaching it
 * to match `[lang]` against anything would widen a live auth boundary to fix a
 * test. So the expansion belongs here instead: `/[lang]/willkommen` is compared
 * as `/en/willkommen` and `/fr/willkommen`, which are the URLs that actually
 * get requested.
 *
 * Most dynamic pages need no expansion because a declared parent already covers
 * them by prefix (`/blog/[slug]` sits under `/blog`). `[lang]` is the first
 * segment that is itself the FIRST segment, so nothing above it can cover it —
 * which is exactly why this test caught it.
 */
function concreteUrls(templateUrl: string): string[] {
  if (!templateUrl.includes('[lang]')) return [templateUrl]
  return PREFIXED_LOCALE_IDS.map(locale => templateUrl.replace('[lang]', locale))
}
