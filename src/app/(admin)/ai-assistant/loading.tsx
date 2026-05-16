export default function AIAssistantLoading() {
  return (
    <div className="animate-pulse space-y-6 h-full">
      <div className="h-8 bg-gray-200 rounded w-48" />

      {/* Chat area */}
      <div className="card p-4 space-y-4 min-h-96">
        {/* Assistant message bubble */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
          <div className="space-y-2 flex-1 max-w-md">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-4/5" />
            <div className="h-4 bg-gray-200 rounded w-3/5" />
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="flex gap-3">
        <div className="h-12 bg-gray-200 rounded flex-1" />
        <div className="h-12 w-20 bg-gray-200 rounded" />
      </div>
    </div>
  )
}
