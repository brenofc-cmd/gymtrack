import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DAVID_LAID_GUIDED_LOAD_V7,
  ROUTINE_VERSION,
  GUIDED_TOP_SET_SAFETY_NOTE,
  SOURCE_DISCLAIMER,
  FATIGUE_DISCLAIMER,
  PULL_UP_SOURCE_NOTE,
} from '@/lib/routine/david-laid-guided-load-v7'
import { DAVID_LAID_GYMSHARK_EXACT_V7 } from '@/lib/routine/david-laid-gymshark-exact-v7'
import { classifyExerciseStimulus } from '@/lib/training/stimulus'

const migration = readFileSync(
  path.resolve(__dirname, '../supabase/migrations/20260731190000_david_laid_guided_load_v7.sql'),
  'utf8'
)
const executableMigration = migration.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n')

describe('fidelidade à fonte: mesma sequência, exercícios, séries e repetições-fonte da Gymshark Exact v7', () => {
  it('mantém routine_version própria (8) e os seis dias A–F na ordem Legs1→Push1→Pull1→Legs2→Push2→Pull2', () => {
    expect(ROUTINE_VERSION).toBe(8)
    expect(DAVID_LAID_GUIDED_LOAD_V7.map((d) => d.letter)).toEqual(['A', 'B', 'C', 'D', 'E', 'F'])
    expect(DAVID_LAID_GUIDED_LOAD_V7.map((d) => d.dayOfWeek)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('reproduz exatamente slug, sets e repetições-fonte da Gymshark Exact v7, dia a dia e item a item', () => {
    expect(DAVID_LAID_GUIDED_LOAD_V7).toHaveLength(DAVID_LAID_GYMSHARK_EXACT_V7.length)
    DAVID_LAID_GUIDED_LOAD_V7.forEach((day, dayIndex) => {
      const sourceDay = DAVID_LAID_GYMSHARK_EXACT_V7[dayIndex]
      expect(day.letter).toBe(sourceDay.letter)
      expect(day.exercises).toHaveLength(sourceDay.exercises.length)
      day.exercises.forEach((item, itemIndex) => {
        const sourceItem = sourceDay.exercises[itemIndex]
        expect(item.slug).toBe(sourceItem.slug)
        expect(item.sets).toBe(sourceItem.sets)
        expect(item.sourceRepsMin).toBe(sourceItem.repsMin)
        expect(item.sourceRepsMax).toBe(sourceItem.repsMax)
        expect(item.alternativeSlug).toBe(sourceItem.alternativeSlug)
      })
    })
  })

  it('tem 41 exercícios no total, igual à fonte', () => {
    const total = DAVID_LAID_GUIDED_LOAD_V7.flatMap((d) => d.exercises).length
    expect(total).toBe(41)
  })

  it('não adiciona, remove, substitui ou reordena exercícios além das duas alternativas da fonte', () => {
    const alternatives = DAVID_LAID_GUIDED_LOAD_V7.flatMap((day) =>
      day.exercises.flatMap((item) => (item.alternativeSlug ? [item.alternativeSlug] : []))
    )
    expect(alternatives).toEqual(['reverse-hyper', 'pec-deck', 'reverse-hyper'])
    const slugs = DAVID_LAID_GUIDED_LOAD_V7.flatMap((d) => d.exercises.map((i) => i.slug))
    expect(slugs).not.toContain('bird-dog')
    expect(slugs).not.toContain('back-hyperextension')
    expect(slugs).not.toContain('triceps-pushdown')
    expect(slugs).not.toContain('cable-crunch')
  })
})

describe('esforços de RM viram top sets técnicos com RIR 2, nunca tentativa máxima obrigatória', () => {
  it('transforma cada 1RM/3RM/5RM effort da fonte em fixedReps=alvo, RIR 2, sem literal RM', () => {
    const topSets = DAVID_LAID_GUIDED_LOAD_V7.flatMap((d) => d.exercises).filter((i) => i.prescriptionType === 'guided_top_set')
    expect(topSets).toHaveLength(6) // um por dia
    for (const item of topSets) {
      expect(item.fixedReps).toBe(item.repMaxTarget)
      expect(item.rirMin).toBe(2)
      expect(item.rirMax).toBe(2)
      expect(item.sourcePrescription).toMatch(/^Fonte: \dRM effort$/)
      expect(item.guidedPrescription).toMatch(/^GymTrack: 1×\d, RIR 2$/)
      expect(item.loadStrategy).toBe('percentage_of_e1rm_topset')
      expect(item.percentageOfE1rm).toBeGreaterThan(0)
    }
    // Mesmos alvos de RM da fonte, na mesma ordem dos dias A–F.
    expect(topSets.map((i) => i.repMaxTarget)).toEqual([5, 1, 3, 3, 5, 1])
  })

  it('classifica todo top set guiado como força máxima (não hipertrofia)', () => {
    const topSets = DAVID_LAID_GUIDED_LOAD_V7.flatMap((d) => d.exercises).filter((i) => i.prescriptionType === 'guided_top_set')
    for (const item of topSets) {
      expect(
        classifyExerciseStimulus({
          prescription_type: item.prescriptionType,
          target_reps_min: item.sourceRepsMin,
          target_reps_max: item.sourceRepsMax,
        })
      ).toBe('max_strength')
    }
  })

  it('exibe o aviso de segurança fixo antes de todo top set', () => {
    expect(GUIDED_TOP_SET_SAFETY_NOTE).toContain('não é uma tentativa máxima obrigatória')
    expect(GUIDED_TOP_SET_SAFETY_NOTE).toContain('duas repetições em reserva')
  })
})

describe('pull-up: fonte 8–10, alvo guiado fixo 10', () => {
  it('preserva o range da fonte e expõe o alvo guiado separadamente', () => {
    const pullUps = DAVID_LAID_GUIDED_LOAD_V7.flatMap((d) => d.exercises).filter((i) => i.slug === 'pull-up')
    expect(pullUps).toHaveLength(2)
    for (const item of pullUps) {
      expect(item.sourceRepsMin).toBe(8)
      expect(item.sourceRepsMax).toBe(10)
      expect(item.guidedRepsFixed).toBe(10)
      expect(item.sourcePrescription).toBe('Fonte: 3×8–10')
      expect(item.guidedPrescription).toBe('GymTrack: alvo fixo 3×10, RIR 2')
    }
    expect(PULL_UP_SOURCE_NOTE).toBe('Fonte: 8–10; alvo guiado: 10')
  })
})

describe('afundo caminhando: repetições por perna, não por total', () => {
  it('mostra a prescrição guiada com sufixo "por perna"', () => {
    const lunges = DAVID_LAID_GUIDED_LOAD_V7.flatMap((d) => d.exercises).filter((i) => i.slug === 'walking-lunge')
    expect(lunges).toHaveLength(2)
    for (const item of lunges) {
      expect(item.guidedPrescription).toContain('por perna')
    }
  })
})

describe('avisos obrigatórios da rotina', () => {
  it('preserva a fonte e não afirma ser a rotina pessoal atual de David Laid', () => {
    expect(SOURCE_DISCLAIMER).toContain('rotina pública associada a David Laid pela Gymshark')
    expect(SOURCE_DISCLAIMER).toContain('não reproduzem fórmulas do programa pago')
  })
  it('avisa sobre volume/fadiga elevados priorizando técnica e recuperação', () => {
    expect(FATIGUE_DISCLAIMER).toContain('técnica')
    expect(FATIGUE_DISCLAIMER).toContain('prioridade sobre completar a carga planejada')
  })
})

describe('migration david_laid_guided_load_v7', () => {
  it('é idempotente, falha sem catálogo e valida 6 dias / 41 exercícios', () => {
    expect(migration).toContain('provision_david_laid_guided_load_v7')
    expect(migration).toContain('if v_days = 6 then')
    expect(migration).toContain("raise exception 'required exercise missing")
    expect(migration).toContain('v_days <> 6 or v_exercises <> 41')
  })

  it('nunca apaga sessão, série ou histórico (só arquiva/cancela logicamente)', () => {
    expect(executableMigration).not.toMatch(/delete\s+from\s+(workout_sessions|set_logs|routine_backups)/i)
    expect(migration).toContain('insert into public.routine_backups')
    expect(migration.indexOf('insert into public.routine_backups')).toBeLessThan(
      migration.indexOf('update public.workouts set is_archived = true')
    )
  })

  it('restringe a aplicação à conta principal e não toca a conta demo', () => {
    expect(migration).toContain('cd801c7a-7674-47f5-904f-5ce8c28d7819')
    expect(executableMigration).not.toContain('b3069778')
  })

  it('permite o novo tipo guided_top_set na constraint de prescrição, sem remover os tipos existentes', () => {
    expect(migration).toContain("prescription_type = 'guided_top_set'")
    expect(migration).toContain("prescription_type = 'fixed_reps'")
    expect(migration).toContain("prescription_type = 'rep_range'")
    expect(migration).toContain("prescription_type = 'rep_max_effort'")
  })

  it('separa fonte e orientação em colunas próprias', () => {
    for (const field of ['source_prescription', 'guided_prescription', 'percentage_of_e1rm', 'load_strategy', 'guided_reps_fixed']) {
      expect(migration).toContain(field)
    }
  })
})
