import { describe, expect, it } from 'vitest'
import {
  accessoryProgression,
  deriveTrainingMax,
  estimateOneRepMax,
  nextBlockWeek,
  recommendGymTrackLoad,
  roundToIncrement,
  unilateralVolume,
} from '@/lib/training/dup-progression'

describe('motor DUP GymTrack', () => {
  it('calcula Epley, Training Max e arredondamento de forma determinística', () => {
    expect(estimateOneRepMax(100, 5)).toBe(116.7)
    expect(estimateOneRepMax(0, 5)).toBeNull()
    expect(deriveTrainingMax(120, 130)).toBe(108)
    expect(deriveTrainingMax(null, 100)).toBe(90)
    expect(roundToIncrement(83.4, 2.5)).toBe(82.5)
  })

  it('não inventa carga sem referência e nunca aumenta RM automaticamente', () => {
    expect(recommendGymTrackLoad({ trainingMax: null, targetReps: 1, incrementKg: 2.5, readiness: 'ready', previousWeightKg: null, prescriptionType: 'rep_max_effort' }).action).toBe('insufficient_data')
    const rm = recommendGymTrackLoad({ trainingMax: 100, targetReps: 1, incrementKg: 2.5, readiness: 'ready', previousWeightKg: 90, previousAttempt: 'completed', prescriptionType: 'rep_max_effort' })
    expect(rm.action).toBe('maintain')
    expect(rm.requiresManualConfirmation).toBe(true)
  })

  it('reduz após falhas e interrompe com dor', () => {
    expect(recommendGymTrackLoad({ trainingMax: 100, targetReps: 5, incrementKg: 2.5, readiness: 'ready', previousWeightKg: 80, recentFailures: 2, prescriptionType: 'fixed_reps' }).action).toBe('reduce')
    expect(recommendGymTrackLoad({ trainingMax: 100, targetReps: 5, incrementKg: 2.5, readiness: 'ready', previousWeightKg: 80, pain: true, prescriptionType: 'fixed_reps' }).action).toBe('stop')
  })

  it('progride acessórios e barra fixa somente com séries válidas', () => {
    const valid = Array.from({ length: 3 }, () => ({ reps: 10, rir: 2, executionQuality: 'boa' as const, pain: false }))
    expect(accessoryProgression(valid, 3, 8, 10)).toBe('increase_load')
    expect(accessoryProgression(valid.map((set) => ({ ...set, reps: 9 })), 3, 8, 10)).toBe('increase_reps')
    expect(accessoryProgression([{ ...valid[0], pain: true }], 3, 8, 10)).toBe('stop')
  })

  it('calcula unilateral sem duplicação silenciosa e encerra a semana 8', () => {
    expect(unilateralVolume(20, 10, 3)).toBe(1200)
    expect(nextBlockWeek(7, true)).toEqual({ week: 8, completed: false })
    expect(nextBlockWeek(8, true)).toEqual({ week: 8, completed: true })
  })
})
