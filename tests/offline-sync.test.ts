// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  flushSyncQueue,
  getPendingSyncCount,
  persistExerciseFeedback,
  persistSetLog,
  removePersistedSetLog,
  type SetLogPayload,
} from '@/lib/offline/syncQueue'
import type { Database } from '@/types/database'

const payload: SetLogPayload = {
  id: 'stable-set-id',
  sessionId: 'session-1',
  workoutExerciseId: 'exercise-1',
  set_number: 1,
  weight_kg: 30,
  reps: 10,
  rir: 2,
  is_warmup: false,
  set_role: 'standard',
  execution_quality: 'boa',
  pain_level: 'nenhuma',
  rom_quality: 'completa',
  performed_exercise_id: null,
  completed_at: '2026-07-14T12:00:00.000Z',
}

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  })
}

describe('Fila offline idempotente', () => {
  beforeEach(() => {
    localStorage.clear()
    setOnline(false)
  })

  it('guarda a série offline e não duplica o mesmo ID', async () => {
    const supabase = {} as SupabaseClient<Database>
    expect((await persistSetLog(supabase, payload)).queued).toBe(true)
    expect((await persistSetLog(supabase, { ...payload, reps: 11 })).queued).toBe(true)

    const queue = JSON.parse(localStorage.getItem('gymtrack-pending-set-logs-v1') ?? '[]') as SetLogPayload[]
    expect(queue).toHaveLength(1)
    expect(queue[0]).toMatchObject({ id: 'stable-set-id', reps: 11 })
    expect(getPendingSyncCount()).toBe(1)
  })

  it('sincroniza ao recuperar conexão e esvazia a fila', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const supabase = {
      from: vi.fn(() => ({ upsert })),
    } as unknown as SupabaseClient<Database>

    await persistSetLog(supabase, payload)
    setOnline(true)
    await flushSyncQueue(supabase)

    expect(upsert).toHaveBeenCalledTimes(1)
    expect(getPendingSyncCount()).toBe(0)
  })

  it('preserva feedback e remoções offline sem duplicar alterações', async () => {
    const supabase = {} as SupabaseClient<Database>
    const feedback = {
      sessionId: 'session-1',
      workoutExerciseId: 'exercise-1',
      execution_quality: 'boa' as const,
      pain_level: 'nenhuma' as const,
      rom_quality: 'completa' as const,
      notes: 'Movimento controlado',
    }

    await persistExerciseFeedback(supabase, feedback)
    await persistExerciseFeedback(supabase, { ...feedback, notes: 'Última versão' })
    await removePersistedSetLog(supabase, 'stable-set-id')
    await removePersistedSetLog(supabase, 'stable-set-id')

    expect(getPendingSyncCount()).toBe(2)
  })
})
