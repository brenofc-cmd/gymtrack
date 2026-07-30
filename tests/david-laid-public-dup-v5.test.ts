import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DAVID_LAID_EXERCISE_CATALOG_V5,
  DAVID_LAID_PUBLIC_DUP_V5,
  ROUTINE_VERSION,
} from '@/lib/routine/david-laid-public-dup-v5'

const migration = readFileSync(
  path.resolve(__dirname, '../supabase/migrations/20260730090000_david_laid_public_dup_v5.sql'),
  'utf8'
)
const progressionMigration = readFileSync(
  path.resolve(__dirname, '../supabase/migrations/20260730110000_dup_progression_blocks.sql'),
  'utf8'
)

const compact = DAVID_LAID_PUBLIC_DUP_V5.map((day) => ({
  letter: day.letter,
  items: day.exercises.map((item) => [
    item.exerciseSlug,
    item.sets,
    item.repsMin,
    item.repsMax,
    item.repMaxTarget ?? null,
  ]),
}))

describe('fonte canônica do DUP público v5', () => {
  it('trava a rotina pública completa em seis dias e 41 entradas ordenadas', () => {
    expect(ROUTINE_VERSION).toBe(5)
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
        ['deficit-stiff-leg-deadlift', 3, 10, 10, null], ['pull-up', 3, 8, 10, null],
        ['yates-row', 3, 10, 10, null], ['barbell-shrug', 3, 10, 10, null],
        ['barbell-curl', 3, 10, 10, null], ['seated-hammer-curl', 3, 10, 10, null],
      ] },
    ])
    expect(compact.flatMap((day) => day.items)).toHaveLength(41)
  })

  it('mantém déficit como exercício próprio e somente duas alternativas explícitas', () => {
    expect(DAVID_LAID_EXERCISE_CATALOG_V5['deficit-stiff-leg-deadlift'].equipment)
      .toContain('5–7,5 cm')
    const substitutions = DAVID_LAID_PUBLIC_DUP_V5.flatMap((day) =>
      day.exercises.flatMap((item) => item.substitutions)
    )
    expect(substitutions).toEqual(['reverse-hyper', 'pec-deck', 'reverse-hyper'])
  })
})

describe('provisionamento e bloco DUP v5', () => {
  it('é idempotente, falha sem catálogo e não usa fallback genérico', () => {
    expect(migration).toContain('provision_david_laid_public_dup_v5')
    expect(migration).toContain("if v_days = 6 then")
    expect(migration).toContain("raise exception 'required exercise missing")
    expect(migration).toContain('v_workout_id uuid')
    expect(migration).toContain('v_workout_exercise_id uuid')
    expect(migration).toContain('v_substitution_exercise_id uuid')
    expect(migration).not.toMatch(/coalesce\([^)]*'geral'|coalesce\([^)]*'barra'/i)
    expect(migration).toContain('v_days <> 6 or v_exercises <> 41')
  })

  it('protege dados por usuário, grava operações offline e só avança após A–F', () => {
    expect(progressionMigration).toContain('enable row level security')
    expect(progressionMigration).toContain('set_logs_client_operation_unique')
    expect(progressionMigration).toContain('attach_active_dup_block_to_session_trigger')
    expect(progressionMigration).toContain('count(distinct w.letter)')
    expect(progressionMigration).toContain('if v_completed_letters < 6 then')
    expect(progressionMigration).toContain("total_weeks=9")
    expect(progressionMigration).not.toMatch(/delete from public\.(workout_sessions|set_logs)/i)
  })
})
