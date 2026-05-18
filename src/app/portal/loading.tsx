export default function PortalLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-ui-border rounded w-48" />
      <div className="h-4 bg-ui-border rounded w-64" />
      <div className="card">
        <div className="h-32 bg-ui-border rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="card h-28 bg-ui-border rounded" />
        ))}
      </div>
    </div>
  )
}
