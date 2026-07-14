import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const schema = readFileSync(path.resolve(__dirname, '../supabase/migrations/20260714105546_powerbuilding_schema.sql'), 'utf8')
const routine = readFileSync(path.resolve(__dirname, '../supabase/migrations/20260714105553_powerbuilding_routine_v4.sql'), 'utf8')
const metrics = readFileSync(path.resolve(__dirname, '../supabase/migrations/20260714111522_safe_estimated_1rm_trigger.sql'), 'utf8')
const executableRoutine = routine.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n')

describe('Migration powerbuilding v4', () => {
  it('faz backup, arquiva e nunca apaga histórico executável', () => {
    expect(routine.indexOf('insert into routine_backups')).toBeLessThan(routine.indexOf('set is_archived = true'))
    expect(executableRoutine).not.toMatch(/delete\s+from\s+(workout_sessions|set_logs)/i)
    expect(executableRoutine).not.toMatch(/update\s+(workout_sessions|set_logs)/i)
  })

  it('documenta rollback e ativa seis treinos v4', () => {
    expect(routine).toMatch(/Rollback \(down\)/)
    expect(routine.match(/routine_version, session_focus/g)?.length).toBeGreaterThanOrEqual(6)
    expect(routine).toContain("'pre-rotina-v4'")
  })

  it('protege readiness por usuário e libera apenas leitura das fontes', () => {
    expect(schema).toContain('alter table public.daily_readiness enable row level security')
    expect(schema).toMatch(/auth\.uid\(\)\) = user_id/)
    expect(schema).toContain('grant select, insert, update, delete on public.daily_readiness to authenticated')
    expect(schema).toContain('grant select on public.content_sources to authenticated')
    expect(schema).not.toContain('grant insert, update, delete on public.content_sources')
  })

  it('adiciona top/back-off, e1RM, ROM, fase e proveniência', () => {
    for (const field of ['top_set_enabled', 'backoff_percentage', 'estimated_1rm', 'rom_quality', 'training_phase', 'provenance']) {
      expect(schema).toContain(field)
    }
  })

  it('persiste e1RM por trigger apenas quando técnica, dor, ROM e reps são válidos', () => {
    expect(metrics).toContain('create trigger trg_set_safe_estimated_1rm')
    expect(metrics).toContain("execution_quality = 'boa'")
    expect(metrics).toContain("pain_level = 'nenhuma'")
    expect(metrics).toContain("coalesce(rom_quality, 'adequada') <> 'reduzida'")
    expect(metrics).toContain('reps between 3 and 10')
    expect(metrics).toMatch(/Rollback:/)
  })
})
