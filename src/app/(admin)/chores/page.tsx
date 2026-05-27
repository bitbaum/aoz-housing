import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { StatCard } from '@/components/ui/Card'

export const metadata: Metadata = { title: 'Haushaltsaufgaben' }
import { CHORE_LABELS } from '@/lib/config/household-tasks'

const C = CHORE_LABELS.admin

export const dynamic = 'force-dynamic'

export default async function AdminChoresPage() {
  // Overall stats
  const [totalTasks, activeTasks, attentionTasks, totalCompletions] = await Promise.all([
    prisma.householdTask.count(),
    prisma.householdTask.count({ where: { isCompleted: false } }),
    prisma.householdTask.count({ where: { currentStatus: 'NEEDS_ATTENTION' } }),
    prisma.taskCompletion.count(),
  ])

  // Per-unit summary
  const units = await prisma.housingUnit.findMany({
    where: {
      status: { in: ['AVAILABLE', 'FULL'] },
    },
    select: {
      id: true,
      code: true,
      address: true,
      householdTasks: {
        select: {
          id: true,
          currentStatus: true,
          isCompleted: true,
        },
      },
      placements: {
        where: { status: 'ACTIVE' },
        select: { id: true },
      },
    },
    orderBy: { code: 'asc' },
  })

  const unitSummaries = units
    .filter(u => u.householdTasks.length > 0 || u.placements.length > 0)
    .map(unit => ({
      id: unit.id,
      code: unit.code,
      address: unit.address,
      totalTasks: unit.householdTasks.length,
      activeTasks: unit.householdTasks.filter(t => !t.isCompleted).length,
      attentionTasks: unit.householdTasks.filter(t => t.currentStatus === 'NEEDS_ATTENTION').length,
      residents: unit.placements.length,
    }))

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-ui-text mb-6">{C.pageTitle}</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label={CHORE_LABELS.statTotal} value={totalTasks} />
        <StatCard label={CHORE_LABELS.statActive} value={activeTasks} />
        <StatCard label={CHORE_LABELS.statNeedsAttention} value={attentionTasks} trend={attentionTasks > 0 ? 'warning' : 'good'} />
        <StatCard label={CHORE_LABELS.statCompletions} value={totalCompletions} />
      </div>

      {/* Unit table */}
      <div className="card">
        <h2 className="font-semibold text-ui-text mb-4">{C.perUnitTitle}</h2>

        {unitSummaries.length === 0 ? (
          <p className="text-ui-muted text-center py-8">
            {C.noUnits}
          </p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {unitSummaries.map((unit) => (
                <div key={unit.id} className="border border-ui-border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/housing/${unit.id}`} className="text-aoz-primary hover:underline font-medium">
                        {unit.code}
                      </Link>
                      <p className="text-sm text-ui-muted mt-1">{unit.address}</p>
                    </div>
                    {unit.attentionTasks > 0 ? (
                      <span className="px-2 py-1 bg-status-warning/15 text-status-warning-text rounded-full text-xs">
                        {unit.attentionTasks} {C.attention}
                      </span>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                    <div className="bg-ui-subtle rounded p-2 text-center">
                      <p className="text-ui-muted">{C.colResidents}</p>
                      <p className="font-semibold text-ui-text">{unit.residents}</p>
                    </div>
                    <div className="bg-ui-subtle rounded p-2 text-center">
                      <p className="text-ui-muted">{C.colTasks}</p>
                      <p className="font-semibold text-ui-text">{unit.totalTasks}</p>
                    </div>
                    <div className="bg-ui-subtle rounded p-2 text-center">
                      <p className="text-ui-muted">{C.colActive}</p>
                      <p className="font-semibold text-ui-text">{unit.activeTasks}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ui-border">
                    <th scope="col" className="text-left py-3 px-2 font-medium text-ui-muted">{C.colUnit}</th>
                    <th scope="col" className="text-left py-3 px-2 font-medium text-ui-muted">{C.colAddress}</th>
                    <th scope="col" className="text-center py-3 px-2 font-medium text-ui-muted">{C.colResidents}</th>
                    <th scope="col" className="text-center py-3 px-2 font-medium text-ui-muted">{C.colTasks}</th>
                    <th scope="col" className="text-center py-3 px-2 font-medium text-ui-muted">{C.colActive}</th>
                    <th scope="col" className="text-center py-3 px-2 font-medium text-ui-muted">{C.attention}</th>
                  </tr>
                </thead>
                <tbody>
                  {unitSummaries.map(unit => (
                    <tr key={unit.id} className="border-b border-ui-border hover:bg-ui-subtle">
                      <td className="py-3 px-2 font-medium">
                        <Link href={`/housing/${unit.id}`} className="text-aoz-primary hover:underline">
                          {unit.code}
                        </Link>
                      </td>
                      <td className="py-3 px-2 text-ui-muted">{unit.address}</td>
                      <td className="py-3 px-2 text-center">{unit.residents}</td>
                      <td className="py-3 px-2 text-center">{unit.totalTasks}</td>
                      <td className="py-3 px-2 text-center">{unit.activeTasks}</td>
                      <td className="py-3 px-2 text-center">
                        {unit.attentionTasks > 0 ? (
                          <span className="px-2 py-0.5 bg-status-warning/15 text-status-warning-text rounded-full text-xs">
                            {unit.attentionTasks}
                          </span>
                        ) : (
                          <span className="text-ui-muted">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
