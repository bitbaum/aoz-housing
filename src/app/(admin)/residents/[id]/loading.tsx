import { SkeletonPageHeader, SkeletonTabs } from '@/components/ui/Skeleton'

export default function ResidentDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <SkeletonPageHeader />
      <SkeletonTabs count={4} />
      <div className="card p-6 space-y-4">
        <div className="h-5 bg-ui-border rounded w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 bg-ui-border rounded w-20" />
              <div className="h-5 bg-ui-border rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
