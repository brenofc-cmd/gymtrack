'use client'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { saveSetLog } from '@/lib/queries/sessions'

type SupabaseDB = SupabaseClient<Database>

export type SetLogPayload = {
  id: string
  sessionId: string
  workoutExerciseId: string
  set_number: number
  weight_kg: number | null
  reps: number
  rir: number | null
  is_warmup: boolean
  set_role: 'warmup' | 'top' | 'backoff' | 'standard'
  execution_quality: 'boa' | 'aceitavel' | 'ruim' | null
  pain_level: 'nenhuma' | 'leve' | 'moderada' | 'forte' | null
  rom_quality: 'completa' | 'adequada' | 'reduzida' | null
  performed_exercise_id: string | null
  completed_at: string
}

export type SyncState = 'offline' | 'syncing' | 'synced' | 'error'

const QUEUE_KEY = 'gymtrack-pending-set-logs-v1'
const EVENT_NAME = 'gymtrack:sync-state'

function readQueue(): SetLogPayload[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUEUE_KEY) ?? '[]')
    return Array.isArray(parsed) ? (parsed as SetLogPayload[]) : []
  } catch {
    return []
  }
}

function writeQueue(items: SetLogPayload[]) {
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items))
}

export function emitSyncState(state: SyncState, pending = readQueue().length) {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { state, pending } }))
}

function enqueue(payload: SetLogPayload) {
  const queue = readQueue().filter((item) => item.id !== payload.id)
  queue.push(payload)
  writeQueue(queue)
  emitSyncState(navigator.onLine ? 'error' : 'offline', queue.length)
}

async function send(supabase: SupabaseDB, payload: SetLogPayload) {
  await saveSetLog(supabase, payload.sessionId, payload.workoutExerciseId, {
    id: payload.id,
    set_number: payload.set_number,
    weight_kg: payload.weight_kg,
    reps: payload.reps,
    rir: payload.rir,
    is_warmup: payload.is_warmup,
    set_role: payload.set_role,
    execution_quality: payload.execution_quality,
    pain_level: payload.pain_level,
    rom_quality: payload.rom_quality,
    performed_exercise_id: payload.performed_exercise_id,
    completed_at: payload.completed_at,
  })
}

export async function persistSetLog(supabase: SupabaseDB, payload: SetLogPayload) {
  if (!navigator.onLine) {
    enqueue(payload)
    return { queued: true }
  }

  emitSyncState('syncing')
  try {
    await send(supabase, payload)
    emitSyncState('synced')
    return { queued: false }
  } catch (error) {
    enqueue(payload)
    throw error
  }
}

export async function flushSyncQueue(supabase: SupabaseDB) {
  const queue = readQueue()
  if (queue.length === 0) {
    emitSyncState('synced', 0)
    return
  }
  if (!navigator.onLine) {
    emitSyncState('offline', queue.length)
    return
  }

  emitSyncState('syncing', queue.length)
  const remaining: SetLogPayload[] = []
  for (const item of queue) {
    try {
      await send(supabase, item)
    } catch {
      remaining.push(item)
    }
  }
  writeQueue(remaining)
  emitSyncState(remaining.length === 0 ? 'synced' : 'error', remaining.length)
}

export const SYNC_STATE_EVENT = EVENT_NAME
