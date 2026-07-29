import type { WorkoutLetter } from '@/types/database'

const ROTATION: WorkoutLetter[] = ['A', 'B', 'C', 'D', 'E', 'F']

export type ScheduleMode = 'six_days' | 'five_days_rotating'

/**
 * No modo de cinco dias, os seis treinos continuam intactos e rodam entre
 * semanas. Assim não há duas sessões amontoadas nem volume removido do ciclo.
 */
export function rotatingCycle(startAfter: WorkoutLetter | null, sessions: number): WorkoutLetter[] {
  const start = startAfter === null ? 0 : (ROTATION.indexOf(startAfter) + 1) % ROTATION.length
  return Array.from({ length: sessions }, (_, index) => ROTATION[(start + index) % ROTATION.length])
}

/** Mantém domingo como descanso e continua a sequência quando um dia é perdido. */
export function nextRotatingWorkout(
  scheduledToday: WorkoutLetter | null,
  lastCompleted: WorkoutLetter | null
): WorkoutLetter | null {
  if (scheduledToday === null) return null
  if (lastCompleted === null) return scheduledToday
  const index = ROTATION.indexOf(lastCompleted)
  return ROTATION[(index + 1) % ROTATION.length]
}
