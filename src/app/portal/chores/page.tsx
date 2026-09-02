import type { Metadata } from 'next'
import { getRequestTranslator } from '@/lib/i18n/request'
import {
  db,
  resident as residentTable,
  placement as placementTable,
  householdTask,
  taskCompletion,
  taskAttentionFlag,
  taskRequest,
} from '@/lib/db'
import { eq, desc, inArray } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestTranslator()
  return { title: t('nav.chores') }
}
import { ChoreList } from '@/components/portal/ChoreList'
import { CHORE_LABELS } from '@/lib/config/household-tasks'
import { requireResidentCookie } from '@/lib/portal-auth'
import { RESIDENT_NAME_SELECT } from '@/lib/utils/resident-name'
import { loadChoreBalances } from '@/lib/chores/summary'

export const dynamic = 'force-dynamic'

export default async function ChoresPage() {
  const residentCode = await requireResidentCookie('/portal')

  const resident = await db.query.resident.findFirst({
    where: eq(residentTable.code, residentCode),
    with: {
      placements: {
        where: eq(placementTable.status, 'ACTIVE'),
        limit: 1,
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
        <h1 className="text-xl sm:text-2xl font-bold text-ui-text mb-2">
          {CHORE_LABELS.pages.list}
        </h1>
        <p className="text-ui-muted">{CHORE_LABELS.errors.noPlacement}</p>
      </div>
    )
  }

  // tasks and balances both only need placement.housingUnitId — fetch in parallel
  const [tasks, balances] = await Promise.all([
    db.query.householdTask.findMany({
      where: eq(householdTask.housingUnitId, placement.housingUnitId),
      with: {
        completions: {
          orderBy: [desc(taskCompletion.completedAt)],
          limit: 1,
          with: { completedBy: { columns: RESIDENT_NAME_SELECT } },
        },
        attentionFlags: {
          where: eq(taskAttentionFlag.isResolved, false),
        },
        requests: {
          where: inArray(taskRequest.status, ['PENDING', 'ACCEPTED']),
        },
        createdByResident: { columns: RESIDENT_NAME_SELECT },
      },
      orderBy: [
        desc(householdTask.currentStatus),
        desc(householdTask.priority),
        desc(householdTask.createdAt),
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

      <ChoreList tasks={serializedTasks} balances={balances} currentResidentId={resident.id} />
    </div>
  )
}
