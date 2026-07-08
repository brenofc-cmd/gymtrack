/**
 * Análise simples de recuperação (sem diagnóstico de overtraining).
 *
 * Se o volume total de um treino caiu por 2+ sessões consecutivas, sugere
 * discretamente estratégias de recuperação (manter carga, subir RIR,
 * reduzir séries temporariamente, dia extra de descanso, revisar sono).
 */

export interface SessionVolumePoint {
  /** volume total (kg × reps) das séries válidas da sessão */
  volume: number
  finishedAt: string
}

export interface RecoveryAlert {
  message: string
  suggestions: string[]
}

/**
 * Recebe as sessões concluídas de UM treino, da mais antiga para a mais
 * recente, e devolve um alerta se houver queda de volume em 2+ sessões
 * consecutivas.
 */
export function analyzeRecovery(points: SessionVolumePoint[]): RecoveryAlert | null {
  if (points.length < 3) return null

  const lastThree = points.slice(-3)
  const dropped =
    lastThree[1].volume < lastThree[0].volume &&
    lastThree[2].volume < lastThree[1].volume

  if (!dropped) return null

  return {
    message:
      'Seu desempenho caiu nas últimas duas sessões deste treino. Pode ser acúmulo de fadiga.',
    suggestions: [
      'Manter as cargas atuais (sem buscar aumento)',
      'Trabalhar com 1 repetição a mais de sobra (RIR maior)',
      'Reduzir temporariamente 1 série dos exercícios isoladores',
      'Fazer um dia adicional de descanso',
      'Revisar sono e alimentação',
      'Se houver dor persistente, procurar um profissional',
    ],
  }
}
