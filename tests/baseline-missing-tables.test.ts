import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

const sql = readFileSync(
  path.resolve(__dirname, '../supabase/migrations/20260729120000_baseline_missing_tables.sql'),
  'utf-8'
)

// Apenas SQL executável (ignora o bloco de rollback comentado)
const executableSql = sql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')

// Tabelas usadas pelo código e tipadas em types/database.ts que não tinham
// migration (criadas direto no Dashboard). A auditoria listou 10; o cruzamento
// completo tipos × migrations revelou 14.
const ORPHAN_TABLES = [
  'body_measurements',
  'body_weight_logs',
  'sleep_logs',
  'recovery_logs',
  'hydration_logs',
  'nutrition_goals',
  'food_items',
  'meals',
  'meal_entries',
  'recipes',
  'recipe_ingredients',
  'supplements',
  'supplement_logs',
  'user_preferences',
] as const

// Tabelas cujo dono é a própria linha (user_id = auth.uid())
const OWNED_BY_USER_ID = [
  'body_measurements',
  'body_weight_logs',
  'sleep_logs',
  'recovery_logs',
  'hydration_logs',
  'nutrition_goals',
  'meals',
  'supplement_logs',
] as const

// Catálogos: user_id null = global somente leitura
const CATALOG_TABLES = ['food_items', 'recipes', 'supplements'] as const

describe('Migration baseline — tabelas órfãs', () => {
  it('cria as 14 tabelas de forma idempotente (create table if not exists)', () => {
    for (const table of ORPHAN_TABLES) {
      expect(executableSql).toContain(`create table if not exists public.${table}`)
    }
  })

  it('habilita RLS em todas as 14 tabelas', () => {
    for (const table of ORPHAN_TABLES) {
      expect(executableSql).toContain(`alter table public.${table} enable row level security`)
    }
  })

  it('cria as 4 políticas (select/insert/update/delete) para cada tabela', () => {
    for (const table of ORPHAN_TABLES) {
      const policies = executableSql.match(
        new RegExp(`create policy "[^"]+" on public\\.${table} for (select|insert|update|delete)`, 'g')
      )
      expect(policies, `políticas de ${table}`).not.toBeNull()
      expect(new Set(policies).size, `políticas distintas de ${table}`).toBe(4)
    }
  })

  it('políticas são idempotentes (drop policy if exists antes de cada create policy)', () => {
    const creates = executableSql.match(/create policy/g) ?? []
    const drops = executableSql.match(/drop policy if exists/g) ?? []
    expect(drops.length).toBe(creates.length)
  })

  it('tabelas por dono restringem ao próprio usuário via (select auth.uid()) = user_id', () => {
    for (const table of OWNED_BY_USER_ID) {
      const section = executableSql
        .split(`on public.${table} for select`)[1]
        ?.split('create policy')[0]
      expect(section, `política de select de ${table}`).toContain('(select auth.uid()) = user_id')
    }
  })

  it('catálogos permitem leitura de itens globais e escrita apenas do dono', () => {
    for (const table of CATALOG_TABLES) {
      expect(executableSql).toMatch(
        new RegExp(`on public\\.${table} for select to authenticated using \\(user_id is null or \\(select auth\\.uid\\(\\)\\) = user_id\\)`)
      )
      expect(executableSql).toMatch(
        new RegExp(`on public\\.${table} for insert to authenticated with check \\(\\(select auth\\.uid\\(\\)\\) = user_id\\)`)
      )
    }
  })

  it('tabelas-filhas herdam o dono do pai (meal_entries via meals, recipe_ingredients via recipes)', () => {
    expect(executableSql).toContain('from public.meals m where m.id = meal_id and m.user_id = (select auth.uid())')
    expect(executableSql).toContain('from public.recipes r where r.id = recipe_id and r.user_id = (select auth.uid())')
  })

  it('user_preferences é chaveada por id = auth.uid() (como user_profiles)', () => {
    expect(executableSql).toMatch(/on public\.user_preferences for select to authenticated using \(\(select auth\.uid\(\)\) = id\)/)
    expect(executableSql).toContain('id uuid primary key references auth.users(id) on delete cascade')
  })

  it('nutrition_goals tem unicidade por usuário (upsert onConflict user_id)', () => {
    expect(executableSql).toMatch(/nutrition_goals[\s\S]*?user_id uuid not null unique references auth\.users\(id\)/)
  })

  it('FKs em cascade para auth.users e índices nas FKs filtradas', () => {
    expect(executableSql).toContain('references auth.users(id) on delete cascade')
    for (const idx of [
      'body_measurements_user_date_idx',
      'meals_user_date_idx',
      'meal_entries_meal_idx',
      'recipe_ingredients_recipe_idx',
      'supplement_logs_user_date_idx',
    ]) {
      expect(executableSql).toContain(`create index if not exists ${idx}`)
    }
  })

  it('não toca em dados históricos (workout_sessions, set_logs, daily_core_*)', () => {
    expect(executableSql).not.toMatch(
      /(delete from|update|truncate|drop table[^;]*)\s+(public\.)?(workout_sessions|set_logs|daily_core_sessions|daily_core_sets|routine_backups)/i
    )
  })

  it('documenta o procedimento de rollback', () => {
    expect(sql).toMatch(/Rollback seguro/)
    expect(sql).toMatch(/NUNCA executar em produção/)
  })
})
