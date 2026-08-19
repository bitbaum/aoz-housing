import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Aufgaben' }
import { ChoreList } from '@/components/portal/ChoreList'
import { CHORE_LABELS } from '@/lib/config/household-tasks'
import { requireResidentCookie } from '@/lib/portal-auth'
import { RESIDENT_NAME_SELECT } from '@/lib/utils/resident-name'
import { loadChoreBalances } from '@/lib/chores/summary'

export const dynamic = 'force-dynamic'

export default async function ChoresPage() {
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

  if (!resident) {
    redirect('/portal')
  }

  const placement = resident.placements[0]
  if (!placement) {
    return (
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-ui-text mb-2">{CHORE_LABELS.pages.list}</h1>
        <p className="text-ui-muted">{CHORE_LABELS.errors.noPlacement}</p>
      </div>
    )
  }

  // tasks and balances both only need placement.housingUnitId — fetch in parallel
  const [tasks, balances] = await Promise.all([
    prisma.householdTask.findMany({
      where: { housingUnitId: placement.housingUnitId },
      include: {
        completions: {
          orderBy: { completedAt: 'desc' },
          take: 1,
          include: { completedBy: { select: RESIDENT_NAME_SELECT } },
        },
        attentionFlags: {
          where: { isResolved: false },
        },
        requests: {
          where: { status: { in: ['PENDING', 'ACCEPTED'] } },
        },
        createdByResident: { select: RESIDENT_NAME_SELECT },
      },
      orderBy: [
        { currentStatus: 'desc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    }),
    loadChoreBalances(placement.housingUnitId),
  ])

  // Serialize dates for client component
  const serializedTasks = JSON.parse(JSON.stringify(tasks))

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ui-text">{CHORE_LABELS.pages.list}</h1>
          <p className="text-ui-muted mt-1">{CHORE_LABELS.pages.listSubtitle}</p>
        </div>
        <Link
          href="/portal/chores/new"
          className="btn-primary min-h-[44px] px-4 flex items-center gap-2"
        >
          + {CHORE_LABELS.actions.create}
        </Link>
      </div>

      <ChoreList
        tasks={serializedTasks}
        balances={balances}
        currentResidentId={resident.id}
      />
    </div>
  )
}
