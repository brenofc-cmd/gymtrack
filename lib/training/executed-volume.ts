/**
 * Agregação do volume executado na semana por músculo primário.
 *
 * Regras (auditoria, Fase 3):
 * - séries de aquecimento não contam (is_warmup = true);
 * - séries com dor moderada ou forte não contam como volume válido;
 * - o músculo vem do exercício realmente executado (performed_exercise_id,
 *   preenchido em substituições) e só na ausência dele do exercício planejado.
 */

export type ExecutedSetLog = {
  is_warmup: boolean
  pain_level: string | null
  /** Exercício planejado no modelo (workout_exercises.exercise_id) */
  exercise_id: string
  /** Exercício executado de fato quando houve substituição */
  performed_exercise_id: string | null
}

const INVALID_PAIN = new Set(['moderada', 'forte'])

export function aggregateExecutedVolume(
  sets: ExecutedSetLog[],
  muscleByExerciseId: Record<string, string>
): Record<string, number> {
  const volume: Record<string, number> = {}
  for (const set of sets) {
    if (set.is_warmup) continue
    if (set.pain_level && INVALID_PAIN.has(set.pain_level)) continue
    const exerciseId = set.performed_exercise_id ?? set.exercise_id
    const muscle = muscleByExerciseId[exerciseId]
    if (!muscle) continue
    volume[muscle] = (volume[muscle] ?? 0) + 1
  }
  return volume
}
