import type { WorkoutLetter } from '@/types/database'

const WORKOUT_LETTERS = new Set<WorkoutLetter>(['A', 'B', 'C', 'D', 'E', 'F'])

export type WorkoutEntrySource = 'dashboard' | 'treinos'

export function exerciseDetailHref(
  exerciseId: string,
  context?: { workoutLetter: WorkoutLetter; workoutSource: WorkoutEntrySource }
) {
  if (!context) return `/exercicios/${exerciseId}`

  const params = new URLSearchParams({
    from: 'treino',
    workout: context.workoutLetter,
    workoutSource: context.workoutSource,
  })
  return `/exercicios/${exerciseId}?${params.toString()}`
}

export function exerciseDetailBackHref(params: {
  from?: string
  workout?: string
  workoutSource?: string
}) {
  const letter = params.workout?.toUpperCase() as WorkoutLetter | undefined
  if (params.from !== 'treino' || !letter || !WORKOUT_LETTERS.has(letter)) {
    return '/exercicios'
  }

  const source: WorkoutEntrySource =
    params.workoutSource === 'dashboard' ? 'dashboard' : 'treinos'
  return `/treino/${letter}?from=${source}`
}
