import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  path.resolve(__dirname, '../supabase/migrations/20260731180000_e1rm_rir_formula.sql'),
  'utf8'
)

describe('migration e1rm_rir_formula', () => {
  it('atualiza o trigger para exigir RIR e usar a janela de 3–8 reps', () => {
    expect(migration).toContain('reps between 3 and 8')
    expect(migration).toContain('new.rir is not null')
    expect(migration).toContain('(new.weight_kg * (1 + (new.reps + new.rir) / 30.0))')
  })

  it('recalcula o campo derivado sem apagar peso/reps/RIR/técnica/dor brutos', () => {
    expect(migration).not.toMatch(/delete\s+from\s+set_logs/i)
    expect(migration).not.toMatch(/update\s+set_logs\s+set\s+weight_kg/i)
    expect(migration).not.toMatch(/update\s+set_logs\s+set\s+reps\s*=/i)
    expect(migration).toContain('set estimated_1rm = case')
  })

  it('adiciona contagem de amostras válidas e nível de confiança ao perfil de força', () => {
    expect(migration).toContain('valid_sample_count')
    expect(migration).toContain('confidence_level')
    expect(migration).toContain("check (confidence_level in ('baixa', 'media', 'alta'))")
  })
})
