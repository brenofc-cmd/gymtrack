import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ExecutionQuality, PainLevel } from '@/types/database'

export interface LocalSetLog {
  set_number: number
  weight_kg: number | null
  reps: number
  rir: number | null
  is_warmup: boolean
  completed_at: string
}

export interface ExerciseFeedback {
  executionQuality: ExecutionQuality | null
  painLevel: PainLevel | null
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

interface SessionStore {
  sessionId: string | null
  workoutId: string | null
  startedAt: string | null
  sets: Record<string, LocalSetLog[]> // workoutExerciseId → séries concluídas
  feedback: Record<string, ExerciseFeedback> // workoutExerciseId → execução/dor/observações
  variation: Record<string, string | null> // workoutExerciseId → exercise_id da variação escolhida
  currentExerciseIndex: number
  restTimer: RestTimer

  startSession: (sessionId: string, workoutId: string) => void
  logSet: (workoutExerciseId: string, log: LocalSetLog) => void
  setFeedback: (workoutExerciseId: string, fb: Partial<ExerciseFeedback>) => void
  setVariation: (workoutExerciseId: string, exerciseId: string | null) => void
  setCurrentExerciseIndex: (index: number) => void

  startRestTimer: (seconds: number, workoutExerciseId: string) => void
  addRestSeconds: (seconds: number) => void
  pauseRestTimer: () => void
  resumeRestTimer: () => void
  restartRestTimer: () => void
  skipRestTimer: () => void

  resetSession: () => void
}

const INITIAL_TIMER: RestTimer = {
  endsAt: null,
  pausedRemaining: null,
  totalSeconds: 0,
  workoutExerciseId: null,
}

export function timerIsActive(t: RestTimer): boolean {
  return t.endsAt != null || t.pausedRemaining != null
}

export function timerRemaining(t: RestTimer, now: number = Date.now()): number {
  if (t.pausedRemaining != null) return Math.max(0, Math.ceil(t.pausedRemaining))
  if (t.endsAt == null) return 0
  return Math.max(0, Math.ceil((t.endsAt - now) / 1000))
}

const EMPTY_FEEDBACK: ExerciseFeedback = {
  executionQuality: null,
  painLevel: null,
  notes: '',
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
      restTimer: INITIAL_TIMER,

      startSession: (sessionId, workoutId) =>
        set({
          sessionId,
          workoutId,
          startedAt: new Date().toISOString(),
          sets: {},
          feedback: {},
          variation: {},
          currentExerciseIndex: 0,
          restTimer: INITIAL_TIMER,
        }),

      logSet: (workoutExerciseId, log) =>
        set((state) => ({
          sets: {
            ...state.sets,
            [workoutExerciseId]: [...(state.sets[workoutExerciseId] ?? []), log],
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

      resetSession: () =>
        set({
          sessionId: null,
          workoutId: null,
          startedAt: null,
          sets: {},
          feedback: {},
          variation: {},
          currentExerciseIndex: 0,
          restTimer: INITIAL_TIMER,
        }),
    }),
    {
      name: 'gymtrack-session',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
