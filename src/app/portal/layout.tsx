import Link from 'next/link'

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-aoz-background">
      {/* Simple header for residents */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/portal" className="text-xl font-bold text-aoz-primary">
                Mein Zuhause
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <PortalNavLink href="/portal">Übersicht</PortalNavLink>
              <PortalNavLink href="/portal/roommates">Mitbewohner</PortalNavLink>
              <PortalNavLink href="/portal/report">Melden</PortalNavLink>
              <PortalNavLink href="/portal/preferences">Einstellungen</PortalNavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>Bei Notfällen: 112 oder Hausverwaltung kontaktieren</p>
            <Link href="/portal/help" className="hover:text-aoz-primary">
              Hilfe
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function PortalNavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="text-gray-600 hover:text-aoz-primary transition-colors"
    >
      {children}
    </Link>
  )
}
