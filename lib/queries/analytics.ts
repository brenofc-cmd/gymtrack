import { startOfWeek, subWeeks, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { aggregateExecutedVolume, type ExecutedSetLog } from '@/lib/training/executed-volume'
import {
  aggregatePlannedIndirect,
  aggregatePlannedVolume,
  type PlannedExerciseRow,
} from '@/lib/training/planned-volume'

type SupabaseDB = SupabaseClient<Database>

export async function getWeeklyVolume(
  supabase: SupabaseDB,
  userId: string,
  weeks = 12
): Promise<Array<{ week: string; volumeKg: number }>> {
  const since = startOfWeek(subWeeks(new Date(), weeks - 1), { weekStartsOn: 1 })

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id, started_at')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .gte('started_at', since.toISOString())

  const sessionMap = new Map<string, string>()
  for (const s of (sessions ?? []) as Array<{ id: string; started_at: string }>) {
    const weekKey = format(
      startOfWeek(new Date(s.started_at), { weekStartsOn: 1 }),
      'yyyy-MM-dd'
    )
    sessionMap.set(s.id, weekKey)
  }

  const sessionIds = Array.from(sessionMap.keys())
  const volumeByWeek = new Map<string, number>()

  if (sessionIds.length > 0) {
    const { data: logs } = await supabase
      .from('set_logs')
      .select('session_id, weight_kg, reps')
      .in('session_id', sessionIds)
      .eq('is_warmup', false)
      .eq('is_deload', false)

    for (const log of (logs ?? []) as Array<{
      session_id: string
      weight_kg: number | null
      reps: number
    }>) {
      const weekKey = sessionMap.get(log.session_id)
      if (!weekKey) continue
      volumeByWeek.set(
        weekKey,
        (volumeByWeek.get(weekKey) ?? 0) + (log.weight_kg ?? 0) * log.reps
      )
    }
  }

  const result: Array<{ week: string; volumeKg: number }> = []
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 })
    const key = format(weekStart, 'yyyy-MM-dd')
    result.push({
      week: format(weekStart, 'dd/MM', { locale: ptBR }),
      volumeKg: Math.round(volumeByWeek.get(key) ?? 0),
    })
  }
  return result
}

export async function getExecutedWeeklyVolumeByMuscle(
  supabase: SupabaseDB,
  userId: string
): Promise<Record<string, number>> {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('user_id', userId)
    .is('cancelled_at', null)
    .gte('started_at', weekStart.toISOString())

  const sessionIds = ((sessions ?? []) as Array<{ id: string }>).map((s) => s.id)
  if (sessionIds.length === 0) return {}

  const { data: logs } = await supabase
    .from('set_logs')
    .select('is_warmup, pain_level, performed_exercise_id, workout_exercise_id')
    .in('session_id', sessionIds)
    .eq('is_deload', false)

  const rows = (logs ?? []) as Array<{
    is_warmup: boolean
    pain_level: string | null
    performed_exercise_id: string | null
    workout_exercise_id: string
  }>
  if (rows.length === 0) return {}

  const workoutExerciseIds = Array.from(new Set(rows.map((r) => r.workout_exercise_id)))
  const { data: workoutExercises } = await supabase
    .from('workout_exercises')
    .select('id, exercise_id')
    .in('id', workoutExerciseIds)

  const plannedByWorkoutExercise = new Map(
    ((workoutExercises ?? []) as Array<{ id: string; exercise_id: string }>).map((we) => [
      we.id,
      we.exercise_id,
    ])
  )

  const sets: ExecutedSetLog[] = rows
    .filter((r) => plannedByWorkoutExercise.has(r.workout_exercise_id))
    .map((r) => ({
      is_warmup: r.is_warmup,
      pain_level: r.pain_level,
      exercise_id: plannedByWorkoutExercise.get(r.workout_exercise_id)!,
      performed_exercise_id: r.performed_exercise_id,
    }))

  const exerciseIds = Array.from(
    new Set(sets.map((s) => s.performed_exercise_id ?? s.exercise_id))
  )
  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, muscle_group')
    .in('id', exerciseIds)

  const muscleByExerciseId = Object.fromEntries(
    ((exercises ?? []) as Array<{ id: string; muscle_group: string }>).map((e) => [
      e.id,
      e.muscle_group,
    ])
  )

  return aggregateExecutedVolume(sets, muscleByExerciseId)
}

export type PlannedVolumeResult = {
  planned: Record<string, number>
  indirect: Record<string, number>
}

/**
 * Volume planejado a partir da ficha ATIVA no banco (workouts não arquivados,
 * exercícios visíveis). Fonte de verdade do que o usuário realmente vê —
 * exercícios ocultados pela reconciliação do Abdômen Diário ficam de fora.
 */
export async function getPlannedWeeklyVolumeByMuscle(
  supabase: SupabaseDB,
  userId: string
): Promise<PlannedVolumeResult> {
  const { data, error } = await supabase
    .from('workouts')
    .select(
      'id, workout_exercises(target_sets, is_hidden, exercise:exercises(muscle_group, secondary_muscles))'
    )
    .eq('user_id', userId)
    .eq('is_archived', false)

  if (error) throw error

  const rows: PlannedExerciseRow[] = (
    (data ?? []) as Array<{
      workout_exercises: Array<{
        target_sets: number
        is_hidden: boolean
        exercise: { muscle_group: string; secondary_muscles: string[] | null } | null
      }>
    }>
  )
    .flatMap((workout) => workout.workout_exercises)
    .filter((we) => we.exercise != null)
    .map((we) => ({
      target_sets: we.target_sets,
      is_hidden: we.is_hidden,
      muscle_group: we.exercise!.muscle_group,
      secondary_muscles: we.exercise!.secondary_muscles,
    }))

  return {
    planned: aggregatePlannedVolume(rows),
    indirect: aggregatePlannedIndirect(rows),
  }
}

/** Séries do Abdômen Diário concluídas na semana corrente (exibidas em separado). */
export async function getDailyCoreWeeklySets(
  supabase: SupabaseDB,
  userId: string
): Promise<number> {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const { count, error } = await supabase
    .from('daily_core_sets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('completed_at', weekStart.toISOString())

  if (error) throw error
  return count ?? 0
}
