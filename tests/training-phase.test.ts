import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import {
  DEFAULT_TRAINING_PHASE,
  adjustTargetsForPhase,
  effectiveTopSetEnabled,
  normalizeTrainingPhase,
  phaseAllowsTopSets,
  rirFloorForPhase,
} from '@/lib/training/phase'
import { canApproachFailure } from '@/lib/training/failure-policy'

describe('fase de treinamento — prescrição efetiva', () => {
  it('padrão é fundamentals, inclusive para valores nulos ou desconhecidos', () => {
    expect(DEFAULT_TRAINING_PHASE).toBe('fundamentals')
    expect(normalizeTrainingPhase(null)).toBe('fundamentals')
    expect(normalizeTrainingPhase(undefined)).toBe('fundamentals')
    expect(normalizeTrainingPhase('qualquer_coisa')).toBe('fundamentals')
    expect(normalizeTrainingPhase('intro_powerbuilding')).toBe('intro_powerbuilding')
  })

  it('fundamentals apresenta top set/back-off como séries retas (gate fechado)', () => {
    expect(phaseAllowsTopSets('fundamentals')).toBe(false)
    expect(effectiveTopSetEnabled('fundamentals', true)).toBe(false)
    expect(effectiveTopSetEnabled('fundamentals', false)).toBe(false)
  })

  it('intro_powerbuilding habilita top set SOMENTE nos exercícios já marcados na rotina', () => {
    expect(effectiveTopSetEnabled('intro_powerbuilding', true)).toBe(true)
    expect(effectiveTopSetEnabled('intro_powerbuilding', false)).toBe(false)
    expect(effectiveTopSetEnabled('intro_powerbuilding', null)).toBe(false)
  })

  it('a sessão aplica o gate da fase no servidor (fundamentals zera top_set_enabled)', () => {
    const page = readFileSync(
      path.resolve(__dirname, '../app/(app)/sessao/[id]/page.tsx'),
      'utf-8'
    )
    expect(page).toContain('normalizeTrainingPhase')
    expect(page).toContain('phaseAllowsTopSets')
    expect(page).toContain('top_set_enabled: false')
  })

  it('a mudança de fase exige confirmação explícita e nunca oferece advanced', () => {
    const card = readFileSync(
      path.resolve(__dirname, '../components/profile/TrainingPhaseCard.tsx'),
      'utf-8'
    )
    expect(card).toContain('Confirmo, avançar')
    expect(card).not.toContain("setPhase('advanced_powerbuilding')")
  })

  it('decisão de produto: nenhuma exposição de falha na UI da sessão', () => {
    // failureAllowed permanece no modelo de dados, mas a sessão não exibe
    // badges/avisos de "falha permitida" nem incentiva RIR 0.
    for (const file of [
      'app/(app)/sessao/[id]/SessionClient.tsx',
      'components/session/CurrentExercisePanel.tsx',
      'components/session/SetRow.tsx',
      'components/session/WorkingSetList.tsx',
    ]) {
      const source = readFileSync(path.resolve(__dirname, '..', file), 'utf-8')
      expect(source, file).not.toContain('canApproachFailure')
      expect(source, file).not.toMatch(/falha permitida|vá à falha/i)
    }
  })

  it('a rotina DUP bloqueada não reutiliza top set/back-off da rotina anterior', async () => {

    const { DAVID_LAID_PUBLIC_DUP_V5 } = await import('@/lib/routine/david-laid-public-dup-v5')
    const topSetExercises = DAVID_LAID_PUBLIC_DUP_V5.flatMap((day) => day.exercises).filter(
      (exercise) => exercise.topSetEnabled
    )
    expect(topSetExercises).toEqual([])
  })
})

describe('RIR efetivo por fase (4.3)', () => {
  it('fundamentals eleva o piso: compostos RIR 3, isoladores e abdominais RIR 2', () => {
    expect(rirFloorForPhase('fundamentals', 'composto')).toBe(3)
    expect(rirFloorForPhase('fundamentals', 'isolador')).toBe(2)
    expect(rirFloorForPhase('fundamentals', 'abdominal')).toBe(2)
  })

  it('fases avançadas não aplicam piso (a rotina manda)', () => {
    expect(rirFloorForPhase('intro_powerbuilding', 'composto')).toBeNull()
    expect(rirFloorForPhase('advanced_powerbuilding', 'isolador')).toBeNull()
  })

  it('composto RIR 2–2 vira 3–3 em fundamentals', () => {
    const adjusted = adjustTargetsForPhase({ rir_min: 2, rir_max: 2 }, 'fundamentals', 'composto')
    expect(adjusted).toEqual({ rir_min: 3, rir_max: 3 })
  })

  it('isolador RIR 1–2 vira 2–3 em fundamentals (preserva a amplitude da faixa)', () => {
    const adjusted = adjustTargetsForPhase({ rir_min: 1, rir_max: 2 }, 'fundamentals', 'isolador')
    expect(adjusted).toEqual({ rir_min: 2, rir_max: 3 })
  })

  it('NUNCA reduz o RIR: faixa já conservadora passa intacta', () => {
    const conservative = { rir_min: 3, rir_max: 4 }
    expect(adjustTargetsForPhase(conservative, 'fundamentals', 'composto')).toEqual(conservative)
    const abTarget = { rir_min: 2, rir_max: 3 }
    expect(adjustTargetsForPhase(abTarget, 'fundamentals', 'abdominal')).toEqual(abTarget)
  })

  it('intro_powerbuilding preserva o RIR da rotina sem alteração', () => {
    const target = { rir_min: 2, rir_max: 2 }
    expect(adjustTargetsForPhase(target, 'intro_powerbuilding', 'composto')).toEqual(target)
  })

  it('preserva os demais campos do exercício ao ajustar', () => {
    const we = { rir_min: 1, rir_max: 2, target_sets: 3, top_set_enabled: true }
    const adjusted = adjustTargetsForPhase(we, 'fundamentals', 'isolador')
    expect(adjusted.target_sets).toBe(3)
    expect(adjusted.top_set_enabled).toBe(true)
  })

  it('a sessão aplica o ajuste de RIR no servidor', () => {
    const page = readFileSync(
      path.resolve(__dirname, '../app/(app)/sessao/[id]/page.tsx'),
      'utf-8'
    )
    expect(page).toContain('adjustTargetsForPhase')
  })
})

describe('política de falha governada pela fase (4.3), sem UI', () => {
  const safe = {
    allowedByExercise: true,
    riskLevel: 'low',
    isLastSet: true,
    painLevel: 'nenhuma',
    readiness: 'ready',
    weeksAdapted: 6,
  } as const

  it('fase ausente equivale a fundamentals: não planeja falha', () => {
    expect(canApproachFailure(safe).allowed).toBe(false)
    expect(canApproachFailure(safe).reason).toMatch(/Fundamentos/)
  })

  it('fundamentals bloqueia mesmo no cenário mais seguro possível', () => {
    expect(canApproachFailure({ ...safe, phase: 'fundamentals' }).allowed).toBe(false)
  })

  it('intro_powerbuilding libera apenas com exercício seguro, última série, sem dor e prontidão boa', () => {
    expect(canApproachFailure({ ...safe, phase: 'intro_powerbuilding' }).allowed).toBe(true)
    expect(canApproachFailure({ ...safe, phase: 'intro_powerbuilding', riskLevel: 'high' }).allowed).toBe(false)
    expect(canApproachFailure({ ...safe, phase: 'intro_powerbuilding', isLastSet: false }).allowed).toBe(false)
    expect(canApproachFailure({ ...safe, phase: 'intro_powerbuilding', painLevel: 'leve' }).allowed).toBe(false)
    expect(canApproachFailure({ ...safe, phase: 'intro_powerbuilding', readiness: 'low_recovery' }).allowed).toBe(false)
  })

  it('a política continua fora da interface (decisão do usuário de 29/07/2026)', () => {
    const policy = readFileSync(
      path.resolve(__dirname, '../lib/training/failure-policy.ts'),
      'utf-8'
    )
    expect(policy).toMatch(/não existe, e não deve ser criada, nenhuma\s*\*? ?exposição na interface/)
  })
})
