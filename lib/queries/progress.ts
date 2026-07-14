import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/types/database'
import { calc1RM } from '@/lib/utils/volume'

type SupabaseDB = SupabaseClient<Database>

export interface ExerciseProgressSummary {
  exerciseId: string
  name: string
  muscleGroup: string
  maxWeight: number | null
  maxReps: number
  estimated1RM: number | null
  lastTrainedAt: string | null
  history: Array<{
    date: string
    maxWeight: number
    totalVolume: number
    maxReps: number
  }>
}

export async function getExerciseProgressSummaries(
  supabase: SupabaseDB,
  userId: string
): Promise<ExerciseProgressSummary[]> {
  const { data: sessions, error: sessionError } = await supabase
    .from('workout_sessions')
    .select('id, finished_at')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: true })

  if (sessionError) throw sessionError
  if (!sessions?.length) return []

  const sessionDates = new Map(sessions.map((session) => [session.id, session.finished_at as string]))
  const { data, error } = await supabase
    .from('set_logs')
    .select(`
      weight_kg,
      reps,
      completed_at,
      session_id,
      performed_exercise:exercises!set_logs_performed_exercise_id_fkey(id, name_pt, muscle_group),
      workout_exercise:workout_exercises!inner(
        exercise:exercises!inner(id, name_pt, muscle_group)
      )
    `)
    .in('session_id', sessions.map((session) => session.id))
    .eq('is_warmup', false)
    .order('completed_at', { ascending: true })

  if (error) throw error

  type ProgressRow = {
    weight_kg: number | null
    reps: number
    completed_at: string | null
    session_id: string
    performed_exercise: { id: string; name_pt: string; muscle_group: string } | null
    workout_exercise: { exercise: { id: string; name_pt: string; muscle_group: string } }
  }
  const rows = (data ?? []) as unknown as ProgressRow[]
  const exerciseMap = new Map<string, ExerciseProgressSummary & { sessions: Map<string, ExerciseProgressSummary['history'][number]> }>()

  for (const row of rows) {
    const exercise = row.performed_exercise ?? row.workout_exercise.exercise
    let summary = exerciseMap.get(exercise.id)
    if (!summary) {
      summary = {
        exerciseId: exercise.id,
        name: exercise.name_pt,
        muscleGroup: exercise.muscle_group,
        maxWeight: null,
        maxReps: 0,
        estimated1RM: null,
        lastTrainedAt: null,
        history: [],
        sessions: new Map(),
      }
      exerciseMap.set(exercise.id, summary)
    }

    const weight = row.weight_kg ?? 0
    const estimated = row.weight_kg == null ? null : calc1RM(row.weight_kg, row.reps)
    summary.maxWeight = summary.maxWeight == null ? row.weight_kg : Math.max(summary.maxWeight, weight)
    summary.maxReps = Math.max(summary.maxReps, row.reps)
    summary.estimated1RM = estimated == null
      ? summary.estimated1RM
      : Math.max(summary.estimated1RM ?? 0, estimated)
    summary.lastTrainedAt = sessionDates.get(row.session_id) ?? row.completed_at

    const date = sessionDates.get(row.session_id) ?? row.completed_at ?? new Date().toISOString()
    const current = summary.sessions.get(row.session_id)
    if (current) {
      current.maxWeight = Math.max(current.maxWeight, weight)
      current.maxReps = Math.max(current.maxReps, row.reps)
      current.totalVolume += weight * row.reps
    } else {
      summary.sessions.set(row.session_id, {
        date,
        maxWeight: weight,
        maxReps: row.reps,
        totalVolume: weight * row.reps,
      })
    }
  }

  return Array.from(exerciseMap.values())
    .map(({ sessions: grouped, ...summary }) => ({
      ...summary,
      estimated1RM: summary.estimated1RM == null ? null : Math.round(summary.estimated1RM * 10) / 10,
      history: Array.from(grouped.values()).slice(-12),
    }))
    .sort((a, b) => (b.lastTrainedAt ?? '').localeCompare(a.lastTrainedAt ?? ''))
}

export async function getBodyMeasurements(
  supabase: SupabaseDB,
  userId: string,
  limit = 12
): Promise<Tables<'body_measurements'>[]> {
  const { data, error } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('logged_on', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}
