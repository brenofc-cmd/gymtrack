'use client'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { saveExerciseFeedback, saveSetLog } from '@/lib/queries/sessions'
import type { AttemptResult } from '@/lib/training/dup-progression'

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
  set_role: 'warmup' | 'top' | 'backoff' | 'standard' | 'rm_effort' | 'deload'
  attempt_result?: AttemptResult | null
  is_deload?: boolean
  execution_quality: 'boa' | 'aceitavel' | 'ruim' | null
  pain_level: 'nenhuma' | 'leve' | 'moderada' | 'forte' | null
  rom_quality: 'completa' | 'adequada' | 'reduzida' | null
  performed_exercise_id: string | null
  completed_at: string
}

export type SyncState = 'offline' | 'syncing' | 'synced' | 'error'

export type FeedbackPayload = {
  sessionId: string
  workoutExerciseId: string
  execution_quality: 'boa' | 'aceitavel' | 'ruim' | null
  pain_level: 'nenhuma' | 'leve' | 'moderada' | 'forte' | null
  rom_quality: 'completa' | 'adequada' | 'reduzida' | null
  notes: string
}

const QUEUE_KEY = 'gymtrack-pending-set-logs-v1'
const FEEDBACK_QUEUE_KEY = 'gymtrack-pending-exercise-feedback-v1'
const DELETE_QUEUE_KEY = 'gymtrack-pending-set-deletions-v1'
const EVENT_NAME = 'gymtrack:sync-state'

function readStorageQueue<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? '[]')
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function readQueue(): SetLogPayload[] {
  return readStorageQueue<SetLogPayload>(QUEUE_KEY)
}

function readFeedbackQueue(): FeedbackPayload[] {
  return readStorageQueue<FeedbackPayload>(FEEDBACK_QUEUE_KEY)
}

function writeStorageQueue<T>(key: string, items: T[]) {
  window.localStorage.setItem(key, JSON.stringify(items))
}

export function getPendingSyncCount(): number {
  return readQueue().length + readFeedbackQueue().length + readStorageQueue<string>(DELETE_QUEUE_KEY).length
}

export function emitSyncState(state: SyncState, pending = getPendingSyncCount()) {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { state, pending } }))
}

function enqueueSet(payload: SetLogPayload) {
  const queue = readQueue().filter((item) => item.id !== payload.id)
  queue.push(payload)
  writeStorageQueue(QUEUE_KEY, queue)
  emitSyncState(navigator.onLine ? 'error' : 'offline')
}

function enqueueFeedback(payload: FeedbackPayload) {
  const queue = readFeedbackQueue().filter(
    (item) =>
      item.sessionId !== payload.sessionId ||
      item.workoutExerciseId !== payload.workoutExerciseId
  )
  queue.push(payload)
  writeStorageQueue(FEEDBACK_QUEUE_KEY, queue)
  emitSyncState(navigator.onLine ? 'error' : 'offline')
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
    attempt_result: payload.attempt_result ?? null,
    is_deload: payload.is_deload ?? false,
    execution_quality: payload.execution_quality,
    pain_level: payload.pain_level,
    rom_quality: payload.rom_quality,
    performed_exercise_id: payload.performed_exercise_id,
    completed_at: payload.completed_at,
  })
}

export async function persistSetLog(supabase: SupabaseDB, payload: SetLogPayload) {
  if (!navigator.onLine) {
    enqueueSet(payload)
    return { queued: true }
  }

  emitSyncState('syncing')
  try {
    await send(supabase, payload)
    emitSyncState('synced')
    return { queued: false }
  } catch (error) {
    enqueueSet(payload)
    return { queued: true, error }
  }
}

export async function persistExerciseFeedback(
  supabase: SupabaseDB,
  payload: FeedbackPayload
) {
  if (!navigator.onLine) {
    enqueueFeedback(payload)
    return { queued: true }
  }

  emitSyncState('syncing')
  try {
    await saveExerciseFeedback(
      supabase,
      payload.sessionId,
      payload.workoutExerciseId,
      payload
    )
    emitSyncState('synced')
    return { queued: false }
  } catch (error) {
    enqueueFeedback(payload)
    return { queued: true, error }
  }
}

export async function removePersistedSetLog(supabase: SupabaseDB, id: string) {
  const pendingDeletes = Array.from(
    new Set([...readStorageQueue<string>(DELETE_QUEUE_KEY), id])
  )
  if (!navigator.onLine) {
    writeStorageQueue(DELETE_QUEUE_KEY, pendingDeletes)
    emitSyncState('offline')
    return { queued: true }
  }

  emitSyncState('syncing')
  const { error } = await supabase.from('set_logs').delete().eq('id', id)
  if (error) {
    writeStorageQueue(DELETE_QUEUE_KEY, pendingDeletes)
    emitSyncState('error')
    return { queued: true, error }
  }
  emitSyncState('synced')
  return { queued: false }
}

export async function flushSyncQueue(supabase: SupabaseDB) {
  const queue = readQueue()
  const feedbackQueue = readFeedbackQueue()
  const deleteQueue = readStorageQueue<string>(DELETE_QUEUE_KEY)
  if (queue.length === 0 && feedbackQueue.length === 0 && deleteQueue.length === 0) {
    emitSyncState('synced', 0)
    return
  }
  if (!navigator.onLine) {
    emitSyncState('offline')
    return
  }

  emitSyncState('syncing', queue.length + feedbackQueue.length + deleteQueue.length)
  const remaining: SetLogPayload[] = []
  for (const item of queue) {
    try {
      await send(supabase, item)
    } catch {
      remaining.push(item)
    }
  }
  writeStorageQueue(QUEUE_KEY, remaining)

  const remainingDeletes: string[] = []
  for (const id of deleteQueue) {
    const { error } = await supabase.from('set_logs').delete().eq('id', id)
    if (error) remainingDeletes.push(id)
  }
  writeStorageQueue(DELETE_QUEUE_KEY, remainingDeletes)

  const remainingFeedback: FeedbackPayload[] = []
  for (const item of feedbackQueue) {
    try {
      await saveExerciseFeedback(
        supabase,
        item.sessionId,
        item.workoutExerciseId,
        item
      )
    } catch {
      remainingFeedback.push(item)
    }
  }
  writeStorageQueue(FEEDBACK_QUEUE_KEY, remainingFeedback)
  const pending = remaining.length + remainingFeedback.length + remainingDeletes.length
  emitSyncState(pending === 0 ? 'synced' : 'error', pending)
}

export const SYNC_STATE_EVENT = EVENT_NAME
