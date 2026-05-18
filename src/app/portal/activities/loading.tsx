export default function ActivitiesLoading() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-4 bg-ui-border rounded w-32" />
        <div className="h-8 bg-ui-border rounded w-56" />
        <div className="h-4 bg-ui-border rounded w-72" />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {[80, 110, 95, 120, 90].map((w, i) => (
          <div key={i} className="h-9 bg-ui-border rounded-full" style={{ width: w }} />
        ))}
      </div>

      {/* Activity cards */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 bg-ui-border rounded w-40" />
              <div className="h-5 bg-ui-border rounded-full w-16" />
            </div>
            <div className="h-4 bg-ui-border rounded w-full" />
            <div className="h-4 bg-ui-border rounded w-3/4" />
            <div className="flex gap-4">
              <div className="h-3 bg-ui-border rounded w-24" />
              <div className="h-3 bg-ui-border rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
