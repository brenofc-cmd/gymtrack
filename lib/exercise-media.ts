export const DEFAULT_EXERCISE_IMAGE = '/exercises/Barbell_Full_Squat.jpg'

export function getExerciseImage(imageUrl: string | null | undefined) {
  return imageUrl?.trim() || DEFAULT_EXERCISE_IMAGE
}
