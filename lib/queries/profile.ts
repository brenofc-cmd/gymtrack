import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type SupabaseDB = SupabaseClient<Database>

export interface UserProfile {
  weight_kg: number | null
  weekly_goal: number
}

export async function getUserProfile(
  supabase: SupabaseDB,
  userId: string
): Promise<UserProfile> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('user_profiles')
    .select('weight_kg, weekly_goal')
    .eq('id', userId)
    .single()

  return {
    weight_kg: (data as { weight_kg: number | null } | null)?.weight_kg ?? null,
    weekly_goal: (data as { weekly_goal: number } | null)?.weekly_goal ?? 3,
  }
}

export async function upsertUserProfile(
  supabase: SupabaseDB,
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('user_profiles').upsert({
    id: userId,
    ...profile,
    updated_at: new Date().toISOString(),
  })
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
