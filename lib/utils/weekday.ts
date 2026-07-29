import type { WorkoutLetter } from '@/types/database'

const TZ = 'America/Sao_Paulo'

/**
 * Dia da semana no fuso do usuário: 1 = segunda ... 6 = sábado, 7 = domingo.
 * (Mesma convenção da coluna workouts.day_of_week.)
 */
export function currentDayOfWeek(now: Date = new Date(), timeZone: string = TZ): number {
  const short = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(now)
  const map: Record<string, number> = {
    Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
  }
  return map[short] ?? 7
}

/** Letra do treino do dia (A–F), ou null no domingo (descanso). */
export function todayLetter(now: Date = new Date(), timeZone: string = TZ): WorkoutLetter | null {
  const day = currentDayOfWeek(now, timeZone)
  if (day === 7) return null
  return (['A', 'B', 'C', 'D', 'E', 'F'] as const)[day - 1]
}
