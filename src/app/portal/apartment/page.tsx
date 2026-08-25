import type { Metadata } from 'next'
import { getRequestTranslator } from '@/lib/i18n/request'
import { redirect } from 'next/navigation'
import { requireResidentCookie } from '@/lib/portal-auth'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestTranslator()
  return { title: t('nav.apartment') }
}
export const dynamic = 'force-dynamic'

/** Old bookmark. The apartment diagram had no profiles behind the names. */
export default async function PortalApartmentRedirect() {
  await requireResidentCookie('/login')
  redirect('/portal')
}
