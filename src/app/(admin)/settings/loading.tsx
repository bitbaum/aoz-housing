import { SkeletonRowList } from '@/components/ui/Skeleton'

export default function SettingsLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-8 bg-ui-border rounded w-40" />

      {/* Invite form section */}
      <div className="card p-6 space-y-4">
        <div className="h-5 bg-ui-border rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-10 bg-ui-border rounded" />
          <div className="h-10 bg-ui-border rounded" />
        </div>
        <div className="h-10 bg-ui-border rounded w-40" />
      </div>

      {/* Team list */}
      <div className="card p-6 space-y-4">
        <div className="h-5 bg-ui-border rounded w-24" />
        <SkeletonRowList count={4} />
      </div>

      {/* Email config */}
      <div className="card p-6 space-y-4">
        <div className="h-5 bg-ui-border rounded w-44" />
        <div className="space-y-2">
          <div className="h-4 bg-ui-border rounded w-full" />
          <div className="h-4 bg-ui-border rounded w-3/4" />
        </div>
      </div>
    </div>
  )
}
