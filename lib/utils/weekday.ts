const TZ = 'America/Sao_Paulo'

/**
 * Dia da semana no fuso do usuário: 1 = segunda ... 6 = sábado, 7 = domingo.
 * (Mesma convenção usada por `getCurrentDayState()` em `lib/training/schedule.ts`.)
 *
 * Não existe mais um mapeamento fixo de letra A–F por dia da semana: a
 * rotina é uma sequência contínua (ver `lib/training/schedule.ts`), e o
 * calendário só decide se hoje é dia de treino, recuperação ativa ou
 * descanso.
 */
export function currentDayOfWeek(now: Date = new Date(), timeZone: string = TZ): number {
  const short = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(now)
  const map: Record<string, number> = {
    Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
  }
  return map[short] ?? 7
}
