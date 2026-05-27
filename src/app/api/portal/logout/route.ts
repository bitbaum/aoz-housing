import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { RESIDENT_COOKIE } from '@/lib/portal-auth'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete(RESIDENT_COOKIE)
  redirect('/portal')
}
