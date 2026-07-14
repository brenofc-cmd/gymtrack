import type { ProgressionSuggestion } from '@/lib/progression/progression'

export type JointPain = 'none' | 'mild' | 'moderate' | 'severe'
export type ReadinessStatus = 'ready' | 'attention' | 'low_recovery' | 'stop_for_pain'

export interface ReadinessInput {
  sleepQuality: number
  energy: number
  muscleSoreness: number
  jointPain: JointPain
  stress: number
  motivation: number
  recoveryFeeling: number
}

export interface ReadinessRecommendation {
  status: ReadinessStatus
  score: number
  title: string
  reason: string
  actions: string[]
}

export interface LoadAdjustment {
  loadMultiplier: number
  rirDelta: number
  removeAccessorySet: boolean
}

export function readinessAdjustment(status: ReadinessStatus): LoadAdjustment {
  if (status === 'attention') return { loadMultiplier: 1, rirDelta: 1, removeAccessorySet: true }
  if (status === 'low_recovery') return { loadMultiplier: 0.925, rirDelta: 2, removeAccessorySet: true }
  if (status === 'stop_for_pain') return { loadMultiplier: 0, rirDelta: 0, removeAccessorySet: true }
  return { loadMultiplier: 1, rirDelta: 0, removeAccessorySet: false }
}

export function assessReadiness(input: ReadinessInput): ReadinessRecommendation {
  if (input.jointPain === 'moderate' || input.jointPain === 'severe') {
    return {
      status: 'stop_for_pain', score: 0, title: 'Dor pede interrupção',
      reason: 'Dor articular moderada ou forte foi registrada. Isso não é um diagnóstico.',
      actions: ['Interrompa o movimento afetado', 'Use apenas uma substituição indolor', 'Procure avaliação profissional se persistir'],
    }
  }

  const score = Math.round((
    input.sleepQuality + input.energy + (6 - input.muscleSoreness) +
    (6 - input.stress) + input.motivation + input.recoveryFeeling
  ) / 6 * 10) / 10

  if (score >= 4) return {
    status: 'ready', score, title: 'Pronto para o plano',
    reason: 'Os sinais de recuperação estão favoráveis.', actions: ['Mantenha as metas de carga, séries e RIR'],
  }
  if (score >= 3) return {
    status: 'attention', score, title: 'Treine com atenção',
    reason: 'A recuperação está intermediária.', actions: ['Aumente o RIR em 1', 'Se necessário, retire uma série de acessórios'],
  }
  return {
    status: 'low_recovery', score, title: 'Baixa recuperação',
    reason: 'Vários sinais de recuperação estão abaixo do ideal.',
    actions: ['Reduza a carga estimada em 5–10%', 'Trabalhe em RIR 3–4', 'Considere uma sessão de recuperação'],
  }
}

export function readinessGuidance(status: ReadinessStatus): string | null {
  if (status === 'attention') {
    return 'Hoje: acrescente 1 RIR e, se necessário, retire uma série de acessórios.'
  }
  if (status === 'low_recovery') {
    return 'Hoje: reduza a carga em cerca de 5–10%, trabalhe em RIR 3–4 e encurte os acessórios.'
  }
  if (status === 'stop_for_pain') {
    return 'Dor articular moderada/forte registrada: não execute o movimento afetado. Use apenas uma variação indolor ou encerre a sessão.'
  }
  return null
}

export function adjustProgressionForReadiness(
  suggestion: ProgressionSuggestion | null,
  status: ReadinessStatus
): ProgressionSuggestion | null {
  if (suggestion === null || status === 'ready') return suggestion
  if (status === 'stop_for_pain') return {
    action: 'bloquear_por_dor',
    reason: 'A prontidão de hoje registrou dor articular moderada ou forte. Não progrida; interrompa o movimento afetado.',
  }
  if (status === 'low_recovery') return {
    action: 'revisar',
    reason: 'A recuperação de hoje está baixa. Reduza a carga em cerca de 5–10%, trabalhe em RIR 3–4 e não aumente volume.',
  }
  if (suggestion.action === 'aumentar') return {
    action: 'manter',
    reason: 'O desempenho anterior permitiria progressão, mas a prontidão de hoje pede manter a carga e acrescentar 1 RIR.',
  }
  return suggestion
}
