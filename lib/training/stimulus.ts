export type TrainingStimulus = 'max_strength' | 'strength' | 'hypertrophy'

export const TRAINING_STIMULUS_LABEL: Record<TrainingStimulus, string> = {
  max_strength: 'Força máxima',
  strength: 'Força',
  hypertrophy: 'Hipertrofia',
}

/**
 * Classificação por exercício. Categorias fixas (não usar "misto" aqui —
 * "misto" existe apenas no nível do dia, ver `dayStimulusSummary`):
 *  - FORÇA MÁXIMA: esforço de 1RM/3RM/5RM (prescription_type = rep_max_effort).
 *  - FORÇA: séries de até 6 repetições que não são esforço de RM.
 *  - HIPERTROFIA: séries de 8+ repetições e acessórios.
 */
export function classifyExerciseStimulus(exercise: {
  prescription_type?: string | null
  target_reps_min: number
  target_reps_max: number
  exercise_type?: string | null
}): TrainingStimulus {
  if (exercise.prescription_type === 'rep_max_effort') return 'max_strength'
  if (exercise.target_reps_max <= 6) return 'strength'
  return 'hypertrophy'
}

/**
 * Rótulo "MISTO — ..." de um dia, calculado a partir da composição real dos
 * exercícios. Só retorna algo quando o dia realmente tem um esforço de RM
 * (ex.: David Laid Powerbuilding DUP — Gymshark Exact v7); rotinas sem RM
 * seguem usando apenas o WorkoutFocusBadge existente.
 */
export function dayStimulusSummary(
  exercises: Array<{
    prescription_type?: string | null
    target_reps_min: number
    target_reps_max: number
  }>
): string | null {
  const classes = new Set(exercises.map(classifyExerciseStimulus))
  if (!classes.has('max_strength')) return null
  const parts = ['força máxima']
  if (classes.has('strength')) parts.push('força')
  if (classes.has('hypertrophy')) parts.push('hipertrofia')
  const joined = parts.length <= 2
    ? parts.join(' e ')
    : `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`
  return `MISTO — ${joined}`
}
