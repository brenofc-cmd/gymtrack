import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionWithLogs } from '@/lib/queries/sessions'
import { getWorkoutById } from '@/lib/queries/workouts'
import {
  getLastSetLogForExercise,
  getLastSessionSets,
  getExercisePR,
  getExerciseProgressHistory,
} from '@/lib/queries/exercises'
import { suggestForExercise } from '@/lib/progression/progression'
import type { ExerciseType, MovementPattern } from '@/types/database'
import type { ExecutionQuality, PainLevel } from '@/types/database'
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

  const admin = createAdminClient()

  const sessionData = await getSessionWithLogs(admin, id).catch(() => null)
  if (!sessionData || sessionData.user_id !== user.id) notFound()

  if (sessionData.finished_at) {
    redirect(`/historico/${id}`)
  }

  const workoutData = await getWorkoutById(admin, sessionData.workout_id).catch(
    () => null
  )
  if (!workoutData) notFound()

  const [lastLogs, prWeights, progressions, exerciseHistories] = await Promise.all([
    Promise.all(
      workoutData.workout_exercises.map((we) =>
        getLastSetLogForExercise(admin, we.id, id, {
          catalogExerciseId: we.exercise_id,
        })
      )
    ),
    Promise.all(
      workoutData.workout_exercises.map((we) =>
        getExercisePR(admin, we.exercise_id, user.id).then((pr) => pr?.maxWeight ?? null)
      )
    ),
    Promise.all(
      workoutData.workout_exercises.map(async (we) => {
        const lastSets = await getLastSessionSets(admin, we.exercise_id, user.id, id)
        if (lastSets.length === 0) return null
        return suggestForExercise(
          {
            sets: we.target_sets,
            repsMin: we.target_reps_min,
            repsMax: we.target_reps_max,
            rirMin: we.rir_min,
            rirMax: we.rir_max,
            kind: (we.exercise.exercise_type as ExerciseType | null),
            movementPattern: (we.exercise.movement_pattern as MovementPattern | null),
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
      })
    ),
    Promise.all(
      workoutData.workout_exercises.map((we) =>
        getExerciseProgressHistory(admin, we.exercise_id, user.id, 8)
      )
    ),
  ])

  return (
    <SessionClient
      session={sessionData}
      workout={workoutData}
      lastLogs={lastLogs}
      prWeights={prWeights}
      progressions={progressions}
      exerciseHistories={exerciseHistories}
    />
  )
}
