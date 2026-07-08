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

/** Arredonda para o incremento de 2.5kg mais próximo (anilhas comuns). */
function roundToPlate(kg: number): number {
  return Math.max(0, Math.round(kg / 2.5) * 2.5)
}

export function buildWarmupPlan(workingWeightKg: number | null): WarmupSet[] {
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
