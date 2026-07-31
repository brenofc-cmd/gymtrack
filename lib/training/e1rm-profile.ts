/**
 * Perfil de força (exercise_reference_maxes): mediana das 3 estimativas
 * válidas mais recentes, limitada a no máximo 5% de mudança por sessão em
 * relação ao valor anterior. Sempre exibido como "1RM estimado", nunca
 * "máximo real". As séries válidas já vêm filtradas por
 * `lib/training/strength.ts::estimated1RM` (3–8 reps, técnica boa, sem dor,
 * ROM não reduzida, RIR informado) — top sets de 1 repetição e séries de
 * 10/12 repetições nunca chegam aqui porque `estimated1RM` já retorna null
 * para elas.
 */

export type ConfidenceLevel = 'baixa' | 'media' | 'alta'

export interface ValidE1rmSample {
  estimatedOneRepMaxKg: number
  recordedAt: string
}

export interface E1rmProfileUpdate {
  estimatedOneRepMaxKg: number | null
  validSampleCount: number
  confidenceLevel: ConfidenceLevel
  cappedByFivePercentRule: boolean
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/**
 * Nível de confiança: quantidade de amostras válidas acumuladas para o
 * exercício. Não é uma regra da fonte — é heurística do GymTrack, exibida
 * apenas para dar contexto sobre a maturidade da estimativa.
 */
function confidenceFromSampleCount(count: number): ConfidenceLevel {
  if (count >= 6) return 'alta'
  if (count >= 3) return 'media'
  return 'baixa'
}

/**
 * @param recentValidSamples amostras válidas mais recentes primeiro (ordenadas por recordedAt desc)
 * @param previousEstimatedOneRepMaxKg valor anterior salvo em exercise_reference_maxes.estimated_1rm
 */
export function computeE1rmProfileUpdate(
  recentValidSamples: ValidE1rmSample[],
  previousEstimatedOneRepMaxKg: number | null
): E1rmProfileUpdate {
  const validSampleCount = recentValidSamples.length
  if (validSampleCount === 0) {
    return {
      estimatedOneRepMaxKg: previousEstimatedOneRepMaxKg,
      validSampleCount: 0,
      confidenceLevel: 'baixa',
      cappedByFivePercentRule: false,
    }
  }

  const lastThree = recentValidSamples.slice(0, 3).map((s) => s.estimatedOneRepMaxKg)
  const rawMedian = median(lastThree)

  let capped = false
  let nextValue = rawMedian
  if (previousEstimatedOneRepMaxKg != null && previousEstimatedOneRepMaxKg > 0) {
    const maxChange = previousEstimatedOneRepMaxKg * 0.05
    const delta = rawMedian - previousEstimatedOneRepMaxKg
    if (Math.abs(delta) > maxChange) {
      nextValue = previousEstimatedOneRepMaxKg + Math.sign(delta) * maxChange
      capped = true
    }
  }

  return {
    estimatedOneRepMaxKg: Math.round(nextValue * 100) / 100,
    validSampleCount,
    confidenceLevel: confidenceFromSampleCount(validSampleCount),
    cappedByFivePercentRule: capped,
  }
}
