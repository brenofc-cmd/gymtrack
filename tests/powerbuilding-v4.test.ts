import { describe, expect, it } from 'vitest'
import {
  DAVID_LAID_PUBLIC_DUP_V5,
  ROUTINE_VERSION,
} from '@/lib/routine/david-laid-public-dup-v5'
import { backoffWeight, estimated1RM, isValidPRSet } from '@/lib/training/strength'
import { adjustProgressionForReadiness, assessReadiness, readinessAdjustment } from '@/lib/training/readiness'
import { canApproachFailure } from '@/lib/training/failure-policy'
import { nextRotatingWorkout, rotatingCycle } from '@/lib/training/schedule'

describe('DUP público David Laid v5', () => {
  it('mantém exatamente Legs, Push, Pull, Legs, Push, Pull de segunda a sábado', () => {
    expect(ROUTINE_VERSION).toBe(5)
    expect(DAVID_LAID_PUBLIC_DUP_V5.map((day) => day.letter)).toEqual(['A', 'B', 'C', 'D', 'E', 'F'])
    expect(DAVID_LAID_PUBLIC_DUP_V5.map((day) => day.dayOfWeek)).toEqual([1, 2, 3, 4, 5, 6])
    expect(DAVID_LAID_PUBLIC_DUP_V5.map((day) => day.name)).toEqual(['Legs 1', 'Push 1', 'Pull 1', 'Legs 2', 'Push 2', 'Pull 2'])
    expect(DAVID_LAID_PUBLIC_DUP_V5.map((day) => day.focus)).toEqual([
      'strength_hypertrophy',
      'max_strength_hypertrophy',
      'strength_hypertrophy',
      'strength_hypertrophy',
      'strength_hypertrophy',
      'max_strength_hypertrophy',
    ])
  })

  it('bloqueia todas as prescrições e representa RM, faixa e repetições fixas', () => {
    const exercises = DAVID_LAID_PUBLIC_DUP_V5.flatMap((day) => day.exercises)
    expect(exercises.every((exercise) => exercise.prescriptionLocked)).toBe(true)
    expect(exercises.filter((exercise) => exercise.prescriptionType === 'rep_range')).toHaveLength(2)
    expect(exercises.filter((exercise) => exercise.prescriptionType === 'rep_range').every((exercise) => exercise.name === 'Barra fixa' && exercise.repsMin === 8 && exercise.repsMax === 10)).toBe(true)
    expect(exercises.filter((exercise) => exercise.prescriptionType === 'rep_max_effort').map((exercise) => exercise.repMaxTarget)).toEqual([5, 1, 3, 3, 5, 1])
    expect(exercises.some((exercise) => exercise.kind === 'abdominal')).toBe(false)
  })
})

describe('Força segura, e1RM e back-off', () => {
  const valid = { weightKg: 80, reps: 6, rir: 2, isWarmup: false, executionQuality: 'boa' as const, painLevel: 'nenhuma' as const, romQuality: 'completa' as const }

  it('usa Epley com RIR apenas em série válida de 3–8 reps com RIR informado', () => {
    expect(estimated1RM(valid)).toBe(101.3)
    expect(estimated1RM({ ...valid, reps: 9 })).toBeNull()
    expect(estimated1RM({ ...valid, rir: null })).toBeNull()
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

  it('só permite aproximação opcional da falha em cenário seguro E fora da fase Fundamentos', () => {
    const safe = { allowedByExercise: true, riskLevel: 'low', isLastSet: true, painLevel: 'nenhuma', readiness: 'ready', weeksAdapted: 4 } as const
    // A fase governa a política: Fundamentos (padrão) nunca planeja falha.
    expect(canApproachFailure(safe).allowed).toBe(false)
    expect(canApproachFailure({ ...safe, phase: 'fundamentals' }).allowed).toBe(false)
    expect(canApproachFailure({ ...safe, phase: 'intro_powerbuilding' }).allowed).toBe(true)
    // Risco alto continua bloqueado mesmo com a fase avançada.
    expect(canApproachFailure({ ...safe, riskLevel: 'high', weeksAdapted: 8, phase: 'intro_powerbuilding' }).allowed).toBe(false)
  })

  it('continua a sequência perdida e oferece ciclo condensado sem amontoar treinos', () => {
    expect(nextRotatingWorkout('D', 'B')).toBe('C')
    expect(nextRotatingWorkout(null, 'B')).toBe('C')
    expect(nextRotatingWorkout('F', null)).toBe('A')
    expect(rotatingCycle('E', 5)).toEqual(['F', 'A', 'B', 'C', 'D'])
  })
})
