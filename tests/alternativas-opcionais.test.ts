import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

const sql = readFileSync(
  path.resolve(__dirname, '../supabase/migrations/20260729150000_alternativas_opcionais.sql'),
  'utf-8'
)
const executableSql = sql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')

describe('alternativas opcionais — hiperextensão e dips', () => {
  it('cadastra os três exercícios no catálogo com metadados completos', () => {
    for (const name of [
      'Hiperextensão (banco 45° ou romano)',
      'Paralelas (dips)',
      'Paralelas assistidas (dips na máquina)',
    ]) {
      expect(executableSql).toContain(`'${name}'`)
    }
    // Campos exigidos pelo item 14 do prompt (biblioteca central)
    for (const column of [
      'name_pt', 'name_en', 'muscle_group', 'equipment', 'exercise_type',
      'movement_pattern', 'secondary_muscles', 'instructions', 'risk_level', 'difficulty_level',
    ]) {
      expect(executableSql).toContain(column)
    }
  })

  it('é idempotente: só insere quando o exercício ainda não existe', () => {
    const guards = executableSql.match(/if v_\w+ is null then/g) ?? []
    expect(guards.length).toBe(3)
    expect(executableSql).toContain('on conflict (workout_exercise_id, exercise_id) do nothing')
  })

  it('NÃO cria séries: nenhuma linha em workout_exercises é inserida', () => {
    expect(executableSql).not.toMatch(/insert into (public\.)?workout_exercises\b/)
  })

  it('não apaga nem altera histórico', () => {
    expect(executableSql).not.toMatch(
      /(delete from|truncate|update)\s+(public\.)?(set_logs|workout_sessions|daily_core_sessions|daily_core_sets)/i
    )
  })

  it('hiperextensão entra como substituição do terra romeno, não como exercício obrigatório', () => {
    expect(executableSql).toMatch(/name_pt like 'Terra romeno%'/)
    expect(executableSql).toContain('insert into public.workout_exercise_substitutions')
  })

  it('hiperextensão orienta parar na linha do tronco (sem hiperestender)', () => {
    expect(sql).toMatch(/PARE — não passe da linha/)
    expect(sql).toMatch(/Comece sem carga/)
  })

  it('dips alerta sobre ombro, oferece versão assistida e desaconselha carga precoce', () => {
    expect(sql).toMatch(/INTERROMPA se houver desconforto no ombro/)
    expect(sql).toContain('Paralelas assistidas (dips na máquina)')
    expect(sql).toMatch(/Não adicione carga antes de dominar a versão com peso corporal/)
  })

  it('dips diferencia ênfase peitoral × tríceps pela inclinação do tronco', () => {
    expect(sql).toMatch(/inclinado à frente enfatiza o peitoral.*vertical enfatiza o tríceps/)
  })

  it('a versão assistida ensina que progredir é reduzir assistência', () => {
    expect(sql).toMatch(/progredir aqui significa REDUZIR a assistência/i)
  })

  it('documenta rollback seguro e o motivo de cada inclusão', () => {
    expect(sql).toMatch(/Rollback seguro/)
    expect(sql).toMatch(/NUNCA em produção/)
    expect(sql).toMatch(/nunca como série obrigatória adicional/)
  })
})
