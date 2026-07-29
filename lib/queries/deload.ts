import { startOfWeek, subDays, differenceInCalendarDays } from 'date-fns'
import { localDateISO } from '@/lib/utils/local-date'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/types/database'
import {
  suggestDeload,
  type DeloadExerciseHistory,
  type DeloadSuggestion,
} from '@/lib/progression/deload'
import type { ReadinessStatus } from '@/lib/training/readiness'

type SupabaseDB = SupabaseClient<Database>

export type DeloadRecommendationRow = Tables<'deload_recommendations'>

export type DeloadContext = {
  /** Recomendação aguardando decisão do usuário */
  pending: DeloadRecommendationRow | null
  /** Deload aceito e ainda dentro da semana de descarga */
  active: DeloadRecommendationRow | null
  /** Nova sugestão computada agora (só quando não há pendente nem ativa) */
  suggestion: DeloadSuggestion | null
}

const HISTORY_DAYS = 35
const ACTIVE_DELOAD_DAYS = 9
const BLOCKING_PAIN = new Set(['moderada', 'forte'])

export async function getDeloadContext(
  supabase: SupabaseDB,
  userId: string
): Promise<DeloadContext> {
  const { data: recommendations } = await supabase
    .from('deload_recommendations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  const rows = (recommendations ?? []) as DeloadRecommendationRow[]
  const pending = rows.find((r) => r.status === 'sugerido') ?? null
  const active =
    rows.find(
      (r) =>
        r.status === 'aceito' &&
        r.decided_at != null &&
        differenceInCalendarDays(new Date(), new Date(r.decided_at)) <= ACTIVE_DELOAD_DAYS
    ) ?? null

  if (pending || active) {
    return { pending, active, suggestion: null }
  }

  const [exercises, readinessLast7Days] = await Promise.all([
    buildExerciseHistory(supabase, userId),
    fetchReadiness(supabase, userId),
  ])

  const suggestion = suggestDeload({
    exercises,
    readinessLast7Days,
    hasPendingRecommendation: false,
  })

  return { pending, active, suggestion }
}

async function fetchReadiness(supabase: SupabaseDB, userId: string) {
  const since = localDateISO(subDays(new Date(), 7))
  const { data } = await supabase
    .from('daily_readiness')
    .select('readiness_date, recommendation')
    .eq('user_id', userId)
    .gte('readiness_date', since)

  return ((data ?? []) as Array<{ readiness_date: string; recommendation: string }>).map(
    (row) => ({ date: row.readiness_date, status: row.recommendation as ReadinessStatus })
  )
}

async function buildExerciseHistory(
  supabase: SupabaseDB,
  userId: string
): Promise<DeloadExerciseHistory[]> {
  const since = subDays(new Date(), HISTORY_DAYS)

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id, started_at')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .gte('started_at', since.toISOString())

  const sessionRows = (sessions ?? []) as Array<{ id: string; started_at: string }>
  if (sessionRows.length === 0) return []

  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekIndexBySession = new Map<string, number>()
  const startedAtBySession = new Map<string, string>()
  for (const session of sessionRows) {
    const sessionWeekStart = startOfWeek(new Date(session.started_at), { weekStartsOn: 1 })
    const weekIndex = Math.round(
      differenceInCalendarDays(currentWeekStart, sessionWeekStart) / 7
    )
    weekIndexBySession.set(session.id, weekIndex)
    startedAtBySession.set(session.id, session.started_at)
  }

  const { data: logs } = await supabase
    .from('set_logs')
    .select(
      'session_id, is_warmup, pain_level, weight_kg, estimated_1rm, performed_exercise_id, workout_exercise_id'
    )
    .in('session_id', sessionRows.map((s) => s.id))

  const logRows = (logs ?? []) as Array<{
    session_id: string
    is_warmup: boolean
    pain_level: string | null
    weight_kg: number | null
    estimated_1rm: number | null
    performed_exercise_id: string | null
    workout_exercise_id: string
  }>
  if (logRows.length === 0) return []

  const { data: workoutExercises } = await supabase
    .from('workout_exercises')
    .select('id, exercise_id')
    .in('id', Array.from(new Set(logRows.map((l) => l.workout_exercise_id))))

  const plannedByWorkoutExercise = new Map(
    ((workoutExercises ?? []) as Array<{ id: string; exercise_id: string }>).map((we) => [
      we.id,
      we.exercise_id,
    ])
  )

  const exerciseIds = Array.from(
    new Set(
      logRows.map(
        (l) => l.performed_exercise_id ?? plannedByWorkoutExercise.get(l.workout_exercise_id)
      )
    )
  ).filter((id): id is string => id != null)

  const { data: exerciseData } = await supabase
    .from('exercises')
    .select('id, name_pt, exercise_type')
    .in('id', exerciseIds)

  const exerciseInfo = new Map(
    ((exerciseData ?? []) as Array<{ id: string; name_pt: string; exercise_type: string | null }>).map(
      (e) => [e.id, e]
    )
  )

  type PerExercise = {
    name: string
    maxWeightByWeek: Map<number, number>
    sessionsByWeek: Map<number, Set<string>>
    e1rmBySessionId: Map<string, number>
    painBySessionId: Map<string, boolean>
  }
  const perExercise = new Map<string, PerExercise>()

  for (const log of logRows) {
    const exerciseId =
      log.performed_exercise_id ?? plannedByWorkoutExercise.get(log.workout_exercise_id)
    if (!exerciseId) continue
    const info = exerciseInfo.get(exerciseId)
    if (!info || info.exercise_type !== 'composto') continue
    if (log.is_warmup) continue

    const weekIndex = weekIndexBySession.get(log.session_id)
    if (weekIndex == null) continue

    let entry = perExercise.get(exerciseId)
    if (!entry) {
      entry = {
        name: info.name_pt,
        maxWeightByWeek: new Map(),
        sessionsByWeek: new Map(),
        e1rmBySessionId: new Map(),
        painBySessionId: new Map(),
      }
      perExercise.set(exerciseId, entry)
    }

    const blockingPain = log.pain_level != null && BLOCKING_PAIN.has(log.pain_level)
    entry.painBySessionId.set(
      log.session_id,
      (entry.painBySessionId.get(log.session_id) ?? false) || blockingPain
    )
    if (blockingPain) continue

    if (log.weight_kg != null) {
      const current = entry.maxWeightByWeek.get(weekIndex) ?? 0
      if (log.weight_kg > current) entry.maxWeightByWeek.set(weekIndex, log.weight_kg)
    }
    if (log.estimated_1rm != null) {
      const current = entry.e1rmBySessionId.get(log.session_id) ?? 0
      if (log.estimated_1rm > current) entry.e1rmBySessionId.set(log.session_id, log.estimated_1rm)
    }
    if (!entry.sessionsByWeek.has(weekIndex)) entry.sessionsByWeek.set(weekIndex, new Set())
    entry.sessionsByWeek.get(weekIndex)!.add(log.session_id)
  }

  const history: DeloadExerciseHistory[] = []
  for (const entry of perExercise.values()) {
    const weeks = [0, 1, 2].map((weekIndex) => {
      const maxThisWeek = entry.maxWeightByWeek.get(weekIndex) ?? 0
      const maxPreviousWeek = entry.maxWeightByWeek.get(weekIndex + 1) ?? 0
      return {
        weekIndex,
        completedSessions: entry.sessionsByWeek.get(weekIndex)?.size ?? 0,
        hadIncrease: maxPreviousWeek > 0 && maxThisWeek > maxPreviousWeek + 0.01,
      }
    })

    const sessionsRecentFirst = Array.from(entry.e1rmBySessionId.keys()).sort((a, b) =>
      (startedAtBySession.get(b) ?? '').localeCompare(startedAtBySession.get(a) ?? '')
    )
    const e1rmBySession = sessionsRecentFirst.map((id) => entry.e1rmBySessionId.get(id)!)
    const hadAcutePain = sessionsRecentFirst
      .slice(0, 2)
      .some((id) => entry.painBySessionId.get(id) === true)

    history.push({
      exerciseName: entry.name,
      isCompound: true,
      weeks,
      e1rmBySession,
      hadAcutePain,
    })
  }

  return history
}
