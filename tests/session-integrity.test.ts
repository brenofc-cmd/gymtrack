import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import {
  cancelSessionLogically,
  getSessionsHistory,
  startOrResumeSession,
} from '@/lib/queries/sessions'

const migrationSql = readFileSync(
  path.resolve(__dirname, '../supabase/migrations/20260729140000_session_integrity.sql'),
  'utf-8'
)
const executableSql = migrationSql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')
const legacyIndexFixSql = readFileSync(
  path.resolve(
    __dirname,
    '../supabase/migrations/20260730161430_drop_legacy_active_session_index.sql'
  ),
  'utf-8'
)

// ---------------------------------------------------------------------------
// Mock mínimo do query builder do Supabase (encadeável e awaitable)
// ---------------------------------------------------------------------------

type MockResult = { data: unknown; error: { code?: string; message?: string } | null }
type RecordedCall = [method: string, args: unknown[]]

function chain(result: MockResult) {
  const calls: RecordedCall[] = []
  const methods = [
    'select', 'eq', 'is', 'not', 'or', 'order', 'limit', 'gte', 'in',
    'insert', 'update', 'delete', 'single', 'maybeSingle',
  ]
  const c: Record<string, unknown> & { calls: RecordedCall[] } = { calls }
  for (const method of methods) {
    c[method] = (...args: unknown[]) => {
      calls.push([method, args])
      return c
    }
  }
  ;(c as { then?: unknown }).then = (
    resolve: (value: MockResult) => unknown,
    reject: (reason?: unknown) => unknown
  ) => Promise.resolve(result).then(resolve, reject)
  return c
}

/** Cada chamada a from('workout_sessions') consome o próximo resultado da lista. */
function mockSupabase(results: MockResult[]) {
  const chains: ReturnType<typeof chain>[] = []
  let call = 0
  const client = {
    from: () => {
      const c = chain(results[call] ?? { data: null, error: { message: 'sem resultado' } })
      call += 1
      chains.push(c)
      return c
    },
  }
  return { client: client as unknown as SupabaseClient<Database>, chains }
}

const activeRow = {
  id: 'sessao-ativa',
  workout_id: 'treino-a',
  user_id: 'u1',
  started_at: '2026-07-29T12:00:00Z',
  finished_at: null,
  cancelled_at: null,
  workout: { name: 'Push A', is_archived: false, routine_version: 6 },
}

// ---------------------------------------------------------------------------
// Migration (estático)
// ---------------------------------------------------------------------------

describe('migration de integridade de sessões', () => {
  it('adiciona cancelled_at e cancel_reason de forma idempotente', () => {
    expect(executableSql).toContain('add column if not exists cancelled_at timestamptz')
    expect(executableSql).toContain('add column if not exists cancel_reason text')
  })

  it('garante no máximo uma sessão ativa por usuário (índice único parcial)', () => {
    expect(executableSql).toContain('create unique index if not exists workout_sessions_one_active_idx')
    expect(executableSql).toMatch(/where finished_at is null and cancelled_at is null/)
  })

  it('deduplica sessões ativas ANTES de criar o índice, sem apagar nada', () => {
    const updateAt = executableSql.indexOf('update public.workout_sessions')
    const indexAt = executableSql.indexOf('create unique index')
    expect(updateAt).toBeGreaterThan(-1)
    expect(updateAt).toBeLessThan(indexAt)
    expect(executableSql).not.toMatch(/delete from|truncate/i)
    // A deduplicação só toca sessões ativas (não mexe em histórico concluído)
    expect(executableSql).toMatch(/ws\.finished_at is null/)
  })

  it('documenta rollback seguro', () => {
    expect(migrationSql).toMatch(/Rollback seguro/)
  })

  it('remove o índice legado que tratava sessões canceladas como ativas', () => {
    expect(legacyIndexFixSql).toContain(
      'drop index if exists public.uniq_active_session_per_user'
    )
    expect(legacyIndexFixSql).toMatch(
      /where finished_at is null and cancelled_at is null/
    )
  })

  it('cancela logicamente sessão ativa de ficha antiga sem apagar séries', () => {
    expect(legacyIndexFixSql).toMatch(/workout\.is_archived = true/)
    expect(legacyIndexFixSql).toMatch(/workout\.routine_version is distinct from 5/)
    expect(legacyIndexFixSql).not.toMatch(/\b(delete|truncate)\b/i)
  })

  it('RLS de workout_sessions já cobre o update do cancelamento (política do dono, for all)', () => {
    const schemaSql = readFileSync(
      path.resolve(__dirname, '../supabase/migrations/0001_initial.sql'),
      'utf-8'
    )
    expect(schemaSql).toMatch(
      /create policy "sessions do usuário" on workout_sessions\s*\n?\s*for all using \(auth\.uid\(\) = user_id\)/
    )
  })
})

// ---------------------------------------------------------------------------
// startOrResumeSession
// ---------------------------------------------------------------------------

describe('startOrResumeSession — sessão única', () => {
  it('sem sessão ativa: cria uma nova e retorna started', async () => {
    const { client, chains } = mockSupabase([
      { data: null, error: null }, // getActiveSession: nada
      { data: { id: 'nova-sessao' }, error: null }, // insert
    ])
    const result = await startOrResumeSession(client, 'u1', 'treino-a')
    expect(result).toEqual({ kind: 'started', sessionId: 'nova-sessao' })
    expect(chains[1].calls.map(([m]) => m)).toContain('insert')
  })

  it('com sessão ativa: retoma em vez de criar (nunca duas ativas)', async () => {
    const { client, chains } = mockSupabase([{ data: activeRow, error: null }])
    const result = await startOrResumeSession(client, 'u1', 'treino-a')
    expect(result).toEqual({
      kind: 'resumed',
      sessionId: 'sessao-ativa',
      workoutId: 'treino-a',
      sameWorkout: true,
    })
    expect(chains).toHaveLength(1) // nenhum insert aconteceu
  })

  it('cancela logicamente sessão de rotina arquivada e inicia a ficha atual', async () => {
    const archivedActive = {
      ...activeRow,
      workout: { name: 'Ficha antiga', is_archived: true, routine_version: 1 },
    }
    const { client, chains } = mockSupabase([
      { data: archivedActive, error: null },
      { data: null, error: null },
      { data: { id: 'sessao-v6' }, error: null },
    ])
    const result = await startOrResumeSession(client, 'u1', 'treino-v6')
    expect(result).toEqual({ kind: 'started', sessionId: 'sessao-v6' })
    expect(chains[1].calls.map(([method]) => method)).toContain('update')
    expect(chains[2].calls.map(([method]) => method)).toContain('insert')
  })

  it('sessão ativa de OUTRO treino: sinaliza sameWorkout=false para o diálogo', async () => {
    const { client } = mockSupabase([{ data: activeRow, error: null }])
    const result = await startOrResumeSession(client, 'u1', 'treino-b')
    expect(result).toMatchObject({ kind: 'resumed', sameWorkout: false })
  })

  it('corrida simulada: insert viola o índice único (23505) e a sessão vencedora é reaberta', async () => {
    const { client } = mockSupabase([
      { data: null, error: null }, // getActiveSession: nada (ainda)
      { data: null, error: { code: '23505', message: 'duplicate key' } }, // insert perde a corrida
      { data: activeRow, error: null }, // releitura acha a vencedora
    ])
    const result = await startOrResumeSession(client, 'u1', 'treino-a')
    expect(result).toMatchObject({ kind: 'resumed', sessionId: 'sessao-ativa' })
  })

  it('getActiveSession ignora sessões canceladas (filtro cancelled_at is null)', async () => {
    const { client, chains } = mockSupabase([
      { data: null, error: null },
      { data: { id: 'nova' }, error: null },
    ])
    await startOrResumeSession(client, 'u1', 'treino-a')
    const isCalls = chains[0].calls.filter(([m]) => m === 'is')
    expect(isCalls).toContainEqual(['is', ['finished_at', null]])
    expect(isCalls).toContainEqual(['is', ['cancelled_at', null]])
  })
})

// ---------------------------------------------------------------------------
// Cancelamento lógico
// ---------------------------------------------------------------------------

describe('cancelSessionLogically — histórico preservado', () => {
  it('emite UPDATE com cancelled_at (nunca delete) e calcula a duração', async () => {
    const { client, chains } = mockSupabase([{ data: null, error: null }])
    await cancelSessionLogically(
      client,
      { id: 's1', started_at: new Date(Date.now() - 90_000).toISOString() },
      'teste'
    )
    const methods = chains[0].calls.map(([m]) => m)
    expect(methods).toContain('update')
    expect(methods).not.toContain('delete')
    const [, [payload]] = chains[0].calls.find(([m]) => m === 'update')!
    const update = payload as { cancelled_at: string; cancel_reason: string; duration_seconds: number }
    expect(update.cancelled_at).toBeTruthy()
    expect(update.cancel_reason).toBe('teste')
    expect(update.duration_seconds).toBeGreaterThanOrEqual(89)
  })

  it('o código do app não usa mais delete em workout_sessions', () => {
    const sessionClient = readFileSync(
      path.resolve(__dirname, '../app/(app)/sessao/[id]/SessionClient.tsx'),
      'utf-8'
    )
    expect(sessionClient).not.toMatch(/from\('workout_sessions'\)\s*\.delete/)
    expect(sessionClient).toContain('cancelSessionLogically')
  })
})

// ---------------------------------------------------------------------------
// Histórico e métricas
// ---------------------------------------------------------------------------

describe('sessões canceladas: consultáveis, fora das métricas', () => {
  it('histórico inclui canceladas COM séries e exclui canceladas sem séries', async () => {
    const rows = [
      { id: 'ok', finished_at: '2026-07-28T18:00:00Z', cancelled_at: null, set_logs: [{ count: 12 }], workout: null },
      { id: 'cancel-com-series', finished_at: null, cancelled_at: '2026-07-27T18:00:00Z', set_logs: [{ count: 3 }], workout: null },
      { id: 'cancel-vazia', finished_at: null, cancelled_at: '2026-07-26T18:00:00Z', set_logs: [{ count: 0 }], workout: null },
    ]
    const { client } = mockSupabase([{ data: rows, error: null }])
    const history = await getSessionsHistory(client, 'u1')
    expect(history.map((s) => s.id)).toEqual(['ok', 'cancel-com-series'])
  })

  it('todas as queries de métrica filtram finished_at (canceladas ficam de fora por construção)', () => {
    for (const file of [
      'lib/queries/analytics.ts',
      'lib/queries/progress.ts',
      'lib/queries/profile.ts',
      'lib/queries/exercises.ts',
      'lib/utils/streak.ts',
      'lib/queries/deload.ts',
    ]) {
      const source = readFileSync(path.resolve(__dirname, '..', file), 'utf-8')
      expect(source, file).toMatch(/not\('finished_at', 'is', null\)|is\('cancelled_at', null\)/)
    }
  })
})
