import Link from 'next/link'
import { Clock, Repeat, Star, Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExerciseAnimation } from '@/components/exercise/ExerciseAnimation'
import { MOVEMENT_PATTERN_LABEL } from '@/lib/routine/powerbuilding-dup-adaptado-v6'
import { formatPrescription, formatRir, formatRest } from '@/lib/training/prescription'
import { TrainingStimulusBadge } from '@/components/workout/TrainingStimulusBadge'
import type { WorkoutExerciseWithExercise } from '@/types/database'

interface ExerciseListItemProps {
  workoutExercise: WorkoutExerciseWithExercise
  lastWeight: number | null
  lastReps: number | null
  detailHref: string
}

export function ExerciseListItem({
  workoutExercise,
  lastWeight,
  lastReps,
  detailHref,
}: ExerciseListItemProps) {
  const { exercise } = workoutExercise

  const { is_priority } = workoutExercise

  return (
    <Link
      href={detailHref}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl bg-card border hover:bg-card/80 active:scale-[0.98] transition-all',
        is_priority ? 'border-amber-500/60' : 'border-border'
      )}
    >
      {/* Exercise thumbnail */}
      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
        <ExerciseAnimation
          name={exercise.name_pt}
          primaryMuscle={exercise.muscle_group}
          movementPattern={exercise.movement_pattern}
          mediaUrl={exercise.gif_url}
          compact
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-sm leading-tight truncate">
            {exercise.name_pt}
          </p>
          <TrainingStimulusBadge
            exercise={{ ...workoutExercise, exercise_type: exercise.exercise_type }}
          />
          {is_priority && (
            <Star className="w-3.5 h-3.5 text-amber-500 shrink-0 fill-amber-500" aria-label="Exercício prioritário" />
          )}
        </div>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Repeat className="w-3 h-3" />
            Prescrição bloqueada: {formatPrescription(workoutExercise, { perSide: exercise.is_unilateral })}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Gauge className="w-3 h-3" />
            RIR: {formatRir(workoutExercise.rir_min, workoutExercise.rir_max)}
          </span>
          {workoutExercise.superset_group != null && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              Superset {workoutExercise.superset_group}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Descanso: {formatRest(workoutExercise).label}
          </span>
          {exercise.exercise_type === 'abdominal' && exercise.movement_pattern && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              {MOVEMENT_PATTERN_LABEL[exercise.movement_pattern as keyof typeof MOVEMENT_PATTERN_LABEL] ?? exercise.movement_pattern}
            </span>
          )}
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
