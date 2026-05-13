import { startOfWeek, subWeeks, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

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
