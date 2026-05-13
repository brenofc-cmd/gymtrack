import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  WorkoutSession,
  Workout,
  WorkoutExercise,
  Exercise,
  SetLog,
} from '@/types/database'

type SupabaseDB = SupabaseClient<Database>

export async function saveSetLog(
  supabase: SupabaseDB,
  sessionId: string,
  workoutExerciseId: string,
  log: { set_number: number; weight_kg: number | null; reps: number; rpe?: number | null; completed_at: string }
): Promise<void> {
  const { error } = await supabase.from('set_logs').insert({
    session_id: sessionId,
    workout_exercise_id: workoutExerciseId,
    set_number: log.set_number,
    weight_kg: log.weight_kg,
    reps: log.reps,
    rpe: log.rpe ?? null,
    completed_at: log.completed_at,
  })
  if (error) throw error
}

export async function createSession(
  supabase: SupabaseDB,
  userId: string,
  workoutId: string
): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({ user_id: userId, workout_id: workoutId })
    .select()
    .single()

  if (error) throw error
  return data as WorkoutSession
}

export async function finishSession(
  supabase: SupabaseDB,
  sessionId: string,
  durationSeconds: number
): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .update({
      finished_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data as WorkoutSession
}

export type SessionWithWorkoutRow = WorkoutSession & {
  workout: Workout | null
}

export async function getSessionsHistory(
  supabase: SupabaseDB,
  userId: string,
  limit = 20
): Promise<SessionWithWorkoutRow[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*, workout:workouts(*)')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as unknown as SessionWithWorkoutRow[]
}

export type SetLogWithExercise = SetLog & {
  workout_exercise: WorkoutExercise & {
    exercise: Exercise
  }
}

export type SessionWithLogs = WorkoutSession & {
  workout: Workout | null
  set_logs: SetLogWithExercise[]
}

export async function getSessionWithLogs(
  supabase: SupabaseDB,
  sessionId: string
): Promise<SessionWithLogs> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      workout:workouts(*),
      set_logs (
        *,
        workout_exercise:workout_exercises (
          *,
          exercise:exercises (*)
        )
      )
    `)
    .eq('id', sessionId)
    .single()

  if (error) throw error
  return data as unknown as SessionWithLogs
}

export type ActiveSession = WorkoutSession & {
  workout: Workout | null
}

export async function getMuscleGroupDistribution(
  supabase: SupabaseDB,
  userId: string,
  since?: Date
): Promise<Array<{ muscle: string; sets: number; pct: number }>> {
  let startDate: Date
  if (since) {
    startDate = since
  } else {
    const now = new Date()
    const dayOfWeek = now.getDay()
    startDate = new Date(now)
    startDate.setDate(now.getDate() - dayOfWeek)
    startDate.setHours(0, 0, 0, 0)
  }

  // Sessões desde startDate
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .gte('started_at', startDate.toISOString())

  if (!sessions || sessions.length === 0) return []

  const sessionIds = sessions.map((s) => s.id)

  // Set logs com grupo muscular do exercício
  const { data: logs } = await supabase
    .from('set_logs')
    .select('workout_exercise:workout_exercises(exercise:exercises(muscle_group))')
    .in('session_id', sessionIds)

  if (!logs || logs.length === 0) return []

  // Conta séries por grupo muscular
  const counts = new Map<string, number>()
  for (const log of logs as Array<{
    workout_exercise: { exercise: { muscle_group: string | null } } | null
  }>) {
    const muscle = log.workout_exercise?.exercise?.muscle_group
    if (!muscle) continue
    counts.set(muscle, (counts.get(muscle) ?? 0) + 1)
  }

  const total = Array.from(counts.values()).reduce((s, n) => s + n, 0)
  if (total === 0) return []

  return Array.from(counts.entries())
    .map(([muscle, sets]) => ({ muscle, sets, pct: Math.round((sets / total) * 100) }))
    .sort((a, b) => b.sets - a.sets)
}

export async function getTrainingDays(
  supabase: SupabaseDB,
  userId: string,
  days = 112
): Promise<Array<{ date: string; workoutName: string | null }>> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data } = await supabase
    .from('workout_sessions')
    .select('started_at, workout:workouts(name)')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .gte('started_at', since.toISOString())
    .order('started_at', { ascending: true })

  if (!data) return []

  // Deduplica por dia (TZ São Paulo via substring — o servidor está em UTC)
  const seen = new Map<string, string | null>()
  for (const s of data as Array<{ started_at: string; workout: { name: string } | null }>) {
    const date = new Date(s.started_at)
      .toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
    if (!seen.has(date)) {
      seen.set(date, s.workout?.name ?? null)
    }
  }

  return Array.from(seen.entries()).map(([date, workoutName]) => ({ date, workoutName }))
}

export async function getPreviousSessionVolume(
  supabase: SupabaseDB,
  userId: string,
  workoutId: string,
  beforeSessionId: string
): Promise<number | null> {
  const { data: prevSession } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('workout_id', workoutId)
    .not('finished_at', 'is', null)
    .neq('id', beforeSessionId)
    .order('finished_at', { ascending: false })
    .limit(1)
    .single()

  if (!prevSession) return null

  const { data: logs } = await supabase
    .from('set_logs')
    .select('weight_kg, reps')
    .eq('session_id', (prevSession as { id: string }).id)

  if (!logs || logs.length === 0) return null

  return (logs as Array<{ weight_kg: number | null; reps: number }>).reduce(
    (sum, s) => sum + (s.weight_kg ?? 0) * s.reps,
    0
  )
}

export async function getActiveSession(
  supabase: SupabaseDB,
  userId: string
): Promise<ActiveSession | null> {
  const { data } = await supabase
    .from('workout_sessions')
    .select('*, workout:workouts(*)')
    .eq('user_id', userId)
    .is('finished_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  return (data as unknown as ActiveSession) ?? null
}

export async function getLastSessionsPerWorkout(
  supabase: SupabaseDB,
  userId: string
): Promise<Array<{ workout_id: string; finished_at: string | null }>> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('workout_id, finished_at')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })

  if (error) throw error

  const seen = new Set<string>()
  const result: Array<{ workout_id: string; finished_at: string | null }> = []
  for (const s of (data ?? []) as Array<{ workout_id: string; finished_at: string | null }>) {
    if (!seen.has(s.workout_id)) {
      seen.add(s.workout_id)
      result.push(s)
    }
  }
  return result
}

export async function getWeekStats(
  supabase: SupabaseDB,
  userId: string
): Promise<{ count: number; totalSeconds: number; totalVolumeKg: number }> {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - dayOfWeek)
  weekStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('id, duration_seconds')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .gte('started_at', weekStart.toISOString())

  if (error) throw error

  const rows = (data ?? []) as Array<{ id: string; duration_seconds: number | null }>
  const count = rows.length
  const totalSeconds = rows.reduce((s, r) => s + (r.duration_seconds ?? 0), 0)

  if (count === 0) return { count, totalSeconds, totalVolumeKg: 0 }

  const sessionIds = rows.map((r) => r.id)
  const { data: setLogs } = await supabase
    .from('set_logs')
    .select('weight_kg, reps')
    .in('session_id', sessionIds)

  const totalVolumeKg = (
    (setLogs ?? []) as Array<{ weight_kg: number | null; reps: number }>
  ).reduce((sum, s) => sum + (s.weight_kg ?? 0) * s.reps, 0)

  return { count, totalSeconds, totalVolumeKg }
}
