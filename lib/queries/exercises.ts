import { subWeeks } from 'date-fns'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ExecutionQuality, PainLevel } from '@/types/database'
import { estimated1RM, isValidPRSet, type RomQuality, type StrengthSet } from '@/lib/training/strength'
import type { TrendSessionPoint, TrendWindow } from '@/lib/progression/trend'
import { localDateISO } from '@/lib/utils/local-date'

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
  set_number: number
  weight_kg: number | null
  reps: number
  rir: number | null
  is_warmup: boolean
  pain_level: string | null
  execution_quality: string | null
  completed_at: string | null
}>> {
  const { data: wexes } = await supabase
    .from('workout_exercises')
    .select('id')
    .eq('exercise_id', catalogExerciseId)

  if (!wexes || wexes.length === 0) return []

  const wexIds = wexes.map((w) => w.id)

  const { data: logs } = await supabase
    .from('set_logs')
    .select('set_number, weight_kg, reps, rir, is_warmup, pain_level, execution_quality, session_id, completed_at, performed_exercise_id')
    .in('workout_exercise_id', wexIds)
    .is('performed_exercise_id', null)
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
      set_number: l.set_number,
      weight_kg: l.weight_kg,
      reps: l.reps,
      rir: l.rir,
      is_warmup: l.is_warmup,
      pain_level: l.pain_level,
      execution_quality: l.execution_quality,
      completed_at: l.completed_at,
    }))
    .sort((a, b) => a.set_number - b.set_number)
}

export async function getExercisePR(
  supabase: SupabaseDB,
  exerciseId: string,
  userId: string,
  options?: { lowerIsHarder?: boolean }
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
      const isBetter = maxWeight === null || (options?.lowerIsHarder
        ? log.weight_kg < maxWeight
        : log.weight_kg > maxWeight)
      if (isBetter) {
        maxWeight = log.weight_kg
        achievedAt = log.completed_at
      }
      if (log.reps > maxReps) maxReps = log.reps
    }
    if (!options?.lowerIsHarder) {
      const estimate = estimated1RM(set)
      if (estimate !== null) bestEstimated1RM = Math.max(bestEstimated1RM ?? 0, estimate)
    }
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

/**
 * Sessões agregadas de um exercício dentro de uma janela de semanas, com os
 * sinais que a análise de tendência precisa (RIR, execução, dor, prontidão).
 * Considera o exercício executado de fato (performed_exercise_id) e ignora
 * sessões canceladas — só sessões concluídas entram.
 */
export async function getExerciseTrendSessions(
  supabase: SupabaseDB,
  exerciseId: string,
  userId: string,
  weeks: TrendWindow
): Promise<TrendSessionPoint[]> {
  const since = subWeeks(new Date(), weeks)

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id, finished_at')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .is('cancelled_at', null)
    .gte('finished_at', since.toISOString())

  const sessionRows = (sessions ?? []) as Array<{ id: string; finished_at: string }>
  if (sessionRows.length === 0) return []

  const { data: workoutExercises } = await supabase
    .from('workout_exercises')
    .select('id')
    .eq('exercise_id', exerciseId)
  const plannedIds = ((workoutExercises ?? []) as Array<{ id: string }>).map((we) => we.id)

  const { data: logs } = await supabase
    .from('set_logs')
    .select(
      'session_id, weight_kg, reps, rir, is_warmup, pain_level, execution_quality, performed_exercise_id, workout_exercise_id'
    )
    .in('session_id', sessionRows.map((session) => session.id))

  const rows = ((logs ?? []) as Array<{
    session_id: string
    weight_kg: number | null
    reps: number
    rir: number | null
    is_warmup: boolean
    pain_level: string | null
    execution_quality: string | null
    performed_exercise_id: string | null
    workout_exercise_id: string
  }>).filter((log) => {
    if (log.is_warmup) return false
    // Substituição: vale o exercício realmente executado.
    if (log.performed_exercise_id) return log.performed_exercise_id === exerciseId
    return plannedIds.includes(log.workout_exercise_id)
  })
  if (rows.length === 0) return []

  const readinessByDate = new Map<string, boolean>()
  const { data: readiness } = await supabase
    .from('daily_readiness')
    .select('readiness_date, recommendation')
    .eq('user_id', userId)
    .gte('readiness_date', localDateISO(since))
  for (const row of (readiness ?? []) as Array<{ readiness_date: string; recommendation: string }>) {
    readinessByDate.set(row.readiness_date, row.recommendation === 'low_recovery')
  }

  const finishedById = new Map(sessionRows.map((session) => [session.id, session.finished_at]))
  const bySession = new Map<string, TrendSessionPoint>()

  for (const log of rows) {
    const finishedAt = finishedById.get(log.session_id)
    if (!finishedAt) continue
    const weight = log.weight_kg
    const existing = bySession.get(log.session_id)
    const blockingPain = log.pain_level === 'moderada' || log.pain_level === 'forte'
    const poorExecution = log.execution_quality === 'ruim'

    if (!existing) {
      bySession.set(log.session_id, {
        date: finishedAt,
        maxWeight: weight,
        maxReps: log.reps,
        sets: 1,
        volume: (weight ?? 0) * log.reps,
        avgRir: log.rir,
        hadPoorExecution: poorExecution,
        hadBlockingPain: blockingPain,
        lowReadiness: readinessByDate.get(localDateISO(new Date(finishedAt))) ?? false,
      })
      continue
    }

    existing.maxWeight =
      weight == null ? existing.maxWeight : Math.max(existing.maxWeight ?? 0, weight)
    existing.maxReps = Math.max(existing.maxReps, log.reps)
    existing.sets += 1
    existing.volume += (weight ?? 0) * log.reps
    if (log.rir != null) {
      existing.avgRir =
        existing.avgRir == null ? log.rir : (existing.avgRir * (existing.sets - 1) + log.rir) / existing.sets
    }
    existing.hadPoorExecution = existing.hadPoorExecution || poorExecution
    existing.hadBlockingPain = existing.hadBlockingPain || blockingPain
  }

  // Da mais antiga para a mais recente: analyzeTrend espera essa ordem.
  return Array.from(bySession.values()).sort((a, b) => a.date.localeCompare(b.date))
}
