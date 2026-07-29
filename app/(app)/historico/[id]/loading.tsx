import { Skeleton } from '@/components/ui/skeleton'

export default function HistoricoDetailLoading() {
  return (
    <div className="max-w-lg mx-auto pb-6">
      <div className="border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-28" />
          </div>
        </div>
      </div>
      <div className="px-4 pt-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="px-4 py-2 space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-6 w-full rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
