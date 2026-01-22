import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AOZ Housing - Intelligent Placement System',
  description: 'Reduce conflicts and improve wellbeing through compatibility-based housing placement',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-aoz-background">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-200 fixed h-full">
            <div className="p-6">
              <h1 className="text-xl font-bold text-aoz-primary">AOZ Housing</h1>
              <p className="text-sm text-gray-500 mt-1">Placement System</p>
            </div>
            <nav className="px-4">
              <NavLink href="/" icon="home">Dashboard</NavLink>
              <NavLink href="/residents" icon="users">Bewohner</NavLink>
              <NavLink href="/housing" icon="building">Unterkünfte</NavLink>
              <NavLink href="/placements" icon="puzzle">Platzierungen</NavLink>
              <NavLink href="/matching" icon="heart">Matching</NavLink>
              <NavLink href="/analytics" icon="chart">Auswertung</NavLink>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 ml-64">
            <header className="bg-white border-b border-gray-200 px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  {/* Breadcrumb placeholder */}
                </div>
                <div className="flex items-center gap-4">
                  <button className="btn-outline text-sm">
                    Hilfe
                  </button>
                </div>
              </div>
            </header>
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}

function NavLink({ 
  href, 
  icon, 
  children 
}: { 
  href: string
  icon: string
  children: React.ReactNode 
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <NavIcon name={icon} />
      <span>{children}</span>
    </a>
  )
}

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    puzzle: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',
    heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  }
  
  return (
    <svg 
      className="w-5 h-5" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d={icons[name] || icons.home} 
      />
    </svg>
  )
}
