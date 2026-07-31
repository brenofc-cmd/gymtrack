import { describe, expect, it } from 'vitest'
import { computeE1rmProfileUpdate } from '@/lib/training/e1rm-profile'
import { estimated1RM } from '@/lib/training/strength'

describe('e1RM com RIR', () => {
  it('usa a fórmula peso × (1 + (reps + RIR) / 30) apenas para 3–8 reps válidas', () => {
    expect(estimated1RM({ weightKg: 100, reps: 5, rir: 2, isWarmup: false, executionQuality: 'boa', painLevel: 'nenhuma', romQuality: 'completa' })).toBe(123.3)
    expect(estimated1RM({ weightKg: 100, reps: 1, rir: 2, isWarmup: false, executionQuality: 'boa', painLevel: 'nenhuma', romQuality: 'completa' })).toBeNull()
    expect(estimated1RM({ weightKg: 100, reps: 10, rir: 2, isWarmup: false, executionQuality: 'boa', painLevel: 'nenhuma', romQuality: 'completa' })).toBeNull()
    expect(estimated1RM({ weightKg: 100, reps: 5, rir: null, isWarmup: false, executionQuality: 'boa', painLevel: 'nenhuma', romQuality: 'completa' })).toBeNull()
  })
})

describe('perfil de força: mediana das 3 estimativas válidas mais recentes', () => {
  it('calcula a mediana de exatamente 3 amostras', () => {
    const result = computeE1rmProfileUpdate(
      [
        { estimatedOneRepMaxKg: 100, recordedAt: '2026-07-30' },
        { estimatedOneRepMaxKg: 102, recordedAt: '2026-07-25' },
        { estimatedOneRepMaxKg: 98, recordedAt: '2026-07-20' },
      ],
      null
    )
    expect(result.estimatedOneRepMaxKg).toBe(100)
    expect(result.validSampleCount).toBe(3)
    expect(result.confidenceLevel).toBe('media')
  })

  it('usa só as 3 mais recentes quando há mais amostras', () => {
    const result = computeE1rmProfileUpdate(
      [
        { estimatedOneRepMaxKg: 110, recordedAt: '2026-07-31' },
        { estimatedOneRepMaxKg: 108, recordedAt: '2026-07-29' },
        { estimatedOneRepMaxKg: 106, recordedAt: '2026-07-27' },
        { estimatedOneRepMaxKg: 50, recordedAt: '2026-01-01' },
      ],
      null
    )
    expect(result.estimatedOneRepMaxKg).toBe(108)
  })

  it('limita a mudança a no máximo 5% por sessão em relação ao valor anterior', () => {
    const result = computeE1rmProfileUpdate(
      [
        { estimatedOneRepMaxKg: 130, recordedAt: '2026-07-31' },
        { estimatedOneRepMaxKg: 128, recordedAt: '2026-07-29' },
        { estimatedOneRepMaxKg: 132, recordedAt: '2026-07-27' },
      ],
      100
    )
    expect(result.estimatedOneRepMaxKg).toBe(105)
    expect(result.cappedByFivePercentRule).toBe(true)
  })

  it('não limita quando a mudança já está dentro de 5%', () => {
    const result = computeE1rmProfileUpdate(
      [
        { estimatedOneRepMaxKg: 103, recordedAt: '2026-07-31' },
        { estimatedOneRepMaxKg: 102, recordedAt: '2026-07-29' },
        { estimatedOneRepMaxKg: 101, recordedAt: '2026-07-27' },
      ],
      100
    )
    expect(result.estimatedOneRepMaxKg).toBe(102)
    expect(result.cappedByFivePercentRule).toBe(false)
  })

  it('sem amostras válidas, mantém o valor anterior e não derruba a confiança', () => {
    const result = computeE1rmProfileUpdate([], 90)
    expect(result.estimatedOneRepMaxKg).toBe(90)
    expect(result.validSampleCount).toBe(0)
  })

  it('confiança sobe com mais amostras válidas acumuladas', () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ estimatedOneRepMaxKg: 100 + i, recordedAt: `2026-07-${20 + i}` }))
    expect(computeE1rmProfileUpdate(many, null).confidenceLevel).toBe('alta')
  })
})
