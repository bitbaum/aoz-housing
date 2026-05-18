export default function PreferencesLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 bg-ui-border rounded w-32" />
      <div className="h-8 bg-ui-border rounded w-48" />
      <div className="h-4 bg-ui-border rounded w-64" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="card space-y-4">
          <div className="h-6 bg-ui-border rounded w-32" />
          <div className="h-10 bg-ui-border rounded" />
          <div className="h-10 bg-ui-border rounded" />
        </div>
      ))}
    </div>
  )
}
