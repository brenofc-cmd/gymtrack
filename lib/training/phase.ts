/**
 * Fase de treinamento (user_profiles.training_phase) — P0.3 da auditoria.
 *
 * A fase NÃO altera a rotina v4 (exercícios, séries, faixas, RIR) nem a
 * lógica de progressão. Ela controla apenas a APRESENTAÇÃO do top set/
 * back-off na sessão:
 *
 * - fundamentals (padrão): top set/back-off é exibido como séries retas
 *   conservadoras — mesma contagem de séries e faixas, sem papel de série
 *   especial e sem sugestão de back-off automático. Foco em execução e
 *   consistência.
 * - intro_powerbuilding: habilita o top set/back-off já definido na rotina
 *   (somente nos exercícios marcados). Exige confirmação explícita do
 *   usuário no Perfil; nunca é ativada automaticamente.
 * - advanced_powerbuilding: indisponível por enquanto — não há técnicas
 *   avançadas a habilitar e nada deve ativá-la automaticamente.
 *
 * Decisão de produto (29/07/2026): nenhuma exposição de "falha permitida"
 * na interface. RIR permanece parâmetro interno de controle de intensidade.
 */

export type TrainingPhase = 'fundamentals' | 'intro_powerbuilding' | 'advanced_powerbuilding'

export const DEFAULT_TRAINING_PHASE: TrainingPhase = 'fundamentals'

export const TRAINING_PHASE_LABEL: Record<TrainingPhase, string> = {
  fundamentals: 'Fundamentos',
  intro_powerbuilding: 'Introdução ao powerbuilding',
  advanced_powerbuilding: 'Powerbuilding avançado',
}

export function normalizeTrainingPhase(value: string | null | undefined): TrainingPhase {
  return value === 'intro_powerbuilding' || value === 'advanced_powerbuilding'
    ? value
    : DEFAULT_TRAINING_PHASE
}

/** Top set/back-off só se manifesta a partir de intro_powerbuilding. */
export function phaseAllowsTopSets(phase: TrainingPhase): boolean {
  return phase !== 'fundamentals'
}

/**
 * Papel efetivo do top set para um exercício na sessão: exige que o
 * exercício esteja marcado NA ROTINA e que a fase permita.
 */
export function effectiveTopSetEnabled(
  phase: TrainingPhase,
  exerciseTopSetEnabled: boolean | null | undefined
): boolean {
  return phaseAllowsTopSets(phase) && exerciseTopSetEnabled === true
}

/** Critérios apresentados ao usuário antes de confirmar a mudança de fase. */
export const INTRO_POWERBUILDING_CRITERIA = [
  'Pelo menos 8–12 semanas de treino consistente registrado',
  'Execução marcada como boa na maioria das séries recentes',
  'Nenhuma dor moderada ou forte recorrente',
  'Recuperação adequada (sono e prontidão em dia)',
  'Consegue estimar RIR com alguma confiança',
  'Regularidade de treino na semana',
] as const

/**
 * Piso de RIR por fase. Em `fundamentals` a prescrição fica mais
 * conservadora que a rotina: compostos em RIR 3 e isoladores em RIR 2–3,
 * priorizando execução e consistência sobre proximidade da falha.
 *
 * IMPORTANTE: isto NÃO altera `lib/routine/powerbuilding-v4.ts` nem o banco.
 * É uma camada de prescrição aplicada na leitura da sessão — a mesma
 * estratégia usada para o top set. Só ELEVA o RIR (nunca reduz), então nunca
 * torna a sessão mais agressiva do que a rotina previu.
 */
const FUNDAMENTALS_RIR_FLOOR = { composto: 3, isolador: 2, abdominal: 2 } as const

export type PhaseAdjustableTargets = {
  rir_min: number | null
  rir_max: number | null
}

export function rirFloorForPhase(
  phase: TrainingPhase,
  exerciseType: string | null | undefined
): number | null {
  if (phase !== 'fundamentals') return null
  if (exerciseType === 'composto') return FUNDAMENTALS_RIR_FLOOR.composto
  if (exerciseType === 'isolador') return FUNDAMENTALS_RIR_FLOOR.isolador
  if (exerciseType === 'abdominal') return FUNDAMENTALS_RIR_FLOOR.abdominal
  return null
}

/**
 * Aplica o piso de RIR da fase a um exercício da sessão. Preserva a amplitude
 * da faixa original quando ela existe (ex.: 1–2 vira 2–3 em isoladores).
 */
export function adjustTargetsForPhase<T extends PhaseAdjustableTargets>(
  target: T,
  phase: TrainingPhase,
  exerciseType: string | null | undefined
): T {
  const floor = rirFloorForPhase(phase, exerciseType)
  if (floor == null) return target

  const currentMin = target.rir_min
  if (currentMin != null && currentMin >= floor) return target

  const span =
    target.rir_min != null && target.rir_max != null ? target.rir_max - target.rir_min : 0
  return {
    ...target,
    rir_min: floor,
    rir_max: target.rir_max == null ? floor : Math.max(floor + span, floor),
  }
}
