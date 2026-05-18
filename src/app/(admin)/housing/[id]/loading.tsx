import { SkeletonPageHeader, SkeletonTabs } from '@/components/ui/Skeleton'

export default function HousingDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <SkeletonPageHeader />
      <SkeletonTabs count={3} />
      <div className="card p-6 space-y-4">
        <div className="h-5 bg-ui-border rounded w-40" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="w-11 h-11 bg-ui-border rounded-md" />
          ))}
        </div>
      </div>
      <div className="card p-6 space-y-3">
        <div className="h-5 bg-ui-border rounded w-36" />
        <div className="h-4 bg-ui-border rounded w-full" />
        <div className="h-4 bg-ui-border rounded w-3/4" />
      </div>
    </div>
  )
}
