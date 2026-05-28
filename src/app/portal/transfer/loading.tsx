import { SkeletonText } from '@/components/ui/Skeleton'

export default function TransferLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonText className="h-4 w-32" />
        <SkeletonText className="h-8 w-48" />
        <SkeletonText className="h-4 w-64" />
      </div>

      {/* Form card */}
      <div className="card space-y-6">
        {/* Current unit info */}
        <div className="p-3 bg-ui-subtle rounded-lg space-y-1.5">
          <SkeletonText className="h-3 w-28" />
          <SkeletonText className="h-5 w-48" />
        </div>

        {/* Reason textarea */}
        <div className="space-y-2">
          <SkeletonText className="h-4 w-40" />
          <SkeletonText className="h-28 w-full rounded-lg" />
        </div>

        {/* Target unit select */}
        <div className="space-y-2">
          <SkeletonText className="h-4 w-48" />
          <SkeletonText className="h-11 w-full rounded-lg" />
        </div>

        {/* Submit button */}
        <SkeletonText className="h-11 w-full rounded-md" />
      </div>
    </div>
  )
}
