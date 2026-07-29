/**
 * Data local do usuário (America/Sao_Paulo) em ISO (yyyy-mm-dd).
 *
 * Use SEMPRE este helper em vez de `new Date().toISOString().slice(0, 10)`:
 * o slice devolve a data em UTC, que à noite (21h–00h no Brasil) já é o dia
 * seguinte — sono/recuperação/hidratação acabariam registrados na data errada.
 */
const TZ = 'America/Sao_Paulo'

export function localDateISO(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date)
}
