import { SkeletonText, SkeletonBox } from '@/components/ui/Skeleton'

export default function ReportLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <SkeletonText className="h-4 w-32" />
      <SkeletonText className="h-8 w-48" />
      <SkeletonText className="h-4 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <SkeletonBox className="h-24" />
        </div>
        <div className="card">
          <SkeletonBox className="h-24" />
        </div>
      </div>
    </div>
  )
}
