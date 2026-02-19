import { SkeletonPageHeader, SkeletonStats, SkeletonRowList } from '@/components/ui/Skeleton'

export default function ChoresLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <SkeletonPageHeader />
      <SkeletonStats count={3} />
      <SkeletonRowList count={4} />
    </div>
  )
}
