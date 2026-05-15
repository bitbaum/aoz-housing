import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { PortalNav } from '@/components/portal/PortalNav'

export const metadata: Metadata = {
  title: {
    template: '%s | Bewohnerportal',
    default: 'Bewohnerportal',
  },
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value
  const hasStaffAccess = !!cookieStore.get('staff_session')?.value

  if (!residentCode) {
    return (
      <div className="min-h-screen bg-aoz-background">{children}</div>
    )
  }

  return (
    <div className="min-h-screen bg-aoz-background flex flex-col">
      {/* Header with responsive navigation */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <PortalNav hasStaffAccess={hasStaffAccess} />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white/60 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
            <p className="text-center sm:text-left">{PORTAL_LABELS.emergency}</p>
            <Link href="/portal/help" className="hover:text-aoz-primary min-h-[44px] flex items-center">
              {PORTAL_LABELS.nav.help}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
