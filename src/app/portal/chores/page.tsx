import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Aufgaben' }
import { ChoreList } from '@/components/portal/ChoreList'
import { CHORE_LABELS } from '@/lib/config/household-tasks'

export const dynamic = 'force-dynamic'

export default async function ChoresPage() {
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

  if (!resident) {
    redirect('/portal')
  }

  const placement = resident.placements[0]
  if (!placement) {
    return (
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{CHORE_LABELS.pages.list}</h1>
        <p className="text-gray-500">{CHORE_LABELS.errors.noPlacement}</p>
      </div>
    )
  }

  // tasks, completionCounts, roommates all only need placement.housingUnitId — fetch in parallel
  const [tasks, completionCounts, roommates] = await Promise.all([
    prisma.householdTask.findMany({
      where: { housingUnitId: placement.housingUnitId },
      include: {
        completions: {
          orderBy: { completedAt: 'desc' },
          take: 1,
          include: { completedBy: { select: { id: true, code: true } } },
        },
        attentionFlags: {
          where: { isResolved: false },
        },
        requests: {
          where: { status: { in: ['PENDING', 'ACCEPTED'] } },
        },
        createdByResident: { select: { id: true, code: true } },
      },
      orderBy: [
        { currentStatus: 'desc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    }),
    prisma.taskCompletion.groupBy({
      by: ['completedById'],
      where: {
        task: { housingUnitId: placement.housingUnitId },
      },
      _count: { id: true },
    }),
    prisma.placement.findMany({
      where: {
        housingUnitId: placement.housingUnitId,
        status: 'ACTIVE',
      },
      select: {
        resident: { select: { id: true, code: true } },
      },
    }),
  ])

  const fairness = roommates.map(p => ({
    residentId: p.resident.id,
    code: p.resident.code,
    completions: completionCounts.find(c => c.completedById === p.resident.id)?._count.id || 0,
  }))

  // Serialize dates for client component
  const serializedTasks = JSON.parse(JSON.stringify(tasks))

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{CHORE_LABELS.pages.list}</h1>
          <p className="text-gray-500 mt-1">{CHORE_LABELS.pages.listSubtitle}</p>
        </div>
        <Link
          href="/portal/chores/new"
          className="btn-primary min-h-[44px] px-4 flex items-center gap-2"
        >
          + {CHORE_LABELS.actions.create}
        </Link>
      </div>

      <ChoreList tasks={serializedTasks} fairness={fairness} />
    </div>
  )
}
