'use client'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, TablesInsert } from '@/types/database'

type SupabaseDB = SupabaseClient<Database>

export type CoreSyncOperation =
  | { key: string; table: 'daily_core_sessions'; payload: TablesInsert<'daily_core_sessions'> }
  | { key: string; table: 'daily_core_sets'; payload: TablesInsert<'daily_core_sets'> }
  | { key: string; table: 'daily_core_pain_logs'; payload: TablesInsert<'daily_core_pain_logs'> }
  | { key: string; table: 'daily_core_progressions'; payload: TablesInsert<'daily_core_progressions'> }

export type CoreSyncState = 'offline' | 'syncing' | 'synced' | 'error'

const QUEUE_KEY = 'gymtrack-daily-core-sync-v1'
export const CORE_SYNC_EVENT = 'gymtrack:daily-core-sync'

function readQueue(): CoreSyncOperation[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
    return Array.isArray(parsed) ? (parsed as CoreSyncOperation[]) : []
  } catch {
    return []
  }
}

function writeQueue(queue: CoreSyncOperation[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

function emit(state: CoreSyncState, pending = readQueue().length) {
  window.dispatchEvent(new CustomEvent(CORE_SYNC_EVENT, { detail: { state, pending } }))
}

function enqueue(operation: CoreSyncOperation) {
  const queue = readQueue().filter((item) => item.key !== operation.key)
  queue.push(operation)
  writeQueue(queue)
  emit(navigator.onLine ? 'error' : 'offline', queue.length)
}

async function send(supabase: SupabaseDB, operation: CoreSyncOperation) {
  let error: { message: string } | null = null
  if (operation.table === 'daily_core_sessions') {
    ;({ error } = await supabase.from('daily_core_sessions').upsert(operation.payload, { onConflict: 'id' }))
  } else if (operation.table === 'daily_core_sets') {
    ;({ error } = await supabase.from('daily_core_sets').upsert(operation.payload, { onConflict: 'id' }))
  } else if (operation.table === 'daily_core_pain_logs') {
    ;({ error } = await supabase.from('daily_core_pain_logs').upsert(operation.payload, { onConflict: 'id' }))
  } else {
    ;({ error } = await supabase.from('daily_core_progressions').upsert(operation.payload, { onConflict: 'user_id,exercise_id' }))
  }
  if (error) throw new Error(error.message)
}

export async function persistCoreOperation(supabase: SupabaseDB, operation: CoreSyncOperation) {
  if (!navigator.onLine) {
    enqueue(operation)
    return { queued: true }
  }
  emit('syncing')
  try {
    await send(supabase, operation)
    emit('synced', readQueue().length)
    return { queued: false }
  } catch (error) {
    enqueue(operation)
    throw error
  }
}

export async function flushCoreSyncQueue(supabase: SupabaseDB) {
  const queue = readQueue()
  if (!navigator.onLine) {
    emit('offline', queue.length)
    return
  }
  emit('syncing', queue.length)
  const remaining: CoreSyncOperation[] = []
  for (const operation of queue) {
    try {
      await send(supabase, operation)
    } catch {
      remaining.push(operation)
    }
  }
  writeQueue(remaining)
  emit(remaining.length ? 'error' : 'synced', remaining.length)
}
