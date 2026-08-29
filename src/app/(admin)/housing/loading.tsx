import { SkeletonPageHeader, SkeletonStats, SkeletonCardGrid } from '@/components/ui/Skeleton'

export default function HousingLoading() {
  return (
    <div className="animate-pulse">
      <SkeletonPageHeader />
      <SkeletonStats count={4} />
      <SkeletonCardGrid count={6} />
    </div>
  )
}
