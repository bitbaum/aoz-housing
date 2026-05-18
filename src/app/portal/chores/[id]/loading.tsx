export default function ChoreDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 bg-ui-border rounded w-48" />

      {/* Chore detail card */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-ui-border rounded w-36" />
          <div className="h-6 bg-ui-border rounded-full w-20" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-4 bg-ui-border rounded w-24 flex-shrink-0" />
              <div className="h-4 bg-ui-border rounded w-40" />
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <div className="h-4 bg-ui-border rounded w-24" />
          <div className="h-16 bg-ui-border rounded" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <div className="h-11 bg-ui-border rounded w-32" />
        <div className="h-11 bg-ui-border rounded w-28" />
      </div>
    </div>
  )
}
