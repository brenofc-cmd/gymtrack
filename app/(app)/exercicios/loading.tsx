import { Skeleton } from '@/components/ui/skeleton'

export default function ExerciciosLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-3">
      <Skeleton className="h-7 w-36 mb-6" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border p-4 flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
