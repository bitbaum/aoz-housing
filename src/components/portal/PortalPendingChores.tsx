import Link from 'next/link'

interface PendingChore {
  id: string
  title: string
  currentStatus: string
}

interface PortalPendingChoresProps {
  chores: PendingChore[]
}

export function PortalPendingChores({ chores }: PortalPendingChoresProps) {
  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Offene Aufgaben</h2>
        <Link href="/portal/chores" className="text-sm text-aoz-primary hover:underline">
          Alle anzeigen
        </Link>
      </div>
      <div className="space-y-3">
        {chores.slice(0, 3).map((task) => (
          <Link
            key={task.id}
            href={`/portal/chores/${task.id}`}
            className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-medium text-gray-900 text-sm">{task.title}</p>
              <p className="text-xs text-gray-500">
                {task.currentStatus === 'NEEDS_ATTENTION' ? 'Braucht Aufmerksamkeit' : 'Anfrage offen'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
