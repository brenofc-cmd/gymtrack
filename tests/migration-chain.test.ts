import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'fs'
import path from 'path'

/**
 * Teste de regressão da CADEIA de migrations.
 *
 * Bug encontrado na auditoria 10/10: 0001_initial.sql restringia
 * workouts.letter a A–E, mas a rotina v4 insere o treino F. Em banco limpo, a
 * migration da rotina falhava. Este teste percorre as migrations na ordem real
 * de execução e reprova se, no momento em que uma letra é inserida, a
 * constraint vigente não a permitir.
 *
 * (Executa análise estática do SQL — a validação em banco real exige Supabase
 * CLI/Docker, indisponíveis neste ambiente e registrados como bloqueio em
 * docs/VALIDACAO_RLS_GYMTRACK.md.)
 */

const MIGRATIONS_DIR = path.resolve(__dirname, '../supabase/migrations')

function migrationsInOrder(): Array<{ name: string; sql: string }> {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(path.join(MIGRATIONS_DIR, name), 'utf-8'),
    }))
}

/** SQL sem comentários de linha — evita casar com blocos de rollback. */
function executable(sql: string): string {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
}

/** Letras aceitas pela constraint vigente, simulando a execução em ordem. */
function letterConstraintTimeline() {
  const timeline: Array<{ migration: string; allowed: Set<string> }> = []
  let allowed: Set<string> | null = null

  for (const { name, sql } of migrationsInOrder()) {
    const code = executable(sql)
    // create table … letter … check (letter in ('A', …))  ou  add constraint … check (letter in (…))
    const declaration = code.match(/letter[\s\S]{0,120}?check\s*\(\s*letter\s+in\s*\(([^)]*)\)/i)
    if (declaration) {
      allowed = new Set(
        declaration[1]
          .split(',')
          .map((value) => value.trim().replace(/'/g, ''))
          .filter(Boolean)
      )
    }
    timeline.push({ migration: name, allowed: new Set(allowed ?? []) })
  }
  return timeline
}

/** Letras de workout inseridas por uma migration (insert into workouts …). */
function lettersInserted(sql: string): string[] {
  const code = executable(sql)
  const letters = new Set<string>()
  // A rotina v4 insere via variáveis; captura os literais de letra usados
  // em contexto de workouts (ex.: 'Legs B', 'F', 6, …).
  for (const match of code.matchAll(/insert into (?:public\.)?workouts[\s\S]{0,2000}?;/gi)) {
    for (const literal of match[0].matchAll(/'([A-F])'/g)) letters.add(literal[1])
  }
  for (const match of code.matchAll(/v_letter\s*(?::=|=)\s*'([A-F])'/gi)) letters.add(match[1])
  return [...letters]
}

describe('cadeia de migrations — constraint de workouts.letter', () => {
  it('a rotina v4 realmente insere o treino F (premissa do teste)', () => {
    const routine = migrationsInOrder().find((m) => m.name.includes('powerbuilding_routine_v4'))
    expect(routine).toBeDefined()
    expect(routine!.sql).toContain("'F'")
  })

  it('REGRESSÃO: nenhuma migration insere uma letra proibida pela constraint vigente', () => {
    const timeline = letterConstraintTimeline()
    const migrations = migrationsInOrder()
    const violations: string[] = []

    migrations.forEach(({ name, sql }, index) => {
      const allowed = timeline[index].allowed
      if (allowed.size === 0) return
      for (const letter of lettersInserted(sql)) {
        if (!allowed.has(letter)) {
          violations.push(
            `${name} insere '${letter}' mas a constraint vigente só aceita [${[...allowed].join(', ')}]`
          )
        }
      }
    })

    expect(violations).toEqual([])
  })

  it('a constraint final aceita as seis letras A–F', () => {
    const timeline = letterConstraintTimeline()
    const finalAllowed = timeline[timeline.length - 1].allowed
    expect([...finalAllowed].sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'F'])
  })

  it('a correção da constraint vem ANTES da migration que insere o treino F', () => {
    const names = migrationsInOrder().map((m) => m.name)
    const fixIndex = names.findIndex((name) => name.includes('workouts_letter_a_to_f'))
    const routineIndex = names.findIndex((name) => name.includes('powerbuilding_routine_v4'))
    expect(fixIndex).toBeGreaterThan(-1)
    expect(fixIndex).toBeLessThan(routineIndex)
  })

  it('a correção é idempotente e não destrói dados', () => {
    const fix = migrationsInOrder().find((m) => m.name.includes('workouts_letter_a_to_f'))!
    const code = executable(fix.sql)
    expect(code).toContain('drop constraint if exists')
    expect(code).not.toMatch(/delete from|truncate|drop table/i)
  })

  it('nenhuma migration da cadeia apaga histórico de sessões ou séries', () => {
    for (const { name, sql } of migrationsInOrder()) {
      const code = executable(sql)
      expect(
        code,
        `${name} não pode apagar histórico`
      ).not.toMatch(
        /(delete from|truncate)\s+(public\.)?(workout_sessions|set_logs|daily_core_sessions|daily_core_sets)\b/i
      )
    }
  })
})
