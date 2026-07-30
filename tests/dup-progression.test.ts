import { describe, expect, it } from 'vitest'
import { suggestProgression } from '@/lib/progression/progression'

const target = { sets: 1, repsMin: 1, repsMax: 1, rirMin: null, rirMax: null, kind: 'composto' as const, prescriptionType: 'rep_max_effort' }

describe('progressão DUP pública', () => {
  it('nunca recomenda aumentar automaticamente esforço RM', () => {
    expect(suggestProgression(target, [{ weightKg: 100, reps: 1, rir: 2, isWarmup: false, executionQuality: 'boa', painLevel: 'nenhuma' }])?.action).toBe('manter')
  })

  it('revisa esforço RM com dor ou execução inadequada', () => {
    expect(suggestProgression(target, [{ weightKg: 100, reps: 1, rir: 0, isWarmup: false, executionQuality: 'ruim', painLevel: 'nenhuma' }])?.action).toBe('revisar')
  })
})
