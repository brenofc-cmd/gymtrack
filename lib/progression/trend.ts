/**
 * Tendência de desempenho por exercício em janelas móveis de 4, 6 ou 8 semanas.
 *
 * A janela é uma LENTE DE OBSERVAÇÃO, não um cronômetro de troca: nada aqui
 * obriga a substituir exercício ao fim de 8 semanas. O objetivo é dar nome ao
 * que está acontecendo, com honestidade sobre incerteza — uma sessão ruim
 * isolada nunca vira diagnóstico de estagnação.
 *
 * Módulo puro: recebe sessões já agregadas e devolve a classificação.
 */

export type TrendWindow = 4 | 6 | 8

export type TrendSessionPoint = {
  /** ISO da data em que a sessão terminou */
  date: string
  /** Maior carga válida da sessão (kg); null quando o exercício não usa carga */
  maxWeight: number | null
  /** Maior número de repetições numa série válida */
  maxReps: number
  /** Séries válidas registradas */
  sets: number
  /** Volume da sessão (carga × reps somadas) */
  volume: number
  /** RIR médio informado nas séries válidas; null se não registrado */
  avgRir: number | null
  /** true quando alguma série teve execução marcada como ruim */
  hadPoorExecution: boolean
  /** true quando alguma série teve dor moderada ou forte */
  hadBlockingPain: boolean
  /** true quando a sessão foi feita sob prontidão baixa */
  lowReadiness?: boolean
}

export type TrendState =
  | 'evoluindo'
  | 'estavel'
  | 'dados_insuficientes'
  | 'possivel_estagnacao'
  | 'recuperacao_prejudicada'
  | 'tecnica_inconsistente'

export type TrendResult = {
  state: TrendState
  label: string
  /** Frase curta explicando o motivo — sempre exibida junto do estado */
  reason: string
  window: TrendWindow
  sessions: number
  /** Variação percentual da melhor carga entre o início e o fim da janela */
  weightChangePct: number | null
  /** Variação absoluta de repetições da melhor série */
  repsChange: number | null
  /** Sessões esperadas × registradas na janela (frequência 2×/semana) */
  consistency: { expected: number; logged: number }
  bestSet: { weight: number | null; reps: number; date: string } | null
}

export const TREND_LABEL: Record<TrendState, string> = {
  evoluindo: 'Evoluindo',
  estavel: 'Estável',
  dados_insuficientes: 'Dados insuficientes',
  possivel_estagnacao: 'Possível estagnação',
  recuperacao_prejudicada: 'Desempenho prejudicado por recuperação',
  tecnica_inconsistente: 'Técnica inconsistente',
}

const MIN_SESSIONS_FOR_TREND = 3
/** Frequência da rotina v4: cada exercício aparece ~1×/semana no seu treino */
const EXPECTED_SESSIONS_PER_WEEK = 1
const MEANINGFUL_WEIGHT_CHANGE = 0.025
const POOR_EXECUTION_RATIO = 0.4
const LOW_READINESS_RATIO = 0.5

function averageOfFirstAndLast(
  points: TrendSessionPoint[],
  pick: (point: TrendSessionPoint) => number | null
): { start: number | null; end: number | null } {
  const values = points.map(pick)
  const firstValid = values.find((value) => value != null) ?? null
  const lastValid = [...values].reverse().find((value) => value != null) ?? null
  return { start: firstValid, end: lastValid }
}

/**
 * @param sessions sessões da janela, da mais ANTIGA para a mais recente
 */
export function analyzeTrend(
  sessions: TrendSessionPoint[],
  window: TrendWindow
): TrendResult {
  const expected = window * EXPECTED_SESSIONS_PER_WEEK
  const consistency = { expected, logged: sessions.length }

  const bestSet = sessions.reduce<TrendResult['bestSet']>((best, session) => {
    const candidate = { weight: session.maxWeight, reps: session.maxReps, date: session.date }
    if (!best) return candidate
    const bestWeight = best.weight ?? 0
    const candidateWeight = candidate.weight ?? 0
    if (candidateWeight > bestWeight) return candidate
    if (candidateWeight === bestWeight && candidate.reps > best.reps) return candidate
    return best
  }, null)

  const base: Omit<TrendResult, 'state' | 'label' | 'reason'> = {
    window,
    sessions: sessions.length,
    weightChangePct: null,
    repsChange: null,
    consistency,
    bestSet,
  }

  if (sessions.length < MIN_SESSIONS_FOR_TREND) {
    return {
      ...base,
      state: 'dados_insuficientes',
      label: TREND_LABEL.dados_insuficientes,
      reason: `Só ${sessions.length} ${sessions.length === 1 ? 'sessão registrada' : 'sessões registradas'} nesta janela. São necessárias ao menos ${MIN_SESSIONS_FOR_TREND} para falar em tendência.`,
    }
  }

  const weights = averageOfFirstAndLast(sessions, (session) => session.maxWeight)
  const weightChangePct =
    weights.start != null && weights.end != null && weights.start > 0
      ? (weights.end - weights.start) / weights.start
      : null

  const repsChange = sessions[sessions.length - 1].maxReps - sessions[0].maxReps
  const withMetrics: Omit<TrendResult, 'state' | 'label' | 'reason'> = {
    ...base,
    weightChangePct,
    repsChange,
  }

  // Técnica e dor vêm antes de qualquer julgamento de carga: progresso medido
  // sobre execução ruim não é progresso.
  const poorExecution = sessions.filter((session) => session.hadPoorExecution).length
  if (poorExecution / sessions.length >= POOR_EXECUTION_RATIO) {
    return {
      ...withMetrics,
      state: 'tecnica_inconsistente',
      label: TREND_LABEL.tecnica_inconsistente,
      reason: `Execução marcada como ruim em ${poorExecution} de ${sessions.length} sessões. Estabilize a técnica antes de julgar carga.`,
    }
  }

  const lowReadiness = sessions.filter(
    (session) => session.lowReadiness || session.hadBlockingPain
  ).length
  if (lowReadiness / sessions.length >= LOW_READINESS_RATIO) {
    return {
      ...withMetrics,
      state: 'recuperacao_prejudicada',
      label: TREND_LABEL.recuperacao_prejudicada,
      reason: `${lowReadiness} de ${sessions.length} sessões aconteceram com recuperação baixa ou dor. O desempenho aqui diz mais sobre recuperação do que sobre o exercício.`,
    }
  }

  if (weightChangePct != null && weightChangePct >= MEANINGFUL_WEIGHT_CHANGE) {
    return {
      ...withMetrics,
      state: 'evoluindo',
      label: TREND_LABEL.evoluindo,
      reason: `A melhor carga subiu ${Math.round(weightChangePct * 100)}% em ${window} semanas.`,
    }
  }

  if (repsChange > 0 && (weightChangePct == null || weightChangePct >= 0)) {
    return {
      ...withMetrics,
      state: 'evoluindo',
      label: TREND_LABEL.evoluindo,
      reason: `Mesma carga, mas ${repsChange} repetição${repsChange === 1 ? '' : 'ões'} a mais na melhor série. Repetição também é progresso.`,
    }
  }

  // Estagnação exige a janela cheia de dados: uma sessão fraca não basta.
  const stalled =
    (weightChangePct == null || Math.abs(weightChangePct) < MEANINGFUL_WEIGHT_CHANGE) &&
    repsChange <= 0
  if (stalled && sessions.length >= expected - 1) {
    return {
      ...withMetrics,
      state: 'possivel_estagnacao',
      label: TREND_LABEL.possivel_estagnacao,
      reason: `Carga e repetições praticamente iguais em ${sessions.length} sessões ao longo de ${window} semanas, com boa execução e recuperação. Vale revisar carga, descanso ou considerar uma semana de descarga.`,
    }
  }

  return {
    ...withMetrics,
    state: 'estavel',
    label: TREND_LABEL.estavel,
    reason:
      repsChange < 0
        ? 'Oscilação normal entre sessões. Sem dados suficientes para chamar de queda.'
        : 'Desempenho mantido na janela. Continue buscando o topo da faixa de repetições.',
  }
}
