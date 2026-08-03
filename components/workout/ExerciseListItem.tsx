import Link from 'next/link'
import { Star } from 'lucide-react'
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
  /** Modo detalhado exibe a grade de estatísticas (séries/RIR/descanso); compacto mostra só o essencial. */
  detailed: boolean
}

export function ExerciseListItem({
  workoutExercise,
  lastWeight,
  lastReps,
  detailHref,
  detailed,
}: ExerciseListItemProps) {
  const { exercise, is_priority } = workoutExercise
  const rest = formatRest(workoutExercise)

  return (
    <Link
      href={detailHref}
      className={cn(
        'block rounded-2xl bg-card border p-3 shadow-sm hover:bg-card/80 active:scale-[0.98] transition-all',
        is_priority ? 'border-amber-500/60' : 'border-border'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Exercise thumbnail */}
        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
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
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {formatPrescription(workoutExercise, { perSide: exercise.is_unilateral })} ·{' '}
            {rest.isAppSuggested ? 'descanso não especificado' : `descanso ${rest.label}`}
            {workoutExercise.superset_group != null ? ` · Superset ${workoutExercise.superset_group}` : ''}
          </p>
          {lastWeight != null && (
            <p className="text-xs text-primary mt-1">
              Última: {lastWeight}kg × {lastReps}
            </p>
          )}
        </div>
      </div>

      {detailed && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="rounded-xl bg-secondary/60 px-3 py-2">
            <div className="metric-label">Séries</div>
            <div className="text-sm font-bold mt-0.5">{workoutExercise.target_sets}</div>
          </div>
          <div className="rounded-xl bg-secondary/60 px-3 py-2">
            <div className="metric-label">Repetições</div>
            <div className="text-sm font-bold mt-0.5">
              {formatPrescription(workoutExercise, { perSide: exercise.is_unilateral })}
            </div>
          </div>
          <div className="rounded-xl bg-secondary/60 px-3 py-2">
            <div className="metric-label">RIR</div>
            <div className="text-sm font-bold mt-0.5">
              {formatRir(workoutExercise.rir_min, workoutExercise.rir_max)}
            </div>
          </div>
          <div className="rounded-xl bg-secondary/60 px-3 py-2">
            <div className="metric-label">Descanso</div>
            <div className="text-sm font-bold mt-0.5">
              {rest.isAppSuggested ? '—' : rest.label}
            </div>
          </div>
          {exercise.exercise_type === 'abdominal' && exercise.movement_pattern && (
            <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 w-fit">
              {MOVEMENT_PATTERN_LABEL[exercise.movement_pattern as keyof typeof MOVEMENT_PATTERN_LABEL] ?? exercise.movement_pattern}
            </div>
          )}
        </div>
      )}
    </Link>
  )
}
