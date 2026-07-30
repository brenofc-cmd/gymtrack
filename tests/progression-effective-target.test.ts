import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { suggestForExercise, type SetPerformance } from '@/lib/progression/progression'
import { adjustTargetsForPhase, type TrainingPhase } from '@/lib/training/phase'

/**
 * REGRESSÃO (bug P0 da auditoria 10/10): a progressão era calculada com o RIR
 * BRUTO da rotina, enquanto a sessão era prescrita com o RIR EFETIVO da fase.
 * Resultado: em Fundamentos o app pedia RIR 3 na tela e avaliava contra RIR 2,
 * podendo sugerir aumento de carga sobre um alvo que ele mesmo não pediu.
 *
 * A ordem correta é: rotina-base → fase → alvos efetivos → progressão.
 */

/** Reproduz o pipeline da página da sessão. */
function suggestWithPhase(
  routineExercise: {
    target_sets: number
    target_reps_min: number
    target_reps_max: number
    rir_min: number | null
    rir_max: number | null
  },
  exerciseType: string,
  phase: TrainingPhase,
  lastSets: SetPerformance[]
) {
  const effective = adjustTargetsForPhase(routineExercise, phase, exerciseType)
  return {
    effective,
    suggestion: suggestForExercise(
      {
        sets: effective.target_sets,
        repsMin: effective.target_reps_min,
        repsMax: effective.target_reps_max,
        rirMin: effective.rir_min,
        rirMax: effective.rir_max,
        kind: exerciseType as 'composto' | 'isolador',
      },
      lastSets
    ),
  }
}

const compoundRoutine = {
  target_sets: 3,
  target_reps_min: 8,
  target_reps_max: 12,
  rir_min: 2,
  rir_max: 2,
}

function set(overrides: Partial<SetPerformance> = {}): SetPerformance {
  return {
    weightKg: 40,
    reps: 12,
    rir: 2,
    isWarmup: false,
    painLevel: 'nenhuma',
    executionQuality: 'boa',
    ...overrides,
  }
}

describe('progressão usa o alvo EFETIVO da fase', () => {
  it('rotina com RIR 2 é avaliada como RIR 3 quando o usuário está em Fundamentos', () => {
    const { effective } = suggestWithPhase(compoundRoutine, 'composto', 'fundamentals', [])
    expect(compoundRoutine.rir_min).toBe(2)
    expect(effective.rir_min).toBe(3)
    expect(effective.rir_max).toBe(3)
  })

  it('sessão no topo da faixa com RIR 2 NÃO sugere aumento em Fundamentos (alvo é RIR 3)', () => {
    // Todas as séries no topo (12 reps), execução boa, mas RIR 2 — abaixo do
    // piso de 3 que a fase prescreve. Não pode virar "aumentar carga".
    const lastSets = [set(), set(), set()]
    const { suggestion } = suggestWithPhase(compoundRoutine, 'composto', 'fundamentals', lastSets)
    expect(suggestion?.action).not.toBe('aumentar')
  })

  it('a MESMA sessão sugere aumento em intro_powerbuilding (alvo é o RIR 2 da rotina)', () => {
    const lastSets = [set(), set(), set()]
    const { suggestion } = suggestWithPhase(
      compoundRoutine,
      'composto',
      'intro_powerbuilding',
      lastSets
    )
    expect(suggestion?.action).toBe('aumentar')
  })

  it('em Fundamentos, RIR 3 no topo da faixa sugere aumento (alvo efetivo atingido)', () => {
    const lastSets = [set({ rir: 3 }), set({ rir: 3 }), set({ rir: 3 })]
    const { suggestion } = suggestWithPhase(compoundRoutine, 'composto', 'fundamentals', lastSets)
    expect(suggestion?.action).toBe('aumentar')
  })

  it('isolador RIR 1–2 vira 2–3 e a avaliação acompanha', () => {
    const isolator = { ...compoundRoutine, rir_min: 1, rir_max: 2 }
    const { effective } = suggestWithPhase(isolator, 'isolador', 'fundamentals', [])
    expect(effective.rir_min).toBe(2)
    expect(effective.rir_max).toBe(3)
  })

  it('dor continua bloqueando independentemente da fase', () => {
    for (const phase of ['fundamentals', 'intro_powerbuilding'] as const) {
      const lastSets = [set(), set(), set({ painLevel: 'moderada' })]
      const { suggestion } = suggestWithPhase(compoundRoutine, 'composto', phase, lastSets)
      expect(suggestion?.action, phase).toBe('bloquear_por_dor')
    }
  })

  it('execução ruim continua bloqueando independentemente da fase', () => {
    for (const phase of ['fundamentals', 'intro_powerbuilding'] as const) {
      const lastSets = [set({ rir: 3 }), set({ rir: 3 }), set({ rir: 3, executionQuality: 'ruim' })]
      const { suggestion } = suggestWithPhase(compoundRoutine, 'composto', phase, lastSets)
      expect(suggestion?.action, phase).toBe('revisar')
    }
  })
})

describe('ordem no código da página da sessão', () => {
  const page = readFileSync(
    path.resolve(__dirname, '../app/(app)/sessao/[id]/page.tsx'),
    'utf-8'
  )

  it('a fase é aplicada ANTES do cálculo da progressão', () => {
    const phaseApplied = page.indexOf('workoutData.workout_exercises = workoutData.workout_exercises.map')
    const progressionComputed = page.indexOf('suggestForExercise(')
    expect(phaseApplied).toBeGreaterThan(-1)
    expect(progressionComputed).toBeGreaterThan(-1)
    expect(phaseApplied).toBeLessThan(progressionComputed)
  })

  it('a data da prontidão usa o helper central de fuso, não Intl inline', () => {
    expect(page).toContain('localDateISO()')
    expect(page).not.toMatch(/readiness_date',\s*new Intl\.DateTimeFormat/)
  })
})
