import type { ExecutionQuality, PainLevel, RomQuality } from '@/types/database'
export type { RomQuality } from '@/types/database'

export interface StrengthSet {
  weightKg: number | null
  reps: number
  isWarmup: boolean
  rir?: number | null
  painLevel?: PainLevel | null
  executionQuality?: ExecutionQuality | null
  romQuality?: RomQuality | null
}

/**
 * Epley com RIR: peso × (1 + (repetições + RIR) / 30). Somente 3–8 reps
 * válidas, com RIR relatado (sem RIR não há como estimar a reserva real).
 */
export function estimated1RM(set: StrengthSet): number | null {
  if (
    set.isWarmup || set.weightKg == null || set.weightKg <= 0 ||
    set.reps < 3 || set.reps > 8 || set.rir == null ||
    set.executionQuality !== 'boa' ||
    set.painLevel !== 'nenhuma' || set.romQuality === 'reduzida'
  ) return null

  return Math.round(set.weightKg * (1 + (set.reps + set.rir) / 30) * 10) / 10
}

export function isValidPRSet(set: StrengthSet): boolean {
  return !set.isWarmup && set.weightKg != null && set.weightKg > 0 && set.reps > 0 &&
    set.executionQuality !== 'ruim' &&
    set.painLevel !== 'moderada' && set.painLevel !== 'forte' &&
    set.romQuality !== 'reduzida'
}

export function backoffWeight(topWeightKg: number, reductionPct: number, incrementKg = 1): number {
  const raw = topWeightKg * (1 - reductionPct / 100)
  return Math.max(0, Math.round(raw / incrementKg) * incrementKg)
}
