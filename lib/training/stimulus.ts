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
  // guided_top_set (David Laid Guided Load v7): mesmo esforço de RM da fonte,
  // transformado em série técnica de repetições fixas com RIR-alvo — ainda
  // é força máxima para fins de classificação do exercício/dia.
  if (exercise.prescription_type === 'rep_max_effort' || exercise.prescription_type === 'guided_top_set') return 'max_strength'
  if (exercise.target_reps_max <= 6) return 'strength'
  return 'hypertrophy'
}

/**
 * Indicação de carga por tipo de estímulo — para o atleta ter uma ideia do
 * peso antes de começar as séries. Não substitui a prescrição (séries/reps/
 * RM seguem exatas); é só uma referência de "quão pesado" carregar a barra.
 */
export const LOAD_INTENSITY_LABEL: Record<TrainingStimulus, string> = {
  max_strength: 'Peso máximo',
  strength: 'Peso pesado',
  hypertrophy: 'Peso leve a moderado',
}

export const LOAD_INTENSITY_HINT: Record<TrainingStimulus, string> = {
  max_strength: 'Suba progressivamente nas séries de aquecimento até a carga máxima que você conseguir mover hoje com boa técnica.',
  strength: 'Use uma carga pesada — deixe poucas repetições na reserva, mas sem ir ao esforço máximo.',
  hypertrophy: 'Use uma carga leve a moderada, com folga suficiente para completar todas as séries com boa execução.',
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
