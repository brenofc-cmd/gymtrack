import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ExecutionQuality, PainLevel } from '@/types/database'
import { estimated1RM, isValidPRSet, type RomQuality, type StrengthSet } from '@/lib/training/strength'

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

export interface LastSetLog {
  weight_kg: number | null
  reps: number
  rir: number | null
  completed_at: string
  session_id: string
}

/**
 * Último log do exercício, olhando pelo exercício de CATÁLOGO (exercise_id):
 * assim o histórico sobrevive à troca de rotina (workout_exercise novo,
 * mesmo movimento). Séries de aquecimento são ignoradas e o histórico de
 * variações (performed_exercise_id) é mantido separado.
 */
export async function getLastSetLogForExercise(
  supabase: SupabaseDB,
  workoutExerciseId: string,
  excludeSessionId?: string,
  options?: {
    /** exercise_id do catálogo (para continuidade entre versões da rotina) */
    catalogExerciseId?: string
    /** variação escolhida; null/undefined = exercício principal */
    performedExerciseId?: string | null
  }
): Promise<LastSetLog | null> {
  let wexIds = [workoutExerciseId]

  if (options?.catalogExerciseId) {
    const { data: wexes } = await supabase
      .from('workout_exercises')
      .select('id')
      .eq('exercise_id', options.catalogExerciseId)
    if (wexes && wexes.length > 0) {
      wexIds = wexes.map((w) => w.id)
    }
  }

  let query = supabase
    .from('set_logs')
    .select('weight_kg, reps, rir, completed_at, session_id, performed_exercise_id, is_warmup')
    .in('workout_exercise_id', wexIds)
    .eq('is_warmup', false)
    .order('completed_at', { ascending: false })
    .limit(50)

  if (options?.performedExerciseId) {
    query = query.eq('performed_exercise_id', options.performedExerciseId)
  } else {
    query = query.is('performed_exercise_id', null)
  }

  const { data } = await query

  if (!data || data.length === 0) return null

  const result = data.find(
    (log) => excludeSessionId == null || log.session_id !== excludeSessionId
  )

  return (result as LastSetLog | undefined) ?? null
}

/**
 * Séries válidas da última sessão concluída do exercício (para a sugestão
 * de progressão dupla).
 */
export async function getLastSessionSets(
  supabase: SupabaseDB,
  catalogExerciseId: string,
  userId: string,
  excludeSessionId?: string
): Promise<Array<{
  weight_kg: number | null
  reps: number
  rir: number | null
  is_warmup: boolean
  pain_level: string | null
  execution_quality: string | null
}>> {
  const { data: wexes } = await supabase
    .from('workout_exercises')
    .select('id')
    .eq('exercise_id', catalogExerciseId)

  if (!wexes || wexes.length === 0) return []

  const wexIds = wexes.map((w) => w.id)

  const { data: logs } = await supabase
    .from('set_logs')
    .select('weight_kg, reps, rir, is_warmup, pain_level, execution_quality, session_id, completed_at')
    .in('workout_exercise_id', wexIds)
    .order('completed_at', { ascending: false })
    .limit(60)

  if (!logs || logs.length === 0) return []

  const sessionIds = [...new Set(logs.map((l) => l.session_id))].filter(
    (id) => id !== excludeSessionId
  )
  if (sessionIds.length === 0) return []

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id, finished_at')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .in('id', sessionIds)
    .order('finished_at', { ascending: false })
    .limit(1)

  const lastSessionId = sessions?.[0]?.id
  if (!lastSessionId) return []

  return logs
    .filter((l) => l.session_id === lastSessionId)
    .map((l) => ({
      weight_kg: l.weight_kg,
      reps: l.reps,
      rir: l.rir,
      is_warmup: l.is_warmup,
      pain_level: l.pain_level,
      execution_quality: l.execution_quality,
    }))
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

  // Aquecimento não entra nos recordes
  const { data: logs } = await supabase
    .from('set_logs')
    .select('weight_kg, reps, completed_at, session_id, is_warmup, pain_level, execution_quality, rom_quality')
    .in('workout_exercise_id', wexIds)
    .eq('is_warmup', false)

  if (!logs || logs.length === 0) return null

  const sessionIds = [...new Set(logs.map((l) => l.session_id))]
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .in('id', sessionIds)

  const finishedSessionIds = new Set((sessions ?? []).map((s) => s.id))
  const userLogs = logs.filter((log) => finishedSessionIds.has(log.session_id))

  if (userLogs.length === 0) return null

  let maxWeight: number | null = null
  let maxReps = 0
  let achievedAt: string | null = null
  let bestEstimated1RM: number | null = null

  for (const log of userLogs) {
    const set: StrengthSet = {
      weightKg: log.weight_kg,
      reps: log.reps,
      isWarmup: log.is_warmup,
      painLevel: log.pain_level as PainLevel | null,
      executionQuality: log.execution_quality as ExecutionQuality | null,
      romQuality: log.rom_quality as RomQuality | null,
    }
    if (isValidPRSet(set) && log.weight_kg !== null) {
      if (maxWeight === null || log.weight_kg > maxWeight) {
        maxWeight = log.weight_kg
        achievedAt = log.completed_at
      }
      if (log.reps > maxReps) maxReps = log.reps
    }
    const estimate = estimated1RM(set)
    if (estimate !== null) bestEstimated1RM = Math.max(bestEstimated1RM ?? 0, estimate)
  }

  return { maxWeight, maxReps, estimated1RM: bestEstimated1RM, achievedAt }
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
