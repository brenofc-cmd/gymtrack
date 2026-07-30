import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getWorkoutWithExercises } from '@/lib/queries/workouts'
import { getLastSetLogForExercise } from '@/lib/queries/exercises'
import { getActiveSession } from '@/lib/queries/sessions'
import { ExerciseListItem } from '@/components/workout/ExerciseListItem'
import { StartWorkoutButton } from '@/components/workout/StartWorkoutButton'
import { WorkoutNotes } from '@/components/workout/WorkoutNotes'
import { DIA_LABEL } from '@/lib/routine/david-laid-public-dup-v5'
import { WorkoutFocusBadge, classifyDay } from '@/components/workout/WorkoutFocusBadge'
import { OptionalTreadmillCard } from '@/components/workout/OptionalTreadmillCard'
import { exerciseDetailHref } from '@/lib/navigation/exercise-detail'
import type { WorkoutLetter } from '@/types/database'

const VALID_LETTERS: WorkoutLetter[] = ['A', 'B', 'C', 'D', 'E', 'F']

export default async function TreinoPage(props: {
  params: Promise<{ letter: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { letter } = await props.params
  const { from } = await props.searchParams

  if (!VALID_LETTERS.includes(letter.toUpperCase() as WorkoutLetter)) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')


  const [workout, activeSession] = await Promise.all([
    getWorkoutWithExercises(supabase, user.id, letter.toUpperCase() as WorkoutLetter).catch(
      () => null
    ),
    getActiveSession(supabase, user.id).catch(() => null),
  ])

  if (!workout) notFound()

  // Últimos logs por exercício (continuidade via exercício de catálogo)
  const lastLogs = await Promise.all(
    workout.workout_exercises.map((we) =>
      getLastSetLogForExercise(supabase, we.id, undefined, {
        catalogExerciseId: we.exercise_id,
      })
    )
  )

  const dayLabel = workout.day_of_week != null ? DIA_LABEL[workout.day_of_week] : null
  // O detalhe pode ser aberto pelo painel ou pela lista. Nunca usamos o
  // histórico implícito do navegador: o destino explícito preserva o fluxo
  // "lista → conferir treino → voltar para começar".
  const backHref = from === 'dashboard' ? '/' : '/treinos'
  const workoutSource = from === 'dashboard' ? 'dashboard' : 'treinos'

  return (
    <div className="max-w-lg mx-auto pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href={backHref} aria-label="Voltar para treinos" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg leading-tight">{workout.name}</h1>
            <p className="text-sm text-muted-foreground truncate">
              Treino {workout.letter}
              {dayLabel ? ` · ${dayLabel}` : ''}
            </p>
          </div>
          {dayLabel && (
            <CalendarDays className="w-5 h-5 text-muted-foreground shrink-0" />
          )}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Classificação do dia + objetivo */}
        <div className="rounded-xl bg-card border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Objetivo do dia
            </p>
            <WorkoutFocusBadge
              classification={classifyDay(
                workout.session_focus,
                workout.workout_exercises.map((we) => ({ exercise_type: we.exercise.exercise_type }))
              )}
            />
          </div>
          {workout.objective && (
            <p className="mt-2 text-sm text-muted-foreground">{workout.objective}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">Divisão DUP pública associada a David Laid, conforme publicada pela Gymshark.</p>
        </div>

        {/* Notas */}
        {workout.notes && <WorkoutNotes notes={workout.notes} />}

        {/* Lista de exercícios */}
        <div className="space-y-2">
          {workout.workout_exercises.map((we, i) => {
            const lastLog = lastLogs[i]
            return (
              <ExerciseListItem
                key={we.id}
                workoutExercise={we}
                lastWeight={lastLog?.weight_kg ?? null}
                lastReps={lastLog?.reps ?? null}
                detailHref={exerciseDetailHref(we.exercise.id, {
                  workoutLetter: workout.letter as WorkoutLetter,
                  workoutSource,
                })}
              />
            )
          })}
        </div>

        <p className="text-xs text-center text-muted-foreground pb-2">
          {workout.workout_exercises.length} exercícios ·{' '}
          {workout.workout_exercises.reduce((s, we) => s + we.target_sets, 0)} séries válidas
        </p>

        <OptionalTreadmillCard workoutLetter={workout.letter as WorkoutLetter} />

        {/* Aquecimento */}
        {workout.warmup_note && (
          <p className="text-[11px] text-muted-foreground/80 text-center pb-2">
            {workout.warmup_note}
          </p>
        )}
      </div>

      <StartWorkoutButton
        workoutId={workout.id}
        workoutLetter={workout.letter ?? ''}
        activeSession={
          activeSession
            ? {
                id: activeSession.id,
                workoutId: activeSession.workout_id,
                workoutName: activeSession.workout?.name ?? 'Treino',
                startedAt: activeSession.started_at,
              }
            : null
        }
      />
    </div>
  )
}
