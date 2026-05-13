import { Skeleton } from '@/components/ui/skeleton'

export default function SessaoLoading() {
  return (
    <div className="max-w-lg mx-auto pb-28">
      <div className="border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3.5 w-20" />
          </div>
          <Skeleton className="h-9 w-24 rounded-lg shrink-0" />
        </div>
      </div>
      <div className="px-4 pt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
