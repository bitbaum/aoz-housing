import { redirect } from 'next/navigation'
import { requireResidentCookie } from '@/lib/portal-auth'

export const metadata = { title: 'Wohnung' }
export const dynamic = 'force-dynamic'

/** Old bookmark. The apartment diagram had no profiles behind the names. */
export default async function PortalApartmentRedirect() {
  await requireResidentCookie('/login')
  redirect('/portal')
}
