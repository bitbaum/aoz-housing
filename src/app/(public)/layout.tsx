import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { BLOG_LABELS } from '@/lib/constants/labels'

/**
 * The route group for pages that are readable without an account.
 *
 * It exists because "public" was previously only a claim: `/algorithm` sits in
 * the `(admin)` group and was listed in PUBLIC_ROUTES, but the admin layout
 * redirects anyone without a staff session, so the middleware boundary and the
 * rendered page disagreed. A public page needs a layout that does not gate,
 * which means its own group — being absent from STAFF_ROUTES is not enough.
 *
 * Nothing here touches cookies or the database. That is load-bearing: it keeps
 * every page below it statically prerenderable, and it means this surface
 * cannot leak resident data even by accident, because it has no way to read
 * any.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-ui-canvas">
      <a href="#public-main" className="skip-link">Zum Inhalt springen</a>

      <header className="chrome-bar sticky top-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 h-14">
            <Logo href="/blog" size="md" />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Link href="/login" className="btn-ghost text-sm">
                {BLOG_LABELS.toApp}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main id="public-main" className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {children}
      </main>

      <footer className="border-t border-ui-border mt-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <p className="eyebrow">{BLOG_LABELS.title}</p>
        </div>
      </footer>
    </div>
  )
}
