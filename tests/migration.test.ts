import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

const sql = readFileSync(
  path.resolve(__dirname, '../supabase/migrations/0005_rotina_v2_data.sql'),
  'utf-8'
)
const schemaSql = readFileSync(
  path.resolve(__dirname, '../supabase/migrations/0004_rotina_v2_schema.sql'),
  'utf-8'
)

describe('Migration de dados — preservação de histórico', () => {
  it('faz backup da ficha ativa antes de qualquer alteração', () => {
    expect(sql).toContain('insert into routine_backups')
    expect(sql.indexOf('insert into routine_backups')).toBeLessThan(
      sql.indexOf('set is_archived = true')
    )
  })

  // Apenas SQL executável (ignora o bloco de rollback comentado)
  const executableSql = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')

  it('arquiva a rotina anterior em vez de apagar', () => {
    expect(executableSql).toContain('set is_archived = true')
    expect(executableSql).not.toMatch(
      /delete from (workout_sessions|set_logs|workouts|workout_exercises)/i
    )
  })

  it('não altera sessões nem séries já realizadas', () => {
    expect(executableSql).not.toMatch(/update (workout_sessions|set_logs)/i)
  })

  it('cria os 6 treinos da rotina v2 com dia da semana', () => {
    for (const [name, day] of [
      ['Push A', 1], ['Pull A', 2], ['Legs A', 3],
      ['Push B', 4], ['Pull B', 5], ['Legs B', 6],
    ] as const) {
      expect(sql).toContain(`'${name}'`)
      expect(sql).toMatch(new RegExp(`'${name}', \\d+, ${day},`))
    }
  })

  it('ativa a nova rotina com routine_version = 2', () => {
    expect(sql).toMatch(/routine_version/)
    expect(sql).toContain('warmup_note')
  })

  it('documenta o procedimento de rollback', () => {
    expect(sql).toMatch(/Rollback \(down\)/)
  })

  it('reutiliza exercícios do catálogo por nome (find-or-create, sem duplicar)', () => {
    expect(sql).toContain("where name_pt = 'Supino inclinado com halteres (banco a 30°)'")
    expect(sql).toContain('if v_ex is null then')
  })
})

describe('Migration de schema — RLS e estrutura', () => {
  it('habilita RLS nas tabelas novas', () => {
    expect(schemaSql).toContain(
      'alter table workout_exercise_substitutions enable row level security'
    )
    expect(schemaSql).toContain('alter table routine_backups enable row level security')
  })

  it('políticas restringem acesso ao próprio usuário', () => {
    expect(schemaSql).toMatch(/auth\.uid\(\) = user_id/)
    expect(schemaSql).toMatch(/w\.user_id = auth\.uid\(\)/)
  })

  it('registra a variação executada por série com FK para exercises', () => {
    expect(schemaSql).toContain(
      'alter table set_logs add column if not exists performed_exercise_id uuid references exercises(id)'
    )
  })

  it('substituições têm FK com cascade e unicidade', () => {
    expect(schemaSql).toContain('references workout_exercises(id) on delete cascade')
    expect(schemaSql).toContain('unique (workout_exercise_id, exercise_id)')
  })

  it('documenta o rollback', () => {
    expect(schemaSql).toMatch(/Rollback \(down\)/)
  })
})
