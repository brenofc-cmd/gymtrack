export type TrainingStimulus = 'strength' | 'mixed' | 'hypertrophy'

export const TRAINING_STIMULUS_LABEL: Record<TrainingStimulus, string> = {
  strength: 'Força',
  mixed: 'Força + hipertrofia',
  hypertrophy: 'Hipertrofia',
}

export function classifyExerciseStimulus(exercise: {
  prescription_type?: string | null
  target_reps_min: number
  target_reps_max: number
  exercise_type?: string | null
}) {
  if (exercise.prescription_type === 'rep_max_effort' || exercise.target_reps_max <= 5) {
    return 'strength' as const
  }
  if (exercise.exercise_type === 'composto' && exercise.target_reps_max <= 8) {
    return 'mixed' as const
  }
  return 'hypertrophy' as const
}
