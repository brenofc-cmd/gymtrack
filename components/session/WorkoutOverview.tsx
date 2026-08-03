'use client'

import { Check, Clock, Dumbbell, ListChecks } from 'lucide-react'
import { ExerciseAnimation } from '@/components/exercise/ExerciseAnimation'
import { OptionalTreadmillCard } from '@/components/workout/OptionalTreadmillCard'
import { RoutineMethodInfo } from '@/components/workout/RoutineMethodInfo'
import { TrainingStimulusBadge } from '@/components/workout/TrainingStimulusBadge'
import { formatRest } from '@/lib/training/prescription'
import type { LocalSetLog } from '@/lib/store/sessionStore'
import type { WorkoutExerciseWithExercise, WorkoutLetter } from '@/types/database'

type WorkoutOverviewProps = {
  exercises: WorkoutExerciseWithExercise[]
  sets: Record<string, LocalSetLog[]>
  skippedExerciseIds: string[]
  workoutLetter: WorkoutLetter
  routineVersion?: number | null
  onOpenExercise: (index: number) => void
}

export function WorkoutOverview({ exercises, sets, skippedExerciseIds, workoutLetter, routineVersion, onOpenExercise }: WorkoutOverviewProps) {
  return (
    <main className="mx-auto w-full max-w-3xl px-3 pb-32 pt-4 sm:px-4">
      <div className="mb-4 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card px-4 py-4 shadow-[0_12px_32px_rgba(0,0,0,.16)]">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <ListChecks className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="metric-label text-primary">Visão geral</p>
            <h1 className="mt-1 text-xl font-extrabold">Exercícios do treino</h1>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Toque em um exercício para registrar as séries. O progresso fica salvo automaticamente.</p>
          </div>
        </div>
      </div>

      <RoutineMethodInfo routineVersion={routineVersion} exercises={exercises} className="mb-3" />

      <ol className="space-y-2.5">
        {exercises.map((item, index) => {
          const completed = (sets[item.id] ?? []).filter((set) => !set.is_warmup).length
          const done = completed >= item.target_sets
          const skipped = skippedExerciseIds.includes(item.id)
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onOpenExercise(index)}
                className="flex min-h-[84px] w-full items-center gap-3 rounded-2xl border border-border bg-card p-2.5 text-left shadow-[0_3px_12px_rgba(0,0,0,.1)] transition-all hover:border-primary/35 active:scale-[0.99]"
              >
                <div className="relative size-[62px] shrink-0 overflow-hidden rounded-xl bg-secondary">
                  <ExerciseAnimation
                    name={item.exercise.name_pt}
                    primaryMuscle={item.exercise.muscle_group}
                    movementPattern={item.exercise.movement_pattern}
                    mediaUrl={item.exercise.gif_url}
                    compact
                  />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="block min-w-0 truncate text-sm font-extrabold">{index + 1}. {item.exercise.name_pt}</span>
                    <TrainingStimulusBadge
                      exercise={{ ...item, exercise_type: item.exercise.exercise_type }}
                    />
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Dumbbell className="size-3" />{completed}/{item.target_sets} séries</span>
                    <span className="inline-flex items-center gap-1"><Clock className="size-3" />{formatRest(item).label}</span>
                    {item.superset_group != null && (
                      <span className="font-semibold text-primary">Superset {item.superset_group}</span>
                    )}
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold text-primary">{skipped ? 'Pulado' : done ? 'Concluído' : 'Toque para começar'}</span>
                </span>
                <span
                  role="switch"
                  aria-checked={done}
                  aria-label={`${item.exercise.name_pt}: ${done ? 'concluído' : 'pendente'}`}
                  className={`relative flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${done ? 'bg-primary' : 'bg-secondary'}`}
                >
                  <span className={`grid size-5 place-items-center rounded-full bg-white text-primary transition-transform ${done ? 'translate-x-5' : 'translate-x-0'}`}>
                    {done && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      <div className="mt-4">
        <OptionalTreadmillCard workoutLetter={workoutLetter} compact />
      </div>
    </main>
  )
}
