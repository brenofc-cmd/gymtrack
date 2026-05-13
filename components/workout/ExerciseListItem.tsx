import Image from 'next/image'
import Link from 'next/link'
import { Clock, Repeat } from 'lucide-react'
import type { WorkoutExerciseWithExercise } from '@/types/database'

interface ExerciseListItemProps {
  workoutExercise: WorkoutExerciseWithExercise
  lastWeight: number | null
  lastReps: number | null
}

export function ExerciseListItem({
  workoutExercise,
  lastWeight,
  lastReps,
}: ExerciseListItemProps) {
  const { exercise } = workoutExercise

  return (
    <Link
      href={`/exercicios/${exercise.id}`}
      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-card/80 active:scale-[0.98] transition-all"
    >
      {/* GIF thumbnail */}
      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
        {exercise.gif_url ? (
          <Image
            src={exercise.gif_url}
            alt={exercise.name_pt}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            💪
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight truncate">
          {exercise.name_pt}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Repeat className="w-3 h-3" />
            {workoutExercise.target_sets}×{workoutExercise.target_reps_min}
            {workoutExercise.target_reps_min !== workoutExercise.target_reps_max &&
              `-${workoutExercise.target_reps_max}`}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {workoutExercise.rest_seconds}s
          </span>
        </div>
        {lastWeight != null && (
          <p className="text-xs text-primary mt-1">
            Última: {lastWeight}kg × {lastReps}
          </p>
        )}
      </div>
    </Link>
  )
}
