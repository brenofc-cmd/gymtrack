import { describe, expect, it } from 'vitest'
import {
  shouldEnterFamiliarization,
  applyFamiliarizationToTopSet,
  recordFamiliarizationExposure,
  blocksPersonalRecord,
  FAMILIARIZATION_LOAD_REDUCTION_PCT,
  FAMILIARIZATION_TOP_SET_RIR,
  type FamiliarizationExposureState,
} from '@/lib/training/familiarization'

describe('entrada no modo de familiarização', () => {
  it('entra quando a confiança do e1RM é baixa', () => {
    expect(shouldEnterFamiliarization('baixa', true)).toBe(true)
  })
  it('entra quando não há nenhuma amostra válida anterior, mesmo com confiança alta', () => {
    expect(shouldEnterFamiliarization('alta', false)).toBe(true)
  })
  it('não entra com confiança média/alta e histórico existente', () => {
    expect(shouldEnterFamiliarization('media', true)).toBe(false)
    expect(shouldEnterFamiliarization('alta', true)).toBe(false)
  })
})

describe('efeito da familiarização no top set', () => {
  it('reduz a carga inicial entre 10% e 15% e eleva o RIR-alvo para 3, mantendo séries/repetições', () => {
    const adjusted = applyFamiliarizationToTopSet({ percentageOfE1rm: 80, rirMin: 2, rirMax: 2 })
    expect(adjusted.percentageOfE1rm).toBeCloseTo(80 * (1 - FAMILIARIZATION_LOAD_REDUCTION_PCT / 100), 2)
    const reductionPct = 100 - (adjusted.percentageOfE1rm! / 80) * 100
    expect(reductionPct).toBeGreaterThanOrEqual(10)
    expect(reductionPct).toBeLessThanOrEqual(15)
    expect(adjusted.rirMin).toBe(FAMILIARIZATION_TOP_SET_RIR)
    expect(adjusted.rirMax).toBe(FAMILIARIZATION_TOP_SET_RIR)
  })

  it('nunca abaixa um RIR-alvo já maior que o piso de familiarização', () => {
    const adjusted = applyFamiliarizationToTopSet({ percentageOfE1rm: 80, rirMin: 4, rirMax: 4 })
    expect(adjusted.rirMin).toBe(4)
  })
})

describe('saída do modo de familiarização', () => {
  it('exige duas exposições válidas (técnica boa e sem dor) para sair', () => {
    let state: FamiliarizationExposureState = { validExposuresCount: 0, exitedAt: null }
    const first = recordFamiliarizationExposure(state, { techniqueGood: true, noPain: true })
    expect(first.justExited).toBe(false)
    state = first.nextState
    const second = recordFamiliarizationExposure(state, { techniqueGood: true, noPain: true })
    expect(second.justExited).toBe(true)
    expect(blocksPersonalRecord(second.nextState)).toBe(false)
  })

  it('exposição com técnica ruim ou dor não conta e não bloqueia futuras tentativas', () => {
    const state = { validExposuresCount: 1, exitedAt: null }
    const result = recordFamiliarizationExposure(state, { techniqueGood: false, noPain: true })
    expect(result.nextState.validExposuresCount).toBe(1)
    expect(result.justExited).toBe(false)
    expect(blocksPersonalRecord(result.nextState)).toBe(true)
  })

  it('bloqueia recorde enquanto ativo', () => {
    expect(blocksPersonalRecord({ validExposuresCount: 0, exitedAt: null })).toBe(true)
  })
})
