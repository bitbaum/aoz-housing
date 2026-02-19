import { SkeletonStats, SkeletonDashboardSection } from '@/components/ui/Skeleton'

export default function AnalyticsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <SkeletonStats count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonDashboardSection />
        <SkeletonDashboardSection />
      </div>
      <SkeletonDashboardSection />
    </div>
  )
}
