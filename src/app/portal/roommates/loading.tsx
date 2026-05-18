export default function RoommatesLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 bg-ui-border rounded w-32" />
      <div className="h-8 bg-ui-border rounded w-48" />
      <div className="h-4 bg-ui-border rounded w-64" />
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="card">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-ui-border rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-ui-border rounded w-24" />
                <div className="h-4 bg-ui-border rounded w-16" />
                <div className="flex gap-2">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-6 bg-ui-border rounded-full w-20" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
