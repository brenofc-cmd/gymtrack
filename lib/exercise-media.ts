// Placeholder NEUTRO e explicitamente rotulado ("Imagem indisponível") —
// nunca a foto de outro exercício, que induziria execução errada (P1.4).
export const DEFAULT_EXERCISE_IMAGE = '/exercises/placeholder.svg'

export function getExerciseImage(imageUrl: string | null | undefined) {
  return imageUrl?.trim() || DEFAULT_EXERCISE_IMAGE
}
