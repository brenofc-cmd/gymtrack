import type { PainLevel } from '@/types/database'
import type { FailureRiskLevel } from '@/lib/routine/powerbuilding-v4'

export interface FailureContext {
  allowedByExercise: boolean
  riskLevel: FailureRiskLevel
  isLastSet: boolean
  painLevel: PainLevel | null
  readiness: 'ready' | 'attention' | 'low_recovery' | 'stop_for_pain'
  weeksAdapted: number
}

export function canApproachFailure(context: FailureContext): { allowed: boolean; reason: string } {
  if (!context.allowedByExercise || context.riskLevel === 'high') {
    return { allowed: false, reason: 'Falha bloqueada para este exercício ou nível de risco.' }
  }
  if (!context.isLastSet) return { allowed: false, reason: 'Somente a última série pode se aproximar da falha.' }
  if (context.weeksAdapted < 3) return { allowed: false, reason: 'Mantenha RIR 2–3 nas primeiras semanas de adaptação.' }
  if (context.painLevel !== null && context.painLevel !== 'nenhuma') {
    return { allowed: false, reason: 'Dor ou desconforto bloqueia a aproximação da falha.' }
  }
  if (context.readiness !== 'ready') return { allowed: false, reason: 'A recuperação de hoje não favorece RIR 0–1.' }
  return { allowed: true, reason: 'Opcional na última série, com técnica controlada; não é obrigatório.' }
}
