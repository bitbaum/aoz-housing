/**
 * Reusable skeleton loading primitives for content-aware loading states.
 * Used by loading.tsx files across admin and portal pages.
 */

function Box({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 rounded ${className}`} />
}

function Circle({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 rounded-full ${className}`} />
}

/** Skeleton for a StatCard (used in all list page headers) */
export function SkeletonStatCard() {
  return (
    <div className="card p-4 space-y-2">
      <Box className="h-4 w-16" />
      <Box className="h-7 w-12" />
    </div>
  )
}

/** Row of 4 stat cards matching the common list page layout */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-${count} gap-3 sm:gap-4 mb-6 sm:mb-8`}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  )
}

/** Page header with title and action button */
export function SkeletonPageHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      <Box className="h-8 w-40" />
      <Box className="h-10 w-32 rounded-md" />
    </div>
  )
}

/** Tab bar skeleton */
export function SkeletonTabs({ count = 3 }: { count?: number }) {
  return (
    <div className="mb-6">
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {Array.from({ length: count }, (_, i) => (
          <Box key={i} className="h-8 w-20" />
        ))}
      </div>
    </div>
  )
}

/** Card-style list row (used for residents, housing) */
export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Circle className="w-10 h-10" />
        <div className="space-y-2 flex-1">
          <Box className="h-5 w-24" />
          <Box className="h-4 w-32" />
        </div>
        <Box className="h-6 w-16 rounded-full" />
      </div>
      <Box className="h-4 w-48" />
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <Box className="h-3 w-28" />
        <Box className="h-3 w-16" />
      </div>
    </div>
  )
}

/** Grid of cards (residents, housing) */
export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

/** Row-style list item (used for incidents, placements, maintenance) */
export function SkeletonRow() {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Box className="w-8 h-8 rounded" />
          <div className="space-y-2">
            <Box className="h-5 w-40" />
            <Box className="h-4 w-64" />
            <div className="flex gap-4">
              <Box className="h-4 w-20" />
              <Box className="h-4 w-16" />
              <Box className="h-4 w-24" />
            </div>
          </div>
        </div>
        <Box className="h-6 w-16 rounded-full" />
      </div>
    </div>
  )
}

/** List of row items */
export function SkeletonRowList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

/** Placement row with two-side layout */
export function SkeletonPlacementRow() {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Circle className="w-10 h-10" />
          <div className="space-y-1">
            <Box className="h-5 w-20" />
            <Box className="h-3 w-16" />
          </div>
          <Box className="h-4 w-4" />
          <div className="space-y-1">
            <Box className="h-5 w-24" />
            <Box className="h-3 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="space-y-1 text-right">
            <Box className="h-3 w-12" />
            <Box className="h-5 w-16" />
          </div>
          <Box className="h-6 w-16 rounded-full" />
        </div>
      </div>
      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
        <Box className="h-3 w-28" />
        <Box className="h-3 w-28" />
      </div>
    </div>
  )
}

/** Dashboard section card */
export function SkeletonDashboardSection() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Box className="h-5 w-32" />
        <Box className="h-5 w-5 rounded" />
      </div>
      <div className="space-y-2">
        <Box className="h-4 w-full" />
        <Box className="h-4 w-3/4" />
        <Box className="h-4 w-1/2" />
      </div>
    </div>
  )
}
