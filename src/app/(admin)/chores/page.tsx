import { prisma } from '@/lib/db'
import Link from 'next/link'
import { StatCard } from '@/components/ui/Card'
import {
  TASK_CATEGORY_LABELS,
  TASK_CATEGORY_ICONS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
} from '@/lib/config/household-tasks'

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Haushaltsaufgaben</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Aufgaben" value={totalTasks} />
        <StatCard label="Aktive Aufgaben" value={activeTasks} />
        <StatCard label="Braucht Aufmerksamkeit" value={attentionTasks} trend={attentionTasks > 0 ? 'warning' : 'good'} />
        <StatCard label="Erledigungen" value={totalCompletions} />
      </div>

      {/* Unit table */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Aufgaben pro Unterkunft</h2>

        {unitSummaries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Keine Unterkünfte mit Aufgaben gefunden
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Unterkunft</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Adresse</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-600">Bewohner</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-600">Aufgaben</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-600">Aktiv</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-600">Achtung</th>
                </tr>
              </thead>
              <tbody>
                {unitSummaries.map(unit => (
                  <tr key={unit.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">
                      <Link href={`/housing/${unit.id}`} className="text-aoz-primary hover:underline">
                        {unit.code}
                      </Link>
                    </td>
                    <td className="py-3 px-2 text-gray-600">{unit.address}</td>
                    <td className="py-3 px-2 text-center">{unit.residents}</td>
                    <td className="py-3 px-2 text-center">{unit.totalTasks}</td>
                    <td className="py-3 px-2 text-center">{unit.activeTasks}</td>
                    <td className="py-3 px-2 text-center">
                      {unit.attentionTasks > 0 ? (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                          {unit.attentionTasks}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
