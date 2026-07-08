/**
 * Progressão dupla — regras da rotina v2.
 *
 * 1. Manter a carga enquanto as séries não atingirem o topo da faixa.
 * 2. Aumentar a carga somente quando TODAS as séries válidas atingirem o
 *    topo da faixa, com técnica boa, RIR dentro da meta e sem dor.
 * 3. Reduzir/revisar quando 2+ séries ficarem abaixo do mínimo, técnica
 *    ruim ou dor relevante.
 * 4. Dor moderada/forte bloqueia qualquer sugestão de aumento.
 */

import type { ExecutionQuality, ExerciseType, MovementPattern, PainLevel } from '@/types/database'

export interface SetPerformance {
  weightKg: number | null
  reps: number
  rir: number | null
  isWarmup: boolean
  painLevel?: PainLevel | null
  executionQuality?: ExecutionQuality | null
}

export interface ProgressionTarget {
  sets: number
  repsMin: number
  repsMax: number
  rirMin: number | null
  rirMax: number | null
  kind: ExerciseType | null
  movementPattern?: MovementPattern | null
}

export type ProgressionAction = 'aumentar' | 'manter' | 'revisar' | 'bloquear_por_dor'

export interface ProgressionSuggestion {
  action: ProgressionAction
  reason: string
  /** Incremento sugerido em kg (menor incremento típico do equipamento) */
  incrementKg?: number
}

const WORST_PAIN: PainLevel[] = ['moderada', 'forte']

/** Menor incremento típico: compostos 2.5kg, isoladores/abdominais 2kg (placa). */
export function smallestIncrement(kind: ExerciseType | null): number {
  return kind === 'composto' ? 2.5 : 2
}

function workingSets(sets: SetPerformance[]): SetPerformance[] {
  return sets.filter((s) => !s.isWarmup)
}

function hasBlockingPain(sets: SetPerformance[]): boolean {
  return sets.some((s) => s.painLevel != null && WORST_PAIN.includes(s.painLevel))
}

function hasBadExecution(sets: SetPerformance[]): boolean {
  return sets.some((s) => s.executionQuality === 'ruim')
}

function rirWithinTarget(sets: SetPerformance[], target: ProgressionTarget): boolean {
  if (target.rirMin == null && target.rirMax == null) return true
  return sets.every((s) => {
    if (s.rir == null) return true // sem registro de RIR não bloqueia
    if (target.rirMin != null && s.rir < target.rirMin) return false
    if (target.rirMax != null && s.rir > target.rirMax + 1) return false
    return true
  })
}

/**
 * Sugestão de progressão dupla para a próxima sessão, com base nas séries
 * válidas da última sessão do exercício.
 */
export function suggestProgression(
  target: ProgressionTarget,
  lastSessionSets: SetPerformance[]
): ProgressionSuggestion | null {
  const sets = workingSets(lastSessionSets)
  if (sets.length === 0) return null

  // Dor bloqueia progressão sempre
  if (hasBlockingPain(sets)) {
    return {
      action: 'bloquear_por_dor',
      reason:
        'Houve dor moderada ou forte na última sessão. Não aumente a carga; considere uma substituição segura e, se a dor persistir, procure avaliação profissional.',
    }
  }

  // 2+ séries abaixo do mínimo → revisar
  const belowMin = sets.filter((s) => s.reps < target.repsMin).length
  if (belowMin >= 2) {
    return {
      action: 'revisar',
      reason: `${belowMin} séries ficaram abaixo de ${target.repsMin} repetições. Reduza ou revise a carga para voltar à faixa.`,
    }
  }

  // Técnica ruim → revisar
  if (hasBadExecution(sets)) {
    return {
      action: 'revisar',
      reason: 'A execução foi marcada como ruim. Ajuste a carga e priorize a técnica antes de progredir.',
    }
  }

  // RIR real muito abaixo do planejado → revisar
  if (target.rirMin != null) {
    const muchHarder = sets.filter((s) => s.rir != null && s.rir < target.rirMin! - 1).length
    if (muchHarder >= 2) {
      return {
        action: 'revisar',
        reason: 'O esforço real ficou bem acima do planejado (RIR abaixo da meta). Revise a carga.',
      }
    }
  }

  // Todas as séries no topo da faixa, execução ok e RIR na meta → aumentar
  const completedTarget = sets.length >= target.sets
  const allAtTop = sets.every((s) => s.reps >= target.repsMax)
  if (completedTarget && allAtTop && rirWithinTarget(sets, target)) {
    return {
      action: 'aumentar',
      reason: `Todas as séries atingiram ${target.repsMax} repetições com boa execução. Aumente a carga no menor incremento disponível e aceite voltar para ~${target.repsMin} repetições.`,
      incrementKg: smallestIncrement(target.kind),
    }
  }

  return {
    action: 'manter',
    reason: `Mantenha a carga e tente melhorar repetições com técnica correta (faixa ${target.repsMin}–${target.repsMax}).`,
  }
}

/**
 * Progressão específica do abdômen.
 *
 * - flexao_tronco (cable crunch): 15 reps em todas as séries com RIR ok →
 *   menor aumento disponível na máquina.
 * - retroversao_pelvica (reverse crunch): progride por repetições/controle;
 *   NÃO sugerir carga enquanto a execução não estiver dominada (boa).
 * - anti_extensao (ab wheel): progride por controle/amplitude; qualquer dor
 *   lombar bloqueia progressão de amplitude até revisão.
 */
export function suggestAbProgression(
  target: ProgressionTarget,
  lastSessionSets: SetPerformance[]
): ProgressionSuggestion | null {
  const sets = workingSets(lastSessionSets)
  if (sets.length === 0) return null

  const pattern = target.movementPattern

  if (pattern === 'anti_extensao') {
    const anyPain = sets.some((s) => s.painLevel != null && s.painLevel !== 'nenhuma')
    if (anyPain) {
      return {
        action: 'bloquear_por_dor',
        reason:
          'Houve desconforto lombar no ab wheel. Não aumente a amplitude até revisar a execução (retroversão pélvica, glúteos contraídos). Se a dor persistir, procure avaliação profissional.',
      }
    }
    const allAtTop = sets.length >= target.sets && sets.every((s) => s.reps >= target.repsMax)
    if (allAtTop) {
      return {
        action: 'aumentar',
        reason:
          'Todas as séries no topo da faixa com controle. Progrida em amplitude ou para a próxima variação (rollout curto → maior amplitude → completo) — nunca à custa de hiperextensão lombar.',
      }
    }
    return {
      action: 'manter',
      reason: 'Progrida por controle, repetições e distância antes de aumentar a amplitude.',
    }
  }

  if (pattern === 'retroversao_pelvica') {
    if (hasBlockingPain(sets)) {
      return {
        action: 'bloquear_por_dor',
        reason: 'Houve dor na última sessão. Não progrida; revise a execução.',
      }
    }
    const executionMastered = sets.every((s) => s.executionQuality === 'boa')
    const allAtTop = sets.length >= target.sets && sets.every((s) => s.reps >= target.repsMax)
    if (allAtTop && executionMastered) {
      return {
        action: 'aumentar',
        reason:
          'Faixa completa com boa execução. Progrida por amplitude, controle excêntrico, variação mais difícil ou resistência adicional.',
      }
    }
    if (allAtTop && !executionMastered) {
      return {
        action: 'manter',
        reason:
          'Repetições no topo da faixa, mas a retroversão pélvica ainda não está dominada. Não adicione carga; melhore o controle primeiro.',
      }
    }
    return {
      action: 'manter',
      reason: 'Progrida por repetições, redução de balanço e controle da descida.',
    }
  }

  // flexao_tronco (cable crunch e similares com carga)
  return suggestProgression(target, lastSessionSets)
}

/** Escolhe a função de progressão adequada ao tipo de exercício. */
export function suggestForExercise(
  target: ProgressionTarget,
  lastSessionSets: SetPerformance[]
): ProgressionSuggestion | null {
  if (target.kind === 'abdominal') {
    return suggestAbProgression(target, lastSessionSets)
  }
  return suggestProgression(target, lastSessionSets)
}
