interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden="true" className={`skeleton-shimmer rounded-lg ${className}`} />
}

export function TaskItemSkeleton() {
  return (
    <li className="surface-card flex items-center gap-3 p-4">
      <Skeleton className="h-5 w-5 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/5" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </li>
  )
}

export function TaskListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <TaskItemSkeleton key={i} />
      ))}
    </ul>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="surface-card p-6 space-y-3">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-2 w-full rounded-full mt-2" />
      </div>

      <Skeleton className="h-12 w-full rounded-xl" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="surface-card p-5 space-y-3">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-7 w-14" />
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        <Skeleton className="h-5 w-28" />
        <TaskListSkeleton count={3} />
      </div>
    </div>
  )
}

export function ProjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface-card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="max-w-5xl space-y-6">
      <Skeleton className="h-7 w-40" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-card p-5 space-y-3">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="surface-card p-6 h-64">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  )
}
