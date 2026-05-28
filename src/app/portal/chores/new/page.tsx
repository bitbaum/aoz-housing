import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { CreateChoreForm } from '@/components/portal/CreateChoreForm'
import { CHORE_LABELS } from '@/lib/config/household-tasks'
import { requireResidentCookie } from '@/lib/portal-auth'
import { PageHeader } from '@/components/ui/Page'

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
      <div className="mb-6">
        <PageHeader
          title={CHORE_LABELS.pages.create}
          description={CHORE_LABELS.pages.createSubtitle}
          backHref="/portal/chores"
          backLabel={CHORE_LABELS.pages.list}
        />
      </div>

      <CreateChoreForm />
    </div>
  )
}
