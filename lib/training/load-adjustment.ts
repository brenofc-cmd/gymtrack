/**
 * Ajuste de carga entre séries e entre sessões. Pura decisão/explicação —
 * quem aplica o percentual/incremento à carga real e arredonda para o
 * executável é `lib/progression/plate-calculator.ts`.
 */

export type SetTechnique = 'boa' | 'comecando_a_perder' | 'comprometida'
export type SetPain = 'sem_dor' | 'esforco_muscular_normal' | 'desconforto_articular' | 'dor_aguda'
export type LoadAdjustmentDirection = 'increase' | 'maintain' | 'decrease' | 'stop_exercise'

export interface IntraSetAdjustmentInput {
  repsCompleted: number
  targetReps: number
  actualRir: number | null
  technique: SetTechnique
  pain: SetPain
}

export interface LoadAdjustmentDecision {
  direction: LoadAdjustmentDirection
  magnitudePct?: [number, number]
  useSmallestIncrement?: boolean
  countsForRecord: boolean
  reason: string
}

/** Ajuste imediato para a próxima série/sessão do mesmo exercício. */
export function decideIntraSetAdjustment(input: IntraSetAdjustmentInput): LoadAdjustmentDecision {
  if (input.pain === 'dor_aguda') {
    return {
      direction: 'stop_exercise',
      countsForRecord: false,
      reason: 'Dor aguda: encerre o exercício. Esta série não entra no cálculo. Considere avaliação profissional.',
    }
  }

  const failedReps = input.repsCompleted < input.targetReps

  if (input.technique === 'comprometida') {
    return {
      direction: 'decrease',
      magnitudePct: [5, 10],
      countsForRecord: false,
      reason: 'Técnica comprometida: reduza a carga. Execução tem prioridade sobre a carga.',
    }
  }

  if (failedReps) {
    return {
      direction: 'decrease',
      magnitudePct: [5, 10],
      countsForRecord: false,
      reason: 'Falha antes de completar as repetições-alvo.',
    }
  }

  if (input.technique === 'comecando_a_perder') {
    return {
      direction: 'maintain',
      useSmallestIncrement: true,
      countsForRecord: false,
      reason: 'Técnica começou a perder: não aumente; mantenha ou reduza o menor incremento.',
    }
  }

  const rir = input.actualRir
  if (rir == null) {
    return { direction: 'maintain', countsForRecord: true, reason: 'RIR não informado — mantendo carga por precaução.' }
  }
  if (rir >= 4) {
    return { direction: 'increase', magnitudePct: [2.5, 5], countsForRecord: true, reason: 'RIR 4+: reserva alta, aumente até o menor incremento seguro.' }
  }
  if (rir === 3) {
    return { direction: 'increase', useSmallestIncrement: true, countsForRecord: true, reason: 'RIR 3: mantenha ou suba o menor incremento.' }
  }
  if (rir === 2) {
    return { direction: 'maintain', countsForRecord: true, reason: 'RIR 2: no alvo, mantenha.' }
  }
  if (rir === 1) {
    return { direction: 'maintain', useSmallestIncrement: true, countsForRecord: true, reason: 'RIR 1: mantenha ou reduza o menor incremento.' }
  }
  return { direction: 'decrease', magnitudePct: [5, 5], countsForRecord: true, reason: 'RIR 0: sem reserva, reduza cerca de 5%.' }
}

export interface CompositeSessionAdjustmentInput {
  allSetsCompleted: boolean
  techniqueGoodThroughout: boolean
  finalRir: number | null
  targetRirMin: number
  isUpperBody: boolean
}

export interface SessionAdjustmentDecision {
  direction: 'increase' | 'maintain' | 'decrease'
  maxIncreaseKg?: number
  decreasePct?: [number, number]
  updateE1rm: boolean
  reason: string
}

/** Compostos: limite de 2,5 kg (membros superiores) ou 5 kg (agachamento/terra) por atualização. */
export function decideCompositeSessionAdjustment(input: CompositeSessionAdjustmentInput): SessionAdjustmentDecision {
  if (!input.allSetsCompleted) {
    return { direction: 'decrease', decreasePct: [2.5, 5], updateE1rm: false, reason: 'Falha: reduza 2,5–5% e não eleve o e1RM.' }
  }
  if (input.finalRir === 1) {
    return { direction: 'maintain', updateE1rm: false, reason: 'Tudo concluído com RIR 1: mantenha.' }
  }
  if (input.techniqueGoodThroughout && input.finalRir != null && input.finalRir >= input.targetRirMin) {
    return {
      direction: 'increase',
      maxIncreaseKg: input.isUpperBody ? 2.5 : 5,
      updateE1rm: true,
      reason: 'Todas as séries concluídas, técnica boa e RIR no alvo ou acima: atualize o e1RM e recalcule.',
    }
  }
  return { direction: 'maintain', updateE1rm: false, reason: 'Sem critério claro de progressão nesta sessão: mantenha.' }
}

export interface AccessorySessionAdjustmentInput {
  allSetsCompleted: boolean
  techniqueGoodThroughout: boolean
  finalRir: number | null
}

export interface AccessoryAdjustmentDecision {
  direction: 'increase' | 'maintain' | 'decrease'
  useSmallestIncrement?: boolean
  reason: string
}

export function decideAccessorySessionAdjustment(input: AccessorySessionAdjustmentInput): AccessoryAdjustmentDecision {
  if (!input.allSetsCompleted) {
    return { direction: 'decrease', useSmallestIncrement: true, reason: 'Falhou ou não completou: reduza um incremento, ou mantenha com orientação se o salto do equipamento for grande.' }
  }
  if (input.finalRir === 1) {
    return { direction: 'maintain', reason: 'RIR 1 no final: mantenha.' }
  }
  if (input.techniqueGoodThroughout && input.finalRir != null && input.finalRir >= 2) {
    return { direction: 'increase', useSmallestIncrement: true, reason: 'Todas as séries concluídas, técnica boa e RIR final ≥2: suba o menor incremento.' }
  }
  return { direction: 'maintain', reason: 'Sem critério claro de progressão: mantenha.' }
}
