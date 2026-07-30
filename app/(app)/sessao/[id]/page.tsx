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
import { localDateISO } from '@/lib/utils/local-date'
import { ROUTINE_VERSION } from '@/lib/routine/david-laid-public-dup-v5'
import { getReferenceMaxes } from '@/lib/queries/dup-program'
import {
  recommendGymTrackLoad,
  type AttemptResult,
} from '@/lib/training/dup-progression'
import { SessionClient } from './SessionClient'
import { getDeloadContext } from '@/lib/queries/deload'

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

  const { data: savedChoices } = sessionData.program_block_id
    ? await supabase
        .from('block_exercise_choices')
        .select('workout_exercise_id,selected_exercise_id')
        .eq('block_id', sessionData.program_block_id)
    : { data: [] }

  // ORDEM OBRIGATÓRIA (bug P0 da auditoria 10/10): a fase precisa ser
  // carregada e aplicada ANTES de calcular a progressão. Antes desta correção
  // a sugestão era avaliada contra o RIR bruto da rotina (ex.: 2) enquanto a
  // sessão era prescrita com o RIR efetivo da fase (ex.: 3 em Fundamentos) —
  // o app podia sugerir aumentar carga com base num alvo que ele mesmo não
  // estava pedindo.
  //  1. rotina-base (workoutData) → 2. training_phase → 3. alvos efetivos
  //  → 4. progressão sobre os alvos efetivos → 5. exibição.
  const [profileRow, preferences] = await Promise.all([
    supabase.from('user_profiles').select('training_phase').eq('id', user.id).maybeSingle(),
    supabase.from('user_preferences').select('*').eq('id', user.id).maybeSingle(),
  ])

  const trainingPhase = normalizeTrainingPhase(profileRow.data?.training_phase)
  const usesLockedPublicDup = workoutData.routine_version === ROUTINE_VERSION
  const hasTopSetExercises = workoutData.workout_exercises.some((we) => we.top_set_enabled)
  const rirRaisedByPhase = workoutData.workout_exercises.some(
    (we) => adjustTargetsForPhase(we, trainingPhase, we.exercise.exercise_type).rir_min !== we.rir_min
  )
  // Prescrição efetiva: em 'fundamentals' o top set vira série reta e o RIR
  // ganha piso mais alto. A prescrição pública v5 e o banco não são alterados.
  workoutData.workout_exercises = workoutData.workout_exercises.map((we) => {
    if (usesLockedPublicDup) return we
    const adjusted = adjustTargetsForPhase(we, trainingPhase, we.exercise.exercise_type)
    return phaseAllowsTopSets(trainingPhase) || !adjusted.top_set_enabled
      ? adjusted
      : { ...adjusted, top_set_enabled: false }
  })

  const [previousResults, prWeights, exerciseHistories, readiness, referenceMaxes, deloadContext] = await Promise.all([
    Promise.all(
      // `we` aqui já é o exercício com os alvos EFETIVOS da fase.
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
                prescriptionType: we.prescription_type,
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
      .eq('readiness_date', localDateISO())
      .maybeSingle(),
    getReferenceMaxes(supabase, user.id).catch(() => []),
    getDeloadContext(supabase, user.id).catch(() => ({ pending: null, active: null, suggestion: null })),
  ])

  const readinessStatus = (readiness.data?.recommendation as ReadinessStatus | undefined) ?? 'ready'
  const adjustedProgressions = previousResults.map(({ suggestion }) =>
    adjustProgressionForReadiness(suggestion, readinessStatus)
  )
  const maxByExercise = new Map(referenceMaxes.map((item) => [item.exercise_id, item]))
  const recommendedLoads = workoutData.workout_exercises.map((we, index) => {
    const previous = previousResults[index]?.sets.filter((set) => !set.is_warmup) ?? []
    const last = previous[0]
    const max = maxByExercise.get(we.exercise_id)
    const config = getLoadInputConfig(we.exercise, we.notes)
    return recommendGymTrackLoad({
      trainingMax: max?.training_max ?? null,
      targetReps: we.rep_max_target ?? we.target_reps_min,
      targetRir: we.rir_min ?? 1,
      incrementKg: we.exercise.min_increment_kg ?? config.incrementKg ?? 1,
      readiness: deloadContext.active ? 'low_recovery' : readinessStatus,
      previousWeightKg: last?.weight_kg ?? null,
      previousAttempt: (last?.attempt_result as AttemptResult | null | undefined) ?? null,
      recentFailures: previous.filter((set) =>
        set.attempt_result === 'technical_failure' || set.attempt_result === 'strength_failure'
      ).length,
      pain: previous.some((set) => set.pain_level === 'moderada' || set.pain_level === 'forte'),
      executionQuality: (last?.execution_quality as ExecutionQuality | null | undefined) ?? null,
      prescriptionType: (we.prescription_type ?? 'fixed_reps') as 'fixed_reps' | 'rep_range' | 'rep_max_effort',
    })
  })

  return (
    <SessionClient
      session={sessionData}
      workout={workoutData}
      previousSets={previousResults.map(({ sets }) => sets)}
      prWeights={prWeights}
      progressions={adjustedProgressions}
      recommendedLoads={recommendedLoads}
      exerciseHistories={exerciseHistories}
      readinessStatus={readinessStatus}
      keepScreenAwake={preferences.data?.keep_screen_awake ?? true}
      straightSetsNotice={!phaseAllowsTopSets(trainingPhase) && (hasTopSetExercises || rirRaisedByPhase)}
      blockChoices={Object.fromEntries(
        (savedChoices ?? []).map((choice) => [choice.workout_exercise_id, choice.selected_exercise_id])
      )}
      isDeload={deloadContext.active != null}
    />
  )
}
