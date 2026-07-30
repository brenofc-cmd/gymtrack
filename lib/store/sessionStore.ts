import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ExecutionQuality, PainLevel, RomQuality } from '@/types/database'
import type { AttemptResult } from '@/lib/training/dup-progression'

export interface LocalSetLog {
  /** ID idempotente compartilhado entre rascunho local e Supabase. */
  id?: string
  set_number: number
  weight_kg: number | null
  reps: number
  rir: number | null
  is_warmup: boolean
  set_role?: 'warmup' | 'top' | 'backoff' | 'standard' | 'rm_effort' | 'deload'
  attempt_result?: AttemptResult | null
  is_deload?: boolean
  completed_at: string
}

export interface ExerciseFeedback {
  executionQuality: ExecutionQuality | null
  painLevel: PainLevel | null
  romQuality: RomQuality | null
  notes: string
}

/**
 * Cronômetro baseado em timestamp real (endsAt):
 * - continua correto com a aba minimizada;
 * - sobrevive à atualização da página (persistido);
 * - pausável (pausedRemaining guarda o restante).
 */
export interface RestTimer {
  /** epoch ms em que o descanso termina; null se inativo ou pausado */
  endsAt: number | null
  /** segundos restantes quando pausado; null se não pausado */
  pausedRemaining: number | null
  totalSeconds: number
  workoutExerciseId: string | null
}

export interface SessionClock {
  /** epoch ms em que a sessão foi pausada; null quando está rodando */
  pausedAt: number | null
  /** tempo total já pausado, em segundos */
  pausedSeconds: number
}

interface SessionStore {
  sessionId: string | null
  workoutId: string | null
  startedAt: string | null
  sets: Record<string, LocalSetLog[]> // workoutExerciseId → séries concluídas
  feedback: Record<string, ExerciseFeedback> // workoutExerciseId → execução/dor/observações
  variation: Record<string, string | null> // workoutExerciseId → exercise_id da variação escolhida
  currentExerciseIndex: number
  currentExerciseId: string | null
  skippedExerciseIds: string[]
  sessionClock: SessionClock
  restTimer: RestTimer

  startSession: (sessionId: string, workoutId: string, startedAt?: string) => void
  hydrateSession: (
    sessionId: string,
    workoutId: string,
    startedAt: string,
    sets: Record<string, LocalSetLog[]>,
    feedback: Record<string, ExerciseFeedback>,
    variation: Record<string, string | null>
  ) => void
  upsertSet: (workoutExerciseId: string, log: LocalSetLog) => void
  removeSet: (workoutExerciseId: string, log: Pick<LocalSetLog, 'id' | 'set_number' | 'is_warmup'>) => void
  setFeedback: (workoutExerciseId: string, fb: Partial<ExerciseFeedback>) => void
  setVariation: (workoutExerciseId: string, exerciseId: string | null) => void
  setCurrentExerciseIndex: (index: number) => void
  setCurrentExercise: (workoutExerciseId: string, index: number) => void
  setExerciseSkipped: (workoutExerciseId: string, skipped: boolean) => void
  pauseSessionClock: () => void
  resumeSessionClock: () => void

  startRestTimer: (seconds: number, workoutExerciseId: string) => void
  addRestSeconds: (seconds: number) => void
  pauseRestTimer: () => void
  resumeRestTimer: () => void
  restartRestTimer: () => void
  skipRestTimer: () => void

  resetSession: (sessionId?: string) => void
}

const INITIAL_TIMER: RestTimer = {
  endsAt: null,
  pausedRemaining: null,
  totalSeconds: 0,
  workoutExerciseId: null,
}

const INITIAL_CLOCK: SessionClock = {
  pausedAt: null,
  pausedSeconds: 0,
}

export function timerIsActive(t: RestTimer): boolean {
  return t.endsAt != null || t.pausedRemaining != null
}

export function timerRemaining(t: RestTimer, now: number = Date.now()): number {
  if (t.pausedRemaining != null) return Math.max(0, Math.ceil(t.pausedRemaining))
  if (t.endsAt == null) return 0
  return Math.max(0, Math.ceil((t.endsAt - now) / 1000))
}

export function sessionElapsed(
  startedAt: string,
  clock: SessionClock,
  now: number = Date.now()
): number {
  const start = new Date(startedAt).getTime()
  if (!Number.isFinite(start)) return 0
  const end = clock.pausedAt ?? now
  return Math.max(0, Math.floor((end - start) / 1000) - clock.pausedSeconds)
}

const EMPTY_FEEDBACK: ExerciseFeedback = {
  executionQuality: null,
  painLevel: null,
  romQuality: null,
  notes: '',
}

function setSlot(log: LocalSetLog): string {
  return `${log.is_warmup ? 'warmup' : 'work'}:${log.set_number}`
}

function mergeExerciseSets(
  serverSets: LocalSetLog[],
  localSets: LocalSetLog[]
): LocalSetLog[] {
  const bySlot = new Map<string, LocalSetLog>()
  for (const log of serverSets) bySlot.set(setSlot(log), log)
  // O rascunho local vence para não substituir uma edição offline mais nova.
  for (const log of localSets) {
    const slot = setSlot(log)
    const serverLog = bySlot.get(slot)
    bySlot.set(slot, { ...log, id: log.id ?? serverLog?.id })
  }
  return Array.from(bySlot.values()).sort((a, b) => {
    if (a.is_warmup !== b.is_warmup) return a.is_warmup ? -1 : 1
    return a.set_number - b.set_number
  })
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      sessionId: null,
      workoutId: null,
      startedAt: null,
      sets: {},
      feedback: {},
      variation: {},
      currentExerciseIndex: 0,
      currentExerciseId: null,
      skippedExerciseIds: [],
      sessionClock: INITIAL_CLOCK,
      restTimer: INITIAL_TIMER,

      startSession: (sessionId, workoutId, startedAt) =>
        set({
          sessionId,
          workoutId,
          startedAt: startedAt ?? new Date().toISOString(),
          sets: {},
          feedback: {},
          variation: {},
          currentExerciseIndex: 0,
          currentExerciseId: null,
          skippedExerciseIds: [],
          sessionClock: INITIAL_CLOCK,
          restTimer: INITIAL_TIMER,
        }),

      hydrateSession: (
        sessionId,
        workoutId,
        startedAt,
        serverSets,
        serverFeedback,
        serverVariation
      ) =>
        set((state) => {
          const sameSession = state.sessionId === sessionId
          const exerciseIds = new Set([
            ...Object.keys(serverSets),
            ...(sameSession ? Object.keys(state.sets) : []),
          ])
          const mergedSets: Record<string, LocalSetLog[]> = {}
          for (const exerciseId of exerciseIds) {
            mergedSets[exerciseId] = mergeExerciseSets(
              serverSets[exerciseId] ?? [],
              sameSession ? state.sets[exerciseId] ?? [] : []
            )
          }
          return {
            sessionId,
            workoutId,
            startedAt,
            sets: mergedSets,
            feedback: sameSession
              ? { ...serverFeedback, ...state.feedback }
              : serverFeedback,
            variation: sameSession
              ? { ...serverVariation, ...state.variation }
              : serverVariation,
            currentExerciseIndex: sameSession ? state.currentExerciseIndex : 0,
            currentExerciseId: sameSession ? state.currentExerciseId : null,
            skippedExerciseIds: sameSession ? state.skippedExerciseIds : [],
            sessionClock: sameSession ? state.sessionClock : INITIAL_CLOCK,
            restTimer: sameSession ? state.restTimer : INITIAL_TIMER,
          }
        }),

      upsertSet: (workoutExerciseId, log) =>
        set((state) => ({
          sets: {
            ...state.sets,
            [workoutExerciseId]: mergeExerciseSets(
              [],
              [
                ...(state.sets[workoutExerciseId] ?? []).filter(
                  (existing) => setSlot(existing) !== setSlot(log)
                ),
                log,
              ]
            ),
          },
        })),

      removeSet: (workoutExerciseId, log) =>
        set((state) => ({
          sets: {
            ...state.sets,
            [workoutExerciseId]: (state.sets[workoutExerciseId] ?? []).filter(
              (existing) => existing.id
                ? existing.id !== log.id
                : setSlot(existing) !== setSlot(log as LocalSetLog)
            ),
          },
        })),

      setFeedback: (workoutExerciseId, fb) =>
        set((state) => ({
          feedback: {
            ...state.feedback,
            [workoutExerciseId]: {
              ...(state.feedback[workoutExerciseId] ?? EMPTY_FEEDBACK),
              ...fb,
            },
          },
        })),

      setVariation: (workoutExerciseId, exerciseId) =>
        set((state) => ({
          variation: { ...state.variation, [workoutExerciseId]: exerciseId },
        })),

      setCurrentExerciseIndex: (index) => set({ currentExerciseIndex: index }),
      setCurrentExercise: (workoutExerciseId, index) =>
        set({ currentExerciseId: workoutExerciseId, currentExerciseIndex: index }),

      setExerciseSkipped: (workoutExerciseId, skipped) =>
        set((state) => ({
          skippedExerciseIds: skipped
            ? Array.from(new Set([...state.skippedExerciseIds, workoutExerciseId]))
            : state.skippedExerciseIds.filter((id) => id !== workoutExerciseId),
        })),

      pauseSessionClock: () =>
        set((state) => state.sessionClock.pausedAt == null
          ? { sessionClock: { ...state.sessionClock, pausedAt: Date.now() } }
          : state),

      resumeSessionClock: () =>
        set((state) => {
          const pausedAt = state.sessionClock.pausedAt
          if (pausedAt == null) return state
          return {
            sessionClock: {
              pausedAt: null,
              pausedSeconds:
                state.sessionClock.pausedSeconds +
                Math.max(0, Math.floor((Date.now() - pausedAt) / 1000)),
            },
          }
        }),

      startRestTimer: (seconds, workoutExerciseId) =>
        set({
          restTimer: {
            endsAt: Date.now() + seconds * 1000,
            pausedRemaining: null,
            totalSeconds: seconds,
            workoutExerciseId,
          },
        }),

      addRestSeconds: (seconds) =>
        set((state) => {
          const t = state.restTimer
          if (t.pausedRemaining != null) {
            return {
              restTimer: { ...t, pausedRemaining: Math.max(0, t.pausedRemaining + seconds) },
            }
          }
          if (t.endsAt == null) return state
          return {
            restTimer: {
              ...t,
              endsAt: Math.max(Date.now(), t.endsAt + seconds * 1000),
            },
          }
        }),

      pauseRestTimer: () =>
        set((state) => {
          const t = state.restTimer
          if (t.endsAt == null) return state
          return {
            restTimer: {
              ...t,
              pausedRemaining: timerRemaining(t),
              endsAt: null,
            },
          }
        }),

      resumeRestTimer: () =>
        set((state) => {
          const t = state.restTimer
          if (t.pausedRemaining == null) return state
          return {
            restTimer: {
              ...t,
              endsAt: Date.now() + t.pausedRemaining * 1000,
              pausedRemaining: null,
            },
          }
        }),

      restartRestTimer: () =>
        set((state) => {
          const t = state.restTimer
          if (t.totalSeconds <= 0) return state
          return {
            restTimer: {
              ...t,
              endsAt: Date.now() + t.totalSeconds * 1000,
              pausedRemaining: null,
            },
          }
        }),

      skipRestTimer: () =>
        set((state) => ({
          restTimer: {
            ...state.restTimer,
            endsAt: null,
            pausedRemaining: null,
          },
        })),

      resetSession: (targetSessionId) =>
        set((state) => targetSessionId && state.sessionId !== targetSessionId ? state : ({
          sessionId: null,
          workoutId: null,
          startedAt: null,
          sets: {},
          feedback: {},
          variation: {},
          currentExerciseIndex: 0,
          currentExerciseId: null,
          skippedExerciseIds: [],
          sessionClock: INITIAL_CLOCK,
          restTimer: INITIAL_TIMER,
        })),
    }),
    {
      name: 'gymtrack-session',
      storage: createJSONStorage(() => sessionStorage),
      version: 2,
    }
  )
)
