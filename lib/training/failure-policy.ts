/**
 * Política única de proximidade da falha.
 *
 * Escopo deliberado (decisão do usuário em 29/07/2026): esta política governa
 * a PRESCRIÇÃO internamente — não existe, e não deve ser criada, nenhuma
 * exposição na interface (badge de "falha permitida", aviso de "vá à falha",
 * bônus de progressão por RIR 0 ou qualquer regra que torne a falha
 * obrigatória/frequente). O usuário registra RIR 0 quando ele realmente
 * acontece; o app não pede nem premia isso. RIR segue como parâmetro interno
 * de controle de intensidade.
 */
import type { PainLevel } from '@/types/database'
import type { FailureRiskLevel } from '@/lib/routine/powerbuilding-v4'
import type { TrainingPhase } from '@/lib/training/phase'

export interface FailureContext {
  allowedByExercise: boolean
  riskLevel: FailureRiskLevel
  isLastSet: boolean
  painLevel: PainLevel | null
  readiness: 'ready' | 'attention' | 'low_recovery' | 'stop_for_pain'
  weeksAdapted: number
  /** Fase de treinamento; ausente = fundamentals (padrão conservador) */
  phase?: TrainingPhase
}

export function canApproachFailure(context: FailureContext): { allowed: boolean; reason: string } {
  // A fase Fundamentos não planeja aproximação da falha em nenhum exercício.
  if ((context.phase ?? 'fundamentals') === 'fundamentals') {
    return {
      allowed: false,
      reason: 'Fase Fundamentos: a prescrição prioriza execução e consistência, sem planejar proximidade da falha.',
    }
  }
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
