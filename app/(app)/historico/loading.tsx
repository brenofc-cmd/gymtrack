import { Skeleton } from '@/components/ui/skeleton'

export default function HistoricoLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-3">
      <Skeleton className="h-7 w-40 mb-6" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
