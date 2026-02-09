export default function HelpLoading() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse space-y-6">
      <div className="h-4 bg-gray-200 rounded w-32" />
      <div className="h-8 bg-gray-200 rounded w-32" />
      <div className="h-4 bg-gray-200 rounded w-72" />
      <div className="card space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-12 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  )
}
