/**
 * Modo de familiarização (`exercise_familiarization_state`): ativa quando a
 * confiança do e1RM ou da técnica é baixa. Mantém exercícios, ordem, séries
 * e repetições — só reduz a carga inicial e eleva o piso de RIR nos top
 * sets, bloqueando recordes até duas exposições válidas (técnica boa, sem
 * dor) registradas enquanto o modo está ativo.
 */
import type { ConfidenceLevel } from './e1rm-profile'

export const FAMILIARIZATION_LOAD_REDUCTION_PCT = 12.5 // dentro da faixa 10–15% pedida
export const FAMILIARIZATION_TOP_SET_RIR = 3
export const FAMILIARIZATION_EXIT_AFTER_VALID_EXPOSURES = 2

export function shouldEnterFamiliarization(
  confidenceLevel: ConfidenceLevel,
  hasAnyPriorValidSample: boolean
): boolean {
  return confidenceLevel === 'baixa' || !hasAnyPriorValidSample
}

export function applyFamiliarizationToTopSet<T extends { percentageOfE1rm?: number | null; rirMin: number; rirMax: number }>(
  target: T
): T {
  return {
    ...target,
    percentageOfE1rm:
      target.percentageOfE1rm == null
        ? target.percentageOfE1rm
        : Math.round(target.percentageOfE1rm * (1 - FAMILIARIZATION_LOAD_REDUCTION_PCT / 100) * 100) / 100,
    rirMin: Math.max(target.rirMin, FAMILIARIZATION_TOP_SET_RIR),
    rirMax: Math.max(target.rirMax, FAMILIARIZATION_TOP_SET_RIR),
  }
}

export interface FamiliarizationExposureState {
  validExposuresCount: number
  exitedAt: string | null
}

export interface ExposureResult {
  nextState: FamiliarizationExposureState
  justExited: boolean
}

/**
 * Chamar após cada série de top set concluída no modo de familiarização.
 * Uma exposição só conta como válida com técnica boa e sem dor.
 */
export function recordFamiliarizationExposure(
  state: FamiliarizationExposureState,
  exposure: { techniqueGood: boolean; noPain: boolean },
  now = new Date().toISOString()
): ExposureResult {
  if (state.exitedAt != null) return { nextState: state, justExited: false }

  const isValid = exposure.techniqueGood && exposure.noPain
  const nextCount = isValid ? state.validExposuresCount + 1 : state.validExposuresCount
  const shouldExit = nextCount >= FAMILIARIZATION_EXIT_AFTER_VALID_EXPOSURES

  return {
    nextState: {
      validExposuresCount: nextCount,
      exitedAt: shouldExit ? now : null,
    },
    justExited: shouldExit,
  }
}

/** Bloqueia recorde (PR) enquanto o modo de familiarização estiver ativo. */
export function blocksPersonalRecord(state: FamiliarizationExposureState): boolean {
  return state.exitedAt == null
}
