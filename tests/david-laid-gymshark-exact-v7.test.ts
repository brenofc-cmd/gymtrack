import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DAVID_LAID_GYMSHARK_EXACT_V7,
  ROUTINE_VERSION,
} from '@/lib/routine/david-laid-gymshark-exact-v7'

const migration = readFileSync(
  path.resolve(__dirname, '../supabase/migrations/20260731120000_david_laid_gymshark_exact_v7.sql'),
  'utf8'
)
const executableMigration = migration.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n')

const compact = DAVID_LAID_GYMSHARK_EXACT_V7.map((day) => ({
  letter: day.letter,
  items: day.exercises.map((item) => [item.slug, item.sets, item.repsMin, item.repsMax, item.repMaxTarget ?? null]),
}))

describe('fonte canônica David Laid Powerbuilding DUP — Gymshark Exact v7', () => {
  it('trava a divisão A–F completa em seis dias e 41 entradas ordenadas, exatamente como no artigo', () => {
    expect(ROUTINE_VERSION).toBe(7)
    expect(compact).toEqual([
      { letter: 'A', items: [
        ['back-squat', 1, 5, 5, 5], ['back-squat', 4, 12, 12, null],
        ['romanian-deadlift', 3, 10, 10, null], ['walking-lunge', 3, 10, 10, null],
        ['glute-ham-raise', 3, 10, 10, null],
      ] },
      { letter: 'B', items: [
        ['barbell-bench-press', 1, 1, 1, 1], ['barbell-bench-press', 4, 4, 4, null],
        ['push-press', 3, 4, 4, null], ['weighted-dip', 3, 10, 10, null],
        ['dumbbell-fly', 3, 10, 10, null], ['dumbbell-lateral-raise', 3, 10, 10, null],
        ['skull-crusher', 3, 10, 10, null], ['dumbbell-triceps-extension', 3, 10, 10, null],
      ] },
      { letter: 'C', items: [
        ['conventional-deadlift', 1, 3, 3, 3], ['conventional-deadlift', 4, 6, 6, null],
        ['stiff-leg-deadlift', 3, 10, 10, null], ['pull-up', 3, 8, 10, null],
        ['yates-row', 3, 10, 10, null], ['barbell-shrug', 3, 10, 10, null],
        ['barbell-curl', 3, 10, 10, null], ['seated-hammer-curl', 3, 10, 10, null],
      ] },
      { letter: 'D', items: [
        ['back-squat', 1, 3, 3, 3], ['back-squat', 4, 8, 8, null],
        ['romanian-deadlift', 3, 10, 10, null], ['walking-lunge', 3, 10, 10, null],
        ['glute-ham-raise', 3, 10, 10, null],
      ] },
      { letter: 'E', items: [
        ['barbell-overhead-press', 1, 5, 5, 5], ['barbell-overhead-press', 4, 12, 12, null],
        ['incline-barbell-bench-press', 3, 12, 12, null], ['dumbbell-lateral-raise', 3, 10, 10, null],
        ['weighted-dip', 3, 10, 10, null], ['dumbbell-triceps-extension', 3, 10, 10, null],
        ['skull-crusher', 3, 10, 10, null],
      ] },
      { letter: 'F', items: [
        ['conventional-deadlift', 1, 1, 1, 1], ['conventional-deadlift', 4, 2, 2, null],
        ['stiff-leg-deadlift', 3, 10, 10, null], ['pull-up', 3, 8, 10, null],
        ['yates-row', 3, 10, 10, null], ['barbell-shrug', 3, 10, 10, null],
        ['barbell-curl', 3, 10, 10, null], ['seated-hammer-curl', 3, 10, 10, null],
      ] },
    ])
    expect(compact.flatMap((day) => day.items)).toHaveLength(41)
  })

  it('usa o stiff-leg deadlift sem déficit no dia F (a fonte não prescreve déficit nesse dia)', () => {
    const dayF = DAVID_LAID_GYMSHARK_EXACT_V7.find((day) => day.letter === 'F')!
    expect(dayF.exercises.map((item) => item.slug)).not.toContain('deficit-stiff-leg-deadlift')
    expect(dayF.exercises[2].slug).toBe('stiff-leg-deadlift')
  })

  it('só tem duas alternativas explícitas e nenhum exercício de abdômen', () => {
    const alternatives = DAVID_LAID_GYMSHARK_EXACT_V7.flatMap((day) =>
      day.exercises.flatMap((item) => (item.alternativeSlug ? [item.alternativeSlug] : []))
    )
    expect(alternatives).toEqual(['reverse-hyper', 'pec-deck', 'reverse-hyper'])
    const slugs = DAVID_LAID_GYMSHARK_EXACT_V7.flatMap((day) => day.exercises.map((item) => item.slug))
    expect(slugs).not.toContain('cable-crunch')
    expect(slugs).not.toContain('reverse-crunch')
  })
})

describe('migration david_laid_gymshark_exact_v7', () => {
  it('é idempotente, falha sem catálogo e valida 6 dias / 41 exercícios', () => {
    expect(migration).toContain('provision_david_laid_gymshark_exact_v7')
    expect(migration).toContain('if v_days = 6 then')
    expect(migration).toContain("raise exception 'required exercise missing")
    expect(migration).toContain('v_days <> 6 or v_exercises <> 41')
  })

  it('nunca apaga sessão, série ou histórico (só arquiva/cancela logicamente)', () => {
    expect(executableMigration).not.toMatch(/delete\s+from\s+(workout_sessions|set_logs|routine_backups)/i)
    expect(migration).toContain('insert into public.routine_backups')
    expect(migration.indexOf('insert into public.routine_backups')).toBeLessThan(
      migration.indexOf("update public.workouts set is_archived = true")
    )
  })

  it('não cria supersets e não define RIR/descanso como se fossem da fonte', () => {
    expect(migration).toMatch(/v_item->>7,\s*\n\s*null\s*\n\s*\)\s*returning id into v_workout_exercise_id;/)
    expect(migration).toContain("'app_suggested'")
    expect(migration).toMatch(/null,\s*\n\s*null,\s*\n\s*case/)
  })

  it('restringe a aplicação à conta principal e não toca a conta demo', () => {
    expect(migration).toContain('cd801c7a-7674-47f5-904f-5ce8c28d7819')
    // A conta demo pode ser citada apenas em comentário explicando que não é
    // tocada — nenhuma operação executável pode ser aplicada a ela.
    expect(executableMigration).not.toContain('b3069778')
    expect(migration).not.toMatch(/select distinct user_id from public\.workouts/)
  })
})
