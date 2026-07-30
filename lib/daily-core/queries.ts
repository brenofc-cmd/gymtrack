import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  DailyCoreDayRow,
  DailyCorePreferenceRow,
  DailyCoreProgressionRow,
  DailyCoreReminderRow,
  DailyCoreSessionRow,
  Database,
} from '@/types/database'
import type { CoreExerciseWithVariations } from './logic'

type SupabaseDB = SupabaseClient<Database>

export async function getCoreCatalog(supabase: SupabaseDB) {
  const [{ data: days, error: daysError }, { data: exercises, error: exerciseError }] = await Promise.all([
    supabase.from('daily_core_days').select('*').order('day_of_week'),
    supabase.from('daily_core_exercises').select('*').order('day_of_week').order('order_index'),
  ])
  if (daysError) throw daysError
  if (exerciseError) throw exerciseError
  const exerciseRows = exercises ?? []
  const ids = exerciseRows.map((exercise) => exercise.id)
  const { data: variations, error: variationError } = ids.length
    ? await supabase.from('daily_core_variations').select('*').in('exercise_id', ids).order('order_index')
    : { data: [], error: null }
  if (variationError) throw variationError
  const variationRows = variations ?? []
  const allExercises = exerciseRows.map((exercise) => ({
    ...exercise,
    variations: variationRows.filter((variation) => variation.exercise_id === exercise.id),
  })) as CoreExerciseWithVariations[]
  return {
    days: (days ?? []) as DailyCoreDayRow[],
    exercises: allExercises.filter((exercise) => exercise.is_active),
    allExercises,
  }
}
export async function getCoreUserState(supabase: SupabaseDB, userId: string) {
  const [{ data: preferences, error: preferenceError }, { data: reminder }, { data: sessions }, { data: pain }, { data: progressions }] = await Promise.all([
    supabase.from('daily_core_preferences').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('daily_core_reminders').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('daily_core_sessions').select('*').eq('user_id', userId).order('session_date', { ascending: false }).limit(120),
    supabase.from('daily_core_pain_logs').select('*').eq('user_id', userId).order('logged_on', { ascending: false }).limit(12),
    supabase.from('daily_core_progressions').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
  ])
  if (preferenceError) throw preferenceError
  return {
    preferences: preferences as DailyCorePreferenceRow | null,
    reminder: reminder as DailyCoreReminderRow | null,
    sessions: (sessions ?? []) as DailyCoreSessionRow[],
    pain: pain ?? [],
    progressions: (progressions ?? []) as DailyCoreProgressionRow[],
  }
}

export async function getCoreSessionSets(supabase: SupabaseDB, sessionIds: string[]) {
  if (sessionIds.length === 0) return []
  const { data, error } = await supabase
    .from('daily_core_sets')
    .select('*')
    .in('session_id', sessionIds)
    .order('completed_at')
  if (error) throw error
  return data ?? []
}
