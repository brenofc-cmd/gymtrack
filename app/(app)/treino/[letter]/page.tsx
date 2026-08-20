import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getWorkoutWithExercises } from '@/lib/queries/workouts'
import { getLastSetLogForExercise } from '@/lib/queries/exercises'
import { getActiveSession } from '@/lib/queries/sessions'
import { ExerciseListView } from '@/components/workout/ExerciseListView'
import { StartWorkoutButton } from '@/components/workout/StartWorkoutButton'
import { WorkoutNotes } from '@/components/workout/WorkoutNotes'
import {
  DIA_LABEL,
  effectiveTargetsForProgramWeek,
} from '@/lib/routine/powerbuilding-dup-adaptado-v6'
import { ROUTINE_VERSION as DAVID_LAID_VERSION, WORKOUT_LETTER_LABEL } from '@/lib/routine/david-laid-gymshark-exact-v7'
import { getActiveDupBlock } from '@/lib/queries/dup-program'
import { WorkoutFocusBadge, classifyDay } from '@/components/workout/WorkoutFocusBadge'
import { RoutineMethodInfo } from '@/components/workout/RoutineMethodInfo'
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


  const [workout, activeSession, activeBlock] = await Promise.all([
    getWorkoutWithExercises(supabase, user.id, letter.toUpperCase() as WorkoutLetter).catch(
      () => null
    ),
    getActiveSession(supabase, user.id).catch(() => null),
    getActiveDupBlock(supabase, user.id).catch(() => null),
  ])

  if (!workout) notFound()

  // A fase de 8 semanas da v6 (adaptação/progressão/consolidação/deload) só
  // pode se aplicar a treinos v6 — outra rotina compartilhando o mesmo
  // routine_version do bloco ativo (ex.: David Laid v7, também em bloco de 9
  // semanas) não pode ter séries/RIR reescritos por uma lógica pensada para
  // uma rotina diferente.
  if (workout.routine_version === 6 && activeBlock?.routine_version === workout.routine_version) {
    workout.workout_exercises = workout.workout_exercises.map((item) => ({
      ...item,
      ...effectiveTargetsForProgramWeek(
        item,
        item.exercise.exercise_type,
        activeBlock.week_number
      ),
    }))
  }

  // Últimos logs por exercício (continuidade via exercício de catálogo)
  const lastLogs = await Promise.all(
    workout.workout_exercises.map((we) =>
      getLastSetLogForExercise(supabase, we.id, undefined, {
        catalogExerciseId: we.exercise_id,
      })
    )
  )

  // day_of_week só tem sentido de "dia fixo da semana" na v6. Na rotina
  // David Laid a sequência A–F é contínua (ver lib/training/schedule.ts) e
  // não está presa a um dia específico, então não rotulamos por dia aqui.
  const dayLabel = workout.routine_version === 6 && workout.day_of_week != null
    ? DIA_LABEL[workout.day_of_week]
    : null
  const isDavidLaid = workout.routine_version === DAVID_LAID_VERSION
  const subtitleSuffix = dayLabel ?? (isDavidLaid ? WORKOUT_LETTER_LABEL[workout.letter as WorkoutLetter] : null)
  // O detalhe pode ser aberto pelo painel ou pela lista. Nunca usamos o
  // histórico implícito do navegador: o destino explícito preserva o fluxo
  // "lista → conferir treino → voltar para começar".
  const backHref = from === 'dashboard' ? '/' : '/treinos'
  const workoutSource = from === 'dashboard' ? 'dashboard' : 'treinos'

  return (
    <div className="gt-light min-h-dvh max-w-lg mx-auto pb-28 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 rounded-b-[28px] bg-background/95 backdrop-blur-sm shadow-[0_8px_24px_rgba(0,0,0,.14)]">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href={backHref} aria-label="Voltar para treinos" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg leading-tight">{workout.name}</h1>
            <p className="text-sm text-muted-foreground truncate">
              {workout.letter}
              {subtitleSuffix ? ` · ${subtitleSuffix}` : ''}
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
          {workout.routine_version === 6 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Powerbuilding DUP Adaptado — 8 semanas. Inspirado em powerbuilding,
              sem testes máximos e ajustado para recuperação e técnica.
            </p>
          )}
          <RoutineMethodInfo
            routineVersion={workout.routine_version}
            exercises={workout.workout_exercises.map((we) => ({
              prescription_type: we.prescription_type,
              target_reps_min: we.target_reps_min,
              target_reps_max: we.target_reps_max,
            }))}
            className="mt-3"
          />
        </div>

        {/* Notas */}
        {workout.notes && <WorkoutNotes notes={workout.notes} />}

        {/* Lista de exercícios */}
        <ExerciseListView
          items={workout.workout_exercises.map((we, i) => ({
            workoutExercise: we,
            lastWeight: lastLogs[i]?.weight_kg ?? null,
            lastReps: lastLogs[i]?.reps ?? null,
            detailHref: exerciseDetailHref(we.exercise.id, {
              workoutLetter: workout.letter as WorkoutLetter,
              workoutSource,
            }),
          }))}
          totalSets={workout.workout_exercises.reduce((s, we) => s + we.target_sets, 0)}
        />

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
