import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface LocalSetLog {
  set_number: number
  weight_kg: number | null
  reps: number
  completed_at: string
}

interface RestTimer {
  active: boolean
  remaining: number
  total: number
  workoutExerciseId: string | null
}

interface SessionStore {
  sessionId: string | null
  workoutId: string | null
  startedAt: string | null
  sets: Record<string, LocalSetLog[]> // workoutExerciseId → completed sets
  currentExerciseIndex: number
  restTimer: RestTimer

  startSession: (sessionId: string, workoutId: string) => void
  logSet: (workoutExerciseId: string, log: LocalSetLog) => void
  setCurrentExerciseIndex: (index: number) => void
  startRestTimer: (seconds: number, workoutExerciseId: string) => void
  tickTimer: () => void
  adjustTimer: (delta: number) => void
  skipTimer: () => void
  resetSession: () => void
}

const INITIAL_TIMER: RestTimer = {
  active: false,
  remaining: 0,
  total: 0,
  workoutExerciseId: null,
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      sessionId: null,
      workoutId: null,
      startedAt: null,
      sets: {},
      currentExerciseIndex: 0,
      restTimer: INITIAL_TIMER,

      startSession: (sessionId, workoutId) =>
        set({
          sessionId,
          workoutId,
          startedAt: new Date().toISOString(),
          sets: {},
          currentExerciseIndex: 0,
          restTimer: INITIAL_TIMER,
        }),

      logSet: (workoutExerciseId, log) =>
        set((state) => ({
          sets: {
            ...state.sets,
            [workoutExerciseId]: [
              ...(state.sets[workoutExerciseId] ?? []),
              log,
            ],
          },
        })),

      setCurrentExerciseIndex: (index) =>
        set({ currentExerciseIndex: index }),

      startRestTimer: (seconds, workoutExerciseId) =>
        set({
          restTimer: {
            active: true,
            remaining: seconds,
            total: seconds,
            workoutExerciseId,
          },
        }),

      tickTimer: () =>
        set((state) => {
          if (!state.restTimer.active) return state
          const remaining = state.restTimer.remaining - 1
          if (remaining <= 0) {
            return { restTimer: { ...state.restTimer, active: false, remaining: 0 } }
          }
          return { restTimer: { ...state.restTimer, remaining } }
        }),

      adjustTimer: (delta) =>
        set((state) => {
          if (!state.restTimer.active) return state
          const remaining = Math.max(5, state.restTimer.remaining + delta)
          return { restTimer: { ...state.restTimer, remaining } }
        }),

      skipTimer: () =>
        set((state) => ({
          restTimer: { ...state.restTimer, active: false, remaining: 0 },
        })),

      resetSession: () =>
        set({
          sessionId: null,
          workoutId: null,
          startedAt: null,
          sets: {},
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
