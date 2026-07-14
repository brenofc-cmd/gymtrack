/**
 * Sugestão de aquecimento antes do primeiro exercício composto do treino.
 *
 * Proporções aproximadas (não são regra absoluta):
 *   ~40% da carga de trabalho × 8–12
 *   ~60% × 5–6
 *   ~75–80% × 2–4
 *
 * As séries de aquecimento não contam no volume válido e não devem
 * chegar perto da falha.
 */

export interface WarmupSet {
  label: string
  weightKg: number | null
  reps: string
}

export type WarmupMode = 'standard' | 'assistance' | 'bodyweight'

/** Arredonda para o incremento de 2.5kg mais próximo (anilhas comuns). */
function roundToPlate(kg: number): number {
  return Math.max(0, Math.round(kg / 2.5) * 2.5)
}

export function buildWarmupPlan(
  workingWeightKg: number | null,
  mode: WarmupMode = 'standard'
): WarmupSet[] {
  if (mode === 'assistance') {
    const lightAssistance = workingWeightKg == null ? null : roundToPlate(workingWeightKg + 10)
    const mediumAssistance = workingWeightKg == null ? null : roundToPlate(workingWeightKg + 5)
    return [
      { label: 'Geral', weightKg: null, reps: '~5 min leves (mobilidade e ativação)' },
      { label: 'Leve', weightKg: lightAssistance, reps: '8–10 reps com mais assistência' },
      { label: 'Média', weightKg: mediumAssistance, reps: '5–6 reps com assistência confortável' },
      { label: 'Aproximação', weightKg: workingWeightKg, reps: '2–4 reps, longe da falha' },
    ]
  }

  if (mode === 'bodyweight') {
    return [
      { label: 'Geral', weightKg: null, reps: '~5 min leves (mobilidade e ativação)' },
      { label: 'Técnica', weightKg: null, reps: '6–8 repetições controladas' },
      { label: 'Aproximação', weightKg: null, reps: '3–5 repetições, longe da falha' },
    ]
  }

  if (workingWeightKg == null || workingWeightKg <= 0) {
    return [
      { label: 'Geral', weightKg: null, reps: '~5 min leves (esteira, bike ou mobilidade)' },
      { label: '~40%', weightKg: null, reps: '8–12 repetições leves' },
      { label: '~60%', weightKg: null, reps: '5–6 repetições' },
      { label: '~75–80%', weightKg: null, reps: '2–4 repetições' },
    ]
  }

  return [
    { label: 'Geral', weightKg: null, reps: '~5 min leves (esteira, bike ou mobilidade)' },
    { label: '~40%', weightKg: roundToPlate(workingWeightKg * 0.4), reps: '8–12 repetições' },
    { label: '~60%', weightKg: roundToPlate(workingWeightKg * 0.6), reps: '5–6 repetições' },
    { label: '~75–80%', weightKg: roundToPlate(workingWeightKg * 0.775), reps: '2–4 repetições' },
  ]
}
