import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { calc1RM } from '@/lib/utils/volume'

type SupabaseDB = SupabaseClient<Database>

export async function getExercise(supabase: SupabaseDB, exerciseId: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .single()

  if (error) throw error
  return data
}

export async function getLastSetLogForExercise(
  supabase: SupabaseDB,
  workoutExerciseId: string,
  excludeSessionId?: string
) {
  const { data } = await supabase
    .from('set_logs')
    .select('weight_kg, reps, completed_at, session_id')
    .eq('workout_exercise_id', workoutExerciseId)
    .order('completed_at', { ascending: false })
    .limit(50)

  if (!data || data.length === 0) return null

  // Find a set from a different session (previous session)
  const result = data.find(
    (log) => excludeSessionId == null || log.session_id !== excludeSessionId
  )

  return result ?? null
}

export async function getExercisePR(
  supabase: SupabaseDB,
  exerciseId: string,
  userId: string
): Promise<{ maxWeight: number | null; maxReps: number; estimated1RM: number | null; achievedAt: string | null } | null> {
  const { data: wexes } = await supabase
    .from('workout_exercises')
    .select('id')
    .eq('exercise_id', exerciseId)

  if (!wexes || wexes.length === 0) return null

  const wexIds = wexes.map((w) => w.id)

  const { data: logs } = await supabase
    .from('set_logs')
    .select('weight_kg, reps, completed_at, session_id')
    .in('workout_exercise_id', wexIds)

  if (!logs || logs.length === 0) return null

  const sessionIds = [...new Set(logs.map((l) => l.session_id))]
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .in('id', sessionIds)

  const finishedSessionIds = new Set((sessions ?? []).map((s) => s.id))
  const userLogs = (
    logs as Array<{ weight_kg: number | null; reps: number; completed_at: string; session_id: string }>
  ).filter((l) => finishedSessionIds.has(l.session_id))

  if (userLogs.length === 0) return null

  let maxWeight: number | null = null
  let maxReps = 0
  let achievedAt: string | null = null
  let best1RMLog: { weight: number; reps: number } | null = null

  for (const log of userLogs) {
    if (log.weight_kg !== null) {
      if (maxWeight === null || log.weight_kg > maxWeight) {
        maxWeight = log.weight_kg
        achievedAt = log.completed_at
      }
      const estimated = calc1RM(log.weight_kg, log.reps)
      if (!best1RMLog || estimated > calc1RM(best1RMLog.weight, best1RMLog.reps)) {
        best1RMLog = { weight: log.weight_kg, reps: log.reps }
      }
    }
    if (log.reps > maxReps) maxReps = log.reps
  }

  const estimated1RM = best1RMLog ? Math.round(calc1RM(best1RMLog.weight, best1RMLog.reps) * 10) / 10 : null

  return { maxWeight, maxReps, estimated1RM, achievedAt }
}

export async function getExerciseProgressHistory(
  supabase: SupabaseDB,
  exerciseId: string,
  userId: string,
  limit = 10
) {
  // Get workout_exercise IDs for this exercise
  const { data: wexes } = await supabase
    .from('workout_exercises')
    .select('id')
    .eq('exercise_id', exerciseId)

  if (!wexes || wexes.length === 0) return []

  const wexIds = wexes.map((w) => w.id)

  const { data, error } = await supabase
    .from('set_logs')
    .select('weight_kg, reps, completed_at, session_id')
    .in('workout_exercise_id', wexIds)
    .order('completed_at', { ascending: false })
    .limit(limit * 10)

  if (error || !data) return []

  // Get finished sessions for this user
  const sessionIds = [...new Set(data.map((d) => d.session_id))]
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id, finished_at')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .in('id', sessionIds)

  const finishedMap = new Map(
    (sessions ?? []).map((s) => [s.id, s.finished_at as string])
  )

  const sessionMap = new Map<string, { date: string; maxWeight: number; totalVolume: number; maxReps: number }>()

  for (const log of data as Array<{ weight_kg: number | null; reps: number; completed_at: string; session_id: string }>) {
    const finishedAt = finishedMap.get(log.session_id)
    if (!finishedAt) continue

    const weight = log.weight_kg ?? 0
    const existing = sessionMap.get(log.session_id)
    if (!existing) {
      sessionMap.set(log.session_id, {
        date: finishedAt,
        maxWeight: weight,
        totalVolume: weight * log.reps,
        maxReps: log.reps,
      })
    } else {
      existing.maxWeight = Math.max(existing.maxWeight, weight)
      existing.totalVolume += weight * log.reps
      existing.maxReps = Math.max(existing.maxReps, log.reps)
    }
  }

  return Array.from(sessionMap.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-limit)
}
