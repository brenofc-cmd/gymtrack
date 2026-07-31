import { describe, expect, it } from 'vitest'
import {
  decideIntraSetAdjustment,
  decideCompositeSessionAdjustment,
  decideAccessorySessionAdjustment,
} from '@/lib/training/load-adjustment'

const base = { repsCompleted: 5, targetReps: 5, technique: 'boa' as const, pain: 'sem_dor' as const }

describe('ajuste entre séries', () => {
  it('dor aguda sempre encerra o exercício e não conta para recorde, independente de RIR/técnica', () => {
    const result = decideIntraSetAdjustment({ ...base, pain: 'dor_aguda', actualRir: 4 })
    expect(result.direction).toBe('stop_exercise')
    expect(result.countsForRecord).toBe(false)
  })

  it('técnica comprometida reduz carga e não conta para recorde mesmo com reps completas', () => {
    const result = decideIntraSetAdjustment({ ...base, technique: 'comprometida', actualRir: 3 })
    expect(result.direction).toBe('decrease')
    expect(result.magnitudePct).toEqual([5, 10])
    expect(result.countsForRecord).toBe(false)
  })

  it('falha antes das reps-alvo reduz carga', () => {
    const result = decideIntraSetAdjustment({ ...base, repsCompleted: 3, actualRir: 0 })
    expect(result.direction).toBe('decrease')
    expect(result.countsForRecord).toBe(false)
  })

  it('técnica começando a perder nunca aumenta', () => {
    const result = decideIntraSetAdjustment({ ...base, technique: 'comecando_a_perder', actualRir: 4 })
    expect(result.direction).toBe('maintain')
    expect(result.useSmallestIncrement).toBe(true)
  })

  it.each([
    [4, 'increase'],
    [3, 'increase'],
    [2, 'maintain'],
    [1, 'maintain'],
    [0, 'decrease'],
  ] as const)('RIR %d com técnica boa e reps completas -> %s', (rir, expectedDirection) => {
    const result = decideIntraSetAdjustment({ ...base, actualRir: rir })
    expect(result.direction).toBe(expectedDirection)
  })
})

describe('ajuste entre sessões — compostos', () => {
  it('atualiza e1RM e permite aumento quando tudo concluído, técnica boa e RIR no alvo ou acima', () => {
    const result = decideCompositeSessionAdjustment({
      allSetsCompleted: true, techniqueGoodThroughout: true, finalRir: 3, targetRirMin: 2, isUpperBody: true,
    })
    expect(result.direction).toBe('increase')
    expect(result.maxIncreaseKg).toBe(2.5)
    expect(result.updateE1rm).toBe(true)
  })

  it('limita o aumento a 5kg para agachamento/terra (lower body)', () => {
    const result = decideCompositeSessionAdjustment({
      allSetsCompleted: true, techniqueGoodThroughout: true, finalRir: 2, targetRirMin: 2, isUpperBody: false,
    })
    expect(result.maxIncreaseKg).toBe(5)
  })

  it('mantém e não atualiza e1RM quando tudo concluído com RIR 1', () => {
    const result = decideCompositeSessionAdjustment({
      allSetsCompleted: true, techniqueGoodThroughout: true, finalRir: 1, targetRirMin: 2, isUpperBody: true,
    })
    expect(result.direction).toBe('maintain')
    expect(result.updateE1rm).toBe(false)
  })

  it('falha reduz 2,5–5% e nunca eleva o e1RM', () => {
    const result = decideCompositeSessionAdjustment({
      allSetsCompleted: false, techniqueGoodThroughout: false, finalRir: 0, targetRirMin: 2, isUpperBody: true,
    })
    expect(result.direction).toBe('decrease')
    expect(result.decreasePct).toEqual([2.5, 5])
    expect(result.updateE1rm).toBe(false)
  })
})

describe('ajuste entre sessões — acessórios', () => {
  it('sobe o menor incremento quando tudo concluído, técnica boa e RIR final >=2', () => {
    const result = decideAccessorySessionAdjustment({ allSetsCompleted: true, techniqueGoodThroughout: true, finalRir: 2 })
    expect(result.direction).toBe('increase')
    expect(result.useSmallestIncrement).toBe(true)
  })

  it('mantém com RIR 1 no final', () => {
    const result = decideAccessorySessionAdjustment({ allSetsCompleted: true, techniqueGoodThroughout: true, finalRir: 1 })
    expect(result.direction).toBe('maintain')
  })

  it('reduz um incremento quando falhou ou não completou', () => {
    const result = decideAccessorySessionAdjustment({ allSetsCompleted: false, techniqueGoodThroughout: false, finalRir: null })
    expect(result.direction).toBe('decrease')
  })
})
