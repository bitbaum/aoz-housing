import {
  SkeletonPageHeader,
  SkeletonStats,
  SkeletonTabs,
  SkeletonPlacementRow,
} from '@/components/ui/Skeleton'

export default function PlacementsLoading() {
  return (
    <div className="animate-pulse">
      <SkeletonPageHeader />
      <SkeletonStats count={4} />
      <SkeletonTabs count={3} />
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <SkeletonPlacementRow key={i} />
        ))}
      </div>
    </div>
  )
}
