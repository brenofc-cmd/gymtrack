// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  sessionElapsed,
  timerRemaining,
  useSessionStore,
  type ExerciseFeedback,
  type LocalSetLog,
} from '@/lib/store/sessionStore'

const FEEDBACK: ExerciseFeedback = {
  executionQuality: null,
  painLevel: null,
  romQuality: null,
  notes: '',
}

function log(overrides: Partial<LocalSetLog> = {}): LocalSetLog {
  return {
    set_number: 1,
    weight_kg: 30,
    reps: 10,
    rir: 2,
    is_warmup: false,
    set_role: 'standard',
    completed_at: '2026-07-14T12:00:00.000Z',
    ...overrides,
  }
}

describe('Restauração e edição da sessão ativa', () => {
  beforeEach(() => {
    useSessionStore.getState().resetSession()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('mescla Supabase e rascunho local sem duplicar a mesma série', () => {
    const store = useSessionStore.getState()
    store.startSession('session-1', 'workout-1', '2026-07-14T11:00:00.000Z')
    store.upsertSet('exercise-1', log({ reps: 11 }))

    store.hydrateSession(
      'session-1',
      'workout-1',
      '2026-07-14T11:00:00.000Z',
      { 'exercise-1': [log({ id: 'server-id', reps: 10 })] },
      { 'exercise-1': FEEDBACK },
      { 'exercise-1': null }
    )

    const restored = useSessionStore.getState().sets['exercise-1']
    expect(restored).toHaveLength(1)
    expect(restored[0]).toMatchObject({ id: 'server-id', reps: 11 })
  })

  it('upsert edita uma série concluída em vez de criar duplicidade', () => {
    const store = useSessionStore.getState()
    store.startSession('session-1', 'workout-1')
    store.upsertSet('exercise-1', log({ id: 'set-1' }))
    store.upsertSet('exercise-1', log({ id: 'set-1', weight_kg: 32.5, reps: 9 }))
    expect(useSessionStore.getState().sets['exercise-1']).toEqual([
      expect.objectContaining({ id: 'set-1', weight_kg: 32.5, reps: 9 }),
    ])
  })

  it('restaura exercício atual, ignorados e timer por timestamp', () => {
    const now = new Date('2026-07-14T12:00:00.000Z')
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const store = useSessionStore.getState()
    store.startSession('session-1', 'workout-1')
    store.setCurrentExercise('exercise-3', 2)
    store.setExerciseSkipped('exercise-2', true)
    store.startRestTimer(90, 'exercise-1')

    const state = useSessionStore.getState()
    const originalEndsAt = state.restTimer.endsAt
    expect(state.currentExerciseId).toBe('exercise-3')
    expect(state.skippedExerciseIds).toEqual(['exercise-2'])
    expect(timerRemaining(state.restTimer, now.getTime() + 35_000)).toBe(55)

    store.hydrateSession(
      'session-1',
      'workout-1',
      now.toISOString(),
      {},
      {},
      {}
    )
    expect(useSessionStore.getState().restTimer.endsAt).toBe(originalEndsAt)
    expect(JSON.parse(sessionStorage.getItem('gymtrack-session') ?? '{}').state.restTimer.endsAt).toBe(originalEndsAt)
  })

  it('pausa a duração sem contar o intervalo parado', () => {
    const start = '2026-07-14T12:00:00.000Z'
    expect(sessionElapsed(start, { pausedAt: null, pausedSeconds: 30 }, new Date('2026-07-14T12:10:00.000Z').getTime())).toBe(570)
    expect(sessionElapsed(start, { pausedAt: new Date('2026-07-14T12:05:00.000Z').getTime(), pausedSeconds: 0 }, new Date('2026-07-14T12:10:00.000Z').getTime())).toBe(300)
  })
})
