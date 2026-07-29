import { describe, expect, it } from 'vitest'
import { movingAverage, shouldSuggestFatigueReduction, suggestCalorieAdjustment } from '@/lib/wellness/metrics'

describe('Métricas de acompanhamento', () => {
  it('calcula média móvel de sete dias', () => expect(movingAverage([60, 61, 62, 63, 64, 65, 66])).toBe(63))
  it('não ajusta calorias por uma única ausência de dado', () => expect(suggestCalorieAdjustment(null).action).toBe('insuficiente'))
  it('sugere aumento ou redução sem aplicar automaticamente', () => {
    expect(suggestCalorieAdjustment(0.05).action).toBe('aumentar')
    expect(suggestCalorieAdjustment(0.4).action).toBe('reduzir')
  })
  it('só sugere redução de fadiga com sinais combinados', () => {
    expect(shouldSuggestFatigueReduction({ performanceDrop: true, poorSleep: true, jointPain: true, constantFatigue: false, lowMotivation: false, persistentSoreness: false })).toBe(true)
  })
})
