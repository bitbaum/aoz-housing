import { redirect } from 'next/navigation'
import { requireResidentCookie } from '@/lib/portal-auth'

export const metadata = { title: 'Mitbewohner' }
export const dynamic = 'force-dynamic'

/** Old bookmark. Roommate tips were generic; names already sit on the overview. */
export default async function PortalRoommatesRedirect() {
  await requireResidentCookie('/login')
  redirect('/portal')
}
