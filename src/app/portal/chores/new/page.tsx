import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { CreateChoreForm } from '@/components/portal/CreateChoreForm'
import { CHORE_LABELS } from '@/lib/config/household-tasks'
import { requireResidentCookie } from '@/lib/portal-auth'

export const dynamic = 'force-dynamic'

export default async function NewChorePage() {
  const residentCode = await requireResidentCookie('/portal')

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

      <h1 className="text-xl sm:text-2xl font-bold text-ui-text mb-1">{CHORE_LABELS.pages.create}</h1>
      <p className="text-ui-muted mb-6">{CHORE_LABELS.pages.createSubtitle}</p>

      <CreateChoreForm />
    </div>
  )
}
