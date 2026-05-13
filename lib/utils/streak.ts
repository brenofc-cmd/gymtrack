import { formatInTimeZone } from 'date-fns-tz'
import { subDays } from 'date-fns'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const TZ = 'America/Sao_Paulo'

export async function getStreakStats(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ current: number; longest: number }> {
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('finished_at')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })

  if (!sessions || sessions.length === 0) return { current: 0, longest: 0 }

  const uniqueDays = [
    ...new Set(
      sessions.map((s) =>
        formatInTimeZone(new Date(s.finished_at as string), TZ, 'yyyy-MM-dd')
      )
    ),
  ]

  const today = formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd')
  const yesterday = formatInTimeZone(subDays(new Date(), 1), TZ, 'yyyy-MM-dd')

  // Streak atual
  let current = 0
  if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
    current = 1
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1])
      const curr = new Date(uniqueDays[i])
      const diffDays = Math.round(
        (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diffDays === 1) {
        current++
      } else {
        break
      }
    }
  }

  // Streak mais longo de todos os tempos
  let longest = 0
  let running = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1])
    const curr = new Date(uniqueDays[i])
    const diffDays = Math.round(
      (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (diffDays === 1) {
      running++
    } else {
      longest = Math.max(longest, running)
      running = 1
    }
  }
  longest = Math.max(longest, running)

  return { current, longest }
}

// Mantém compatibilidade com chamadas anteriores
export async function getCurrentStreak(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  const { current } = await getStreakStats(supabase, userId)
  return current
}
