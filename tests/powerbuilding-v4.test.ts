import { describe, expect, it } from 'vitest'
import {
  POWERBUILDING_V4,
  ROUTINE_VERSION,
  directVolumeByMuscle,
  secondaryVolumeByMuscle,
} from '@/lib/routine/powerbuilding-v4'
import { backoffWeight, estimated1RM, isValidPRSet } from '@/lib/training/strength'
import { adjustProgressionForReadiness, assessReadiness, readinessAdjustment } from '@/lib/training/readiness'
import { canApproachFailure } from '@/lib/training/failure-policy'
import { nextRotatingWorkout, rotatingCycle } from '@/lib/training/schedule'

describe('Powerbuilding v4', () => {
  it('mantém PPL A/B de segunda a sábado e diferencia os focos', () => {
    expect(ROUTINE_VERSION).toBe(4)
    expect(POWERBUILDING_V4.map((day) => day.letter)).toEqual(['A', 'B', 'C', 'D', 'E', 'F'])
    expect(POWERBUILDING_V4.map((day) => day.dayOfWeek)).toEqual([1, 2, 3, 4, 5, 6])
    expect(POWERBUILDING_V4.slice(0, 3).every((day) => day.focus === 'strength_technique')).toBe(true)
    expect(POWERBUILDING_V4.slice(3).every((day) => day.focus === 'hypertrophy')).toBe(true)
  })

  it('limita top set/back-off a um composto por sessão', () => {
    for (const day of POWERBUILDING_V4) {
      expect(day.exercises.filter((exercise) => exercise.topSetEnabled)).toHaveLength(
        day.letter === 'A' || day.letter === 'C' ? 1 : 0
      )
    }
  })

  it('treina abdômen em três dias com estímulos complementares', () => {
    const days = POWERBUILDING_V4.filter((day) => day.exercises.some((exercise) => exercise.kind === 'abdominal'))
    expect(days.map((day) => day.letter)).toEqual(['A', 'C', 'F'])
    expect(new Set(days.flatMap((day) => day.exercises.filter((exercise) => exercise.kind === 'abdominal').map((exercise) => exercise.movementPattern))))
      .toEqual(new Set(['trunk_flexion', 'pelvic_curl', 'anti_extension', 'anti_rotation']))
  })

  it('calcula volume direto e contribuição secundária separadamente', () => {
    const direct = directVolumeByMuscle()
    const secondary = secondaryVolumeByMuscle()
    expect(direct.peito).toBe(13)
    expect(direct.costas).toBe(15)
    expect(direct['abdômen']).toBe(11)
    expect(secondary['tríceps']).toBeGreaterThan(0)
    expect(secondary['bíceps']).toBeGreaterThan(0)
  })
})

describe('Força segura, e1RM e back-off', () => {
  const valid = { weightKg: 80, reps: 6, isWarmup: false, executionQuality: 'boa' as const, painLevel: 'nenhuma' as const, romQuality: 'completa' as const }

  it('usa Epley apenas em série válida de 3–10 reps', () => {
    expect(estimated1RM(valid)).toBe(96)
    expect(estimated1RM({ ...valid, reps: 11 })).toBeNull()
    expect(estimated1RM({ ...valid, isWarmup: true })).toBeNull()
    expect(estimated1RM({ ...valid, executionQuality: 'aceitavel' })).toBeNull()
    expect(estimated1RM({ ...valid, painLevel: 'leve' })).toBeNull()
  })

  it('bloqueia PR com dor, técnica ruim ou amplitude reduzida', () => {
    expect(isValidPRSet(valid)).toBe(true)
    expect(isValidPRSet({ ...valid, painLevel: 'moderada' })).toBe(false)
    expect(isValidPRSet({ ...valid, executionQuality: 'ruim' })).toBe(false)
    expect(isValidPRSet({ ...valid, romQuality: 'reduzida' })).toBe(false)
  })

  it('calcula back-off conservador e arredondado', () => {
    expect(backoffWeight(40, 7.5, 1)).toBe(37)
    expect(backoffWeight(100, 10, 2.5)).toBe(90)
  })
})

describe('Prontidão, falha e agenda flexível', () => {
  it('interrompe por dor articular relevante e reduz carga em baixa recuperação', () => {
    const pain = assessReadiness({ sleepQuality: 5, energy: 5, muscleSoreness: 1, jointPain: 'moderate', stress: 1, motivation: 5, recoveryFeeling: 5 })
    expect(pain.status).toBe('stop_for_pain')
    expect(readinessAdjustment('low_recovery').loadMultiplier).toBeCloseTo(0.925)
  })

  it('prontidão realmente impede sugestão de aumento no treino atual', () => {
    const increase = { action: 'aumentar' as const, reason: 'meta atingida', incrementKg: 2.5 }
    expect(adjustProgressionForReadiness(increase, 'attention')?.action).toBe('manter')
    expect(adjustProgressionForReadiness(increase, 'low_recovery')?.action).toBe('revisar')
    expect(adjustProgressionForReadiness(increase, 'stop_for_pain')?.action).toBe('bloquear_por_dor')
  })

  it('só permite aproximação opcional da falha em cenário seguro', () => {
    expect(canApproachFailure({ allowedByExercise: true, riskLevel: 'low', isLastSet: true, painLevel: 'nenhuma', readiness: 'ready', weeksAdapted: 4 }).allowed).toBe(true)
    expect(canApproachFailure({ allowedByExercise: true, riskLevel: 'high', isLastSet: true, painLevel: 'nenhuma', readiness: 'ready', weeksAdapted: 8 }).allowed).toBe(false)
  })

  it('continua a sequência perdida e oferece ciclo condensado sem amontoar treinos', () => {
    expect(nextRotatingWorkout('D', 'B')).toBe('C')
    expect(rotatingCycle('E', 5)).toEqual(['F', 'A', 'B', 'C', 'D'])
  })
})
