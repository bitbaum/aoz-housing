export default function PortalHousingLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 bg-ui-border rounded w-52" />
      <div className="h-4 bg-ui-border rounded w-64" />

      {/* Housing unit cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="h-5 bg-ui-border rounded w-36" />
                <div className="h-4 bg-ui-border rounded w-48" />
              </div>
              <div className="h-6 bg-ui-border rounded-full w-20" />
            </div>
            <div className="flex gap-4">
              <div className="h-4 bg-ui-border rounded w-24" />
              <div className="h-4 bg-ui-border rounded w-24" />
            </div>
            <div className="h-11 bg-ui-border rounded w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}
