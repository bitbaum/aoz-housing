import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { CreateChoreForm } from '@/components/portal/CreateChoreForm'
import { CHORE_LABELS } from '@/lib/config/household-tasks'

export const dynamic = 'force-dynamic'

export default async function NewChorePage() {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) {
    redirect('/portal')
  }

  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
    include: {
      placements: {
        where: { status: 'ACTIVE' },
        take: 1,
      },
    },
  })

  if (!resident || !resident.placements[0]) {
    redirect('/portal')
  }

  return (
    <div>
      <Link
        href="/portal/chores"
        className="inline-flex items-center min-h-[44px] px-1 -ml-1 mb-2 text-sm text-aoz-primary hover:underline"
      >
        ← {CHORE_LABELS.pages.list}
      </Link>

      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{CHORE_LABELS.pages.create}</h1>
      <p className="text-gray-500 mb-6">{CHORE_LABELS.pages.createSubtitle}</p>

      <CreateChoreForm />
    </div>
  )
}
