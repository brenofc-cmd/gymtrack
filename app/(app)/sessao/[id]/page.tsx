import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSessionWithLogs } from '@/lib/queries/sessions'
import { getWorkoutById } from '@/lib/queries/workouts'
import {
  getLastSessionSets,
  getExercisePR,
  getExerciseProgressHistory,
} from '@/lib/queries/exercises'
import { suggestForExercise } from '@/lib/progression/progression'
import { getLoadInputConfig } from '@/lib/training/load-input'
import type { ExerciseType, MovementPattern } from '@/types/database'
import type { ExecutionQuality, PainLevel } from '@/types/database'
import { adjustProgressionForReadiness, type ReadinessStatus } from '@/lib/training/readiness'
import { adjustTargetsForPhase, normalizeTrainingPhase, phaseAllowsTopSets } from '@/lib/training/phase'
import { SessionClient } from './SessionClient'

export default async function SessaoPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')


  const sessionData = await getSessionWithLogs(supabase, id).catch(() => null)
  if (!sessionData || sessionData.user_id !== user.id) notFound()

  if (sessionData.finished_at || sessionData.cancelled_at) {
    // Sessão encerrada (concluída ou cancelada logicamente): só leitura no histórico.
    redirect(`/historico/${id}`)
  }

  const workoutData = await getWorkoutById(supabase, sessionData.workout_id).catch(
    () => null
  )
  if (!workoutData) notFound()

  const [previousResults, prWeights, exerciseHistories, readiness, preferences, profileRow] = await Promise.all([
    Promise.all(
      workoutData.workout_exercises.map(async (we) => {
        const lastSets = await getLastSessionSets(supabase, we.exercise_id, user.id, id)
        const loadConfig = getLoadInputConfig(we.exercise, we.notes)
        const suggestion = lastSets.length === 0
          ? null
          : suggestForExercise(
              {
                sets: we.target_sets,
                repsMin: we.target_reps_min,
                repsMax: we.target_reps_max,
                rirMin: we.rir_min,
                rirMax: we.rir_max,
                kind: (we.exercise.exercise_type as ExerciseType | null),
                movementPattern: (we.exercise.movement_pattern as MovementPattern | null),
                loadDirection: loadConfig.lowerIsHarder
                  ? 'lower_is_harder'
                  : 'higher_is_harder',
              },
              lastSets.map((s) => ({
                weightKg: s.weight_kg,
                reps: s.reps,
                rir: s.rir,
                isWarmup: s.is_warmup,
                painLevel: (s.pain_level as PainLevel | null) ?? null,
                executionQuality: (s.execution_quality as ExecutionQuality | null) ?? null,
              }))
            )
        return { sets: lastSets, suggestion }
      })
    ),
    Promise.all(
      workoutData.workout_exercises.map((we) => {
        const loadConfig = getLoadInputConfig(we.exercise, we.notes)
        return getExercisePR(supabase, we.exercise_id, user.id, {
          lowerIsHarder: loadConfig.lowerIsHarder,
        }).then((pr) => pr?.maxWeight ?? null)
      })
    ),
    Promise.all(
      workoutData.workout_exercises.map((we) =>
        getExerciseProgressHistory(supabase, we.exercise_id, user.id, 8)
      )
    ),
    supabase
      .from('daily_readiness')
      .select('recommendation')
      .eq('user_id', user.id)
      .eq('readiness_date', new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date()))
      .maybeSingle(),
    supabase
      .from('user_preferences')
      .select('*')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('user_profiles')
      .select('training_phase')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  // Fase de treinamento (P0.3): camada de prescrição aplicada na leitura da
  // sessão — a rotina v4 e o banco não mudam. Em 'fundamentals' o top set/
  // back-off vira série reta conservadora e o RIR ganha um piso mais alto
  // (compostos 3, isoladores 2–3), priorizando execução sobre proximidade
  // da falha. O ajuste só ELEVA o RIR, nunca deixa a sessão mais agressiva.
  const trainingPhase = normalizeTrainingPhase(profileRow.data?.training_phase)
  const hasTopSetExercises = workoutData.workout_exercises.some((we) => we.top_set_enabled)
  const rirRaisedByPhase = workoutData.workout_exercises.some(
    (we) => adjustTargetsForPhase(we, trainingPhase, we.exercise.exercise_type).rir_min !== we.rir_min
  )
  workoutData.workout_exercises = workoutData.workout_exercises.map((we) => {
    const adjusted = adjustTargetsForPhase(we, trainingPhase, we.exercise.exercise_type)
    return phaseAllowsTopSets(trainingPhase) || !adjusted.top_set_enabled
      ? adjusted
      : { ...adjusted, top_set_enabled: false }
  })

  const readinessStatus = (readiness.data?.recommendation as ReadinessStatus | undefined) ?? 'ready'
  const adjustedProgressions = previousResults.map(({ suggestion }) =>
    adjustProgressionForReadiness(suggestion, readinessStatus)
  )

  return (
    <SessionClient
      session={sessionData}
      workout={workoutData}
      previousSets={previousResults.map(({ sets }) => sets)}
      prWeights={prWeights}
      progressions={adjustedProgressions}
      exerciseHistories={exerciseHistories}
      readinessStatus={readinessStatus}
      keepScreenAwake={preferences.data?.keep_screen_awake ?? true}
      straightSetsNotice={!phaseAllowsTopSets(trainingPhase) && (hasTopSetExercises || rirRaisedByPhase)}
    />
  )
}
