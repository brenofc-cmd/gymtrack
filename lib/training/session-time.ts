export const GYM_SESSION_LIMIT_MINUTES = 75
export const GYM_SESSION_WARNING_MINUTES = 65

export interface TimedWorkoutExercise {
  target_sets: number
  rest_seconds: number
}

export interface WorkoutTimeEstimate {
  warmupMinutes: number
  mainMinutes: number
  coreMinutes: number
  totalMinutes: number
  exceedsLimit: boolean
}

export function estimateWorkoutTime(
  exercises: TimedWorkoutExercise[],
  coreMinutes = 0,
  warmupMinutes = 8
): WorkoutTimeEstimate {
  const mainSeconds = exercises.reduce((total, exercise) => {
    const sets = Math.max(0, exercise.target_sets)
    const execution = sets * 45
    const rests = Math.max(0, sets - 1) * Math.max(0, exercise.rest_seconds)
    return total + execution + rests
  }, 0)
  const mainMinutes = Math.ceil(mainSeconds / 60)
  const totalMinutes = warmupMinutes + mainMinutes + coreMinutes
  return {
    warmupMinutes,
    mainMinutes,
    coreMinutes,
    totalMinutes,
    exceedsLimit: totalMinutes > GYM_SESSION_LIMIT_MINUTES,
  }
}

export function workoutTimeStatus(elapsedSeconds: number): 'normal' | 'warning' | 'limit' {
  const elapsedMinutes = elapsedSeconds / 60
  if (elapsedMinutes >= GYM_SESSION_LIMIT_MINUTES) return 'limit'
  if (elapsedMinutes >= GYM_SESSION_WARNING_MINUTES) return 'warning'
  return 'normal'
}
