import {
  SkeletonPageHeader,
  SkeletonStats,
  SkeletonTabs,
  SkeletonRowList,
} from '@/components/ui/Skeleton'

export default function MaintenanceLoading() {
  return (
    <div className="animate-pulse">
      <SkeletonPageHeader />
      <SkeletonStats count={4} />
      <SkeletonTabs count={5} />
      <SkeletonRowList count={5} />
    </div>
  )
}
