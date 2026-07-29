import { Skeleton } from '@/components/ui/skeleton'

export default function AnalisesLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-6">
      <Skeleton className="h-8 w-32" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>

      {/* Volume por semana */}
      <div className="rounded-2xl border border-border p-4 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-[180px] w-full rounded-lg" />
      </div>

      {/* Frequência */}
      <div className="rounded-2xl border border-border p-4 space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-[160px] w-full rounded-lg" />
      </div>

      {/* Grupos musculares */}
      <div className="rounded-2xl border border-border p-4 space-y-3">
        <Skeleton className="h-4 w-44" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
