import type { WorkoutLetter } from '@/types/database'
import { currentDayOfWeek } from '@/lib/utils/weekday'

const ROTATION: WorkoutLetter[] = ['A', 'B', 'C', 'D', 'E', 'F']

/** Convenção de `currentDayOfWeek()`: 1 = segunda ... 6 = sábado, 7 = domingo. */
export const ACTIVE_RECOVERY_DAY_OF_WEEK = 4 // quinta-feira
export const REST_DAY_OF_WEEK = 7 // domingo

export type ScheduleMode = 'six_days' | 'five_days_rotating'

/**
 * No modo de cinco dias, os seis treinos continuam intactos e rodam entre
 * semanas. Assim não há duas sessões amontoadas nem volume removido do ciclo.
 */
export function rotatingCycle(startAfter: WorkoutLetter | null, sessions: number): WorkoutLetter[] {
  const start = startAfter === null ? 0 : (ROTATION.indexOf(startAfter) + 1) % ROTATION.length
  return Array.from({ length: sessions }, (_, index) => ROTATION[(start + index) % ROTATION.length])
}

/**
 * A agenda é uma rotação, não uma regra de calendário: após concluir ou
 * pular um treino, o próximo é sempre a letra seguinte. O dia da semana só
 * serve como previsão visual e nunca descarta uma sessão pendente.
 */
export function nextRotatingWorkout(
  _scheduledToday: WorkoutLetter | null,
  lastCompleted: WorkoutLetter | null
): WorkoutLetter | null {
  if (lastCompleted === null) return ROTATION[0]
  const index = ROTATION.indexOf(lastCompleted)
  return ROTATION[(index + 1) % ROTATION.length]
}

/**
 * Estado do dia: `training` (sessão A–F disponível hoje), `active_recovery`
 * (quinta-feira) ou `rest` (domingo). Recuperação/descanso nunca consomem
 * nem avançam a sequência A–F — a sessão pendente simplesmente continua
 * pendente para o próximo dia de treino, e por isso `nextSession` é sempre a
 * mesma letra que já estava pendente (`pendingSession`).
 *
 * `pendingSession` deve vir de `getSuggestedWorkout()`, que já calcula a
 * rotação contínua a partir da última sessão concluída ou do último pulo —
 * nunca do dia da semana. Este helper só decide SE hoje é dia de treinar
 * essa sessão pendente, ou se hoje é recuperação/descanso.
 */
export type DayState =
  | { kind: 'training'; currentSession: WorkoutLetter; nextSession: WorkoutLetter }
  | { kind: 'active_recovery'; nextSession: WorkoutLetter }
  | { kind: 'rest'; nextSession: WorkoutLetter }

export function getCurrentDayState(
  pendingSession: WorkoutLetter,
  now: Date = new Date(),
  timeZone?: string
): DayState {
  const day = timeZone === undefined ? currentDayOfWeek(now) : currentDayOfWeek(now, timeZone)

  if (day === ACTIVE_RECOVERY_DAY_OF_WEEK) {
    return { kind: 'active_recovery', nextSession: pendingSession }
  }
  if (day === REST_DAY_OF_WEEK) {
    return { kind: 'rest', nextSession: pendingSession }
  }
  return {
    kind: 'training',
    currentSession: pendingSession,
    nextSession: nextRotatingWorkout(null, pendingSession) ?? pendingSession,
  }
}
