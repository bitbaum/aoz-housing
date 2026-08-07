import { SkeletonPageHeader } from '@/components/ui/Skeleton'

export default function MatchingLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <SkeletonPageHeader />
      <div className="card p-6 space-y-4">
        <div className="h-5 bg-ui-border rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-ui-border rounded-md" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-ui-border rounded w-20" />
                  <div className="h-4 bg-ui-border rounded w-32" />
                </div>
                <div className="h-10 w-10 bg-ui-border rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
