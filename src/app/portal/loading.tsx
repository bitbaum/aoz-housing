import { SkeletonText, SkeletonBox } from '@/components/ui/Skeleton'

export default function PortalLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <SkeletonText className="h-8 w-48" />
      <SkeletonText className="h-4 w-64" />
      <div className="card">
        <SkeletonBox className="h-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card">
            <SkeletonBox className="h-28" />
          </div>
        ))}
      </div>
    </div>
  )
}
