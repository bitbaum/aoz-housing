import type { Metadata } from 'next'
import { getRequestTranslator } from '@/lib/i18n/request'
import { redirect } from 'next/navigation'
import { requireResidentCookie } from '@/lib/portal-auth'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestTranslator()
  return { title: t('nav.roommates') }
}
export const dynamic = 'force-dynamic'

/** Old bookmark. Roommate tips were generic; names already sit on the overview. */
export default async function PortalRoommatesRedirect() {
  await requireResidentCookie('/login')
  redirect('/portal')
}
