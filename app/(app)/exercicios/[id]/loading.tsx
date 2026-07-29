import { Skeleton } from '@/components/ui/skeleton'

export default function ExercicioDetailLoading() {
  return (
    <div className="max-w-lg mx-auto pb-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <Skeleton className="h-5 w-48" />
        </div>
      </div>
      <Skeleton className="w-full aspect-square" />
      <div className="px-4 pt-4 space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
      </div>
    </div>
  )
}
