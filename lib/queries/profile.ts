import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type SupabaseDB = SupabaseClient<Database>

export interface UserProfile {
  goal: string | null
  height_cm: number | null
  weight_kg: number | null
  weekly_goal: number
}

export async function getUserProfile(
  supabase: SupabaseDB,
  userId: string
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('goal, height_cm, weight_kg, weekly_goal')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error

  return {
    goal: data?.goal ?? null,
    height_cm: data?.height_cm ?? null,
    weight_kg: data?.weight_kg ?? null,
    weekly_goal: data?.weekly_goal ?? 3,
  }
}

export async function upsertUserProfile(
  supabase: SupabaseDB,
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> {
  const { error } = await supabase.from('user_profiles').upsert({
    id: userId,
    ...profile,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function getLifetimeStats(
  supabase: SupabaseDB,
  userId: string
): Promise<{ totalSessions: number; totalVolumeKg: number; memberSince: string | null }> {
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id, started_at')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: true })

  if (!sessions || sessions.length === 0) {
    return { totalSessions: 0, totalVolumeKg: 0, memberSince: null }
  }

  const totalSessions = sessions.length
  const memberSince = (sessions[0] as { started_at: string }).started_at
  const sessionIds = (sessions as Array<{ id: string }>).map((s) => s.id)

  const { data: logs } = await supabase
    .from('set_logs')
    .select('weight_kg, reps')
    .in('session_id', sessionIds)

  const totalVolumeKg = (
    (logs ?? []) as Array<{ weight_kg: number | null; reps: number }>
  ).reduce((sum, s) => sum + (s.weight_kg ?? 0) * s.reps, 0)

  return { totalSessions, totalVolumeKg, memberSince }
}
