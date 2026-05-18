export default function PortalChoresLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 bg-ui-border rounded w-40" />
      <div className="h-4 bg-ui-border rounded w-56" />
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-5 bg-ui-border rounded w-32" />
              <div className="h-6 bg-ui-border rounded-full w-16" />
            </div>
            <div className="h-4 bg-ui-border rounded w-48" />
          </div>
        ))}
      </div>
    </div>
  )
}
