import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  path.resolve(__dirname, '../supabase/migrations/20260820090000_consolidate_david_laid_canonical_routine.sql'),
  'utf8'
)

describe('migration consolidate_david_laid_canonical_routine', () => {
  it('corrige prescription_type/fixed_reps de guided_top_set de volta para rep_max_effort, sem tocar sets/reps/rep_max_target', () => {
    const executable = migration.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n')
    expect(executable).toContain("prescription_type = 'rep_max_effort'")
    expect(executable).toContain('fixed_reps = null')
    expect(executable).toContain("we.prescription_type = 'guided_top_set'")
    expect(executable).not.toMatch(/target_reps_min\s*=/)
    expect(executable).not.toMatch(/target_reps_max\s*=/)
    expect(executable).not.toMatch(/rep_max_target\s*=/)
  })

  it('dobra routine_version 8 em 7 nas três tabelas que rastreiam a rotina ativa', () => {
    expect(migration).toMatch(/update public\.workouts\s+set routine_version = 7\s+where routine_version = 8;/)
    expect(migration).toMatch(/update public\.training_program_blocks\s+set routine_version = 7\s+where routine_version = 8;/)
    expect(migration).toMatch(/update public\.user_preferences\s+set routine_provisioned_version = 7\s+where routine_provisioned_version = 8;/)
  })

  it('nunca apaga ou faz update em workout_sessions/set_logs (a correção é só em workout_exercises)', () => {
    const executable = migration.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n')
    expect(executable).not.toMatch(/delete\s+from/i)
    expect(executable).not.toMatch(/update\s+(public\.)?workout_sessions/i)
    expect(executable).not.toMatch(/update\s+(public\.)?set_logs/i)
  })
})

describe('a rotina Guided Load v7 (duplicata) foi removida do código-fonte, não só corrigida no banco', () => {
  it('o arquivo lib/routine/david-laid-guided-load-v7.ts não existe mais', () => {
    expect(existsSync(path.resolve(__dirname, '../lib/routine/david-laid-guided-load-v7.ts'))).toBe(false)
  })

  it('os dois lugares que importavam a rotina Guided Load removida não a referenciam mais', () => {
    const routineMethodInfo = readFileSync(
      path.resolve(__dirname, '../components/workout/RoutineMethodInfo.tsx'),
      'utf8'
    )
    const currentExercisePanel = readFileSync(
      path.resolve(__dirname, '../components/session/CurrentExercisePanel.tsx'),
      'utf8'
    )
    expect(routineMethodInfo).not.toContain('david-laid-guided-load-v7')
    expect(currentExercisePanel).not.toContain('david-laid-guided-load-v7')
    expect(currentExercisePanel).not.toContain('guided_top_set')
  })
})
