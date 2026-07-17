'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { DailyCoreExecutionQuality, DailyCorePainLevel, DailyCoreSessionType } from '@/types/database'

export interface CoreLocalSet {
  id: string
  exerciseId: string
  variationId: string | null
  setNumber: number
  reps: number | null
  durationSeconds: number | null
  weightKg: number | null
  rir: number | null
  executionQuality: DailyCoreExecutionQuality | null
  painLevel: DailyCorePainLevel | null
  lumbarControlled: boolean | null
  completedAt: string
}

export interface CoreTimer {
  endsAt: number | null
  pausedRemaining: number | null
  totalSeconds: number
}

export interface ActiveCoreSession {
  id: string
  userId: string
  sessionDate: string
  dayOfWeek: number
  sessionType: DailyCoreSessionType
  adaptationWeek: number
  startedAt: string
}

interface DailyCoreStore {
  session: ActiveCoreSession | null
  currentExerciseIndex: number
  sets: Record<string, CoreLocalSet[]>
  selectedVariations: Record<string, string | null>
  executionTimer: CoreTimer
  restTimer: CoreTimer
  startSession: (session: ActiveCoreSession) => void
  setCurrentExerciseIndex: (index: number) => void
  selectVariation: (exerciseId: string, variationId: string | null) => void
  logSet: (setLog: CoreLocalSet) => void
  removeLastSet: (exerciseId: string) => void
  startExecutionTimer: (seconds: number) => void
  pauseExecutionTimer: () => void
  resumeExecutionTimer: () => void
  restartExecutionTimer: () => void
  addExecutionSeconds: (seconds: number) => void
  stopExecutionTimer: () => void
  startRestTimer: (seconds: number) => void
  pauseRestTimer: () => void
  resumeRestTimer: () => void
  restartRestTimer: () => void
  addRestSeconds: (seconds: number) => void
  stopRestTimer: () => void
  reset: () => void
}

const EMPTY_TIMER: CoreTimer = { endsAt: null, pausedRemaining: null, totalSeconds: 0 }

export function coreTimerRemaining(timer: CoreTimer, now = Date.now()): number {
  if (timer.pausedRemaining != null) return Math.max(0, Math.ceil(timer.pausedRemaining))
  if (timer.endsAt == null) return 0
  return Math.max(0, Math.ceil((timer.endsAt - now) / 1000))
}

function startTimer(seconds: number): CoreTimer {
  return { endsAt: Date.now() + seconds * 1000, pausedRemaining: null, totalSeconds: seconds }
}

function pauseTimer(timer: CoreTimer): CoreTimer {
  if (timer.endsAt == null) return timer
  return { ...timer, endsAt: null, pausedRemaining: coreTimerRemaining(timer) }
}

function resumeTimer(timer: CoreTimer): CoreTimer {
  if (timer.pausedRemaining == null) return timer
  return { ...timer, endsAt: Date.now() + timer.pausedRemaining * 1000, pausedRemaining: null }
}

function restartTimer(timer: CoreTimer): CoreTimer {
  return timer.totalSeconds > 0 ? startTimer(timer.totalSeconds) : timer
}

function addTimerSeconds(timer: CoreTimer, seconds: number): CoreTimer {
  if (timer.pausedRemaining != null) return { ...timer, pausedRemaining: timer.pausedRemaining + seconds, totalSeconds: timer.totalSeconds + seconds }
  if (timer.endsAt != null) return { ...timer, endsAt: timer.endsAt + seconds * 1000, totalSeconds: timer.totalSeconds + seconds }
  return startTimer(Math.max(seconds, timer.totalSeconds))
}

export const useDailyCoreStore = create<DailyCoreStore>()(
  persist(
    (set) => ({
      session: null,
      currentExerciseIndex: 0,
      sets: {},
      selectedVariations: {},
      executionTimer: EMPTY_TIMER,
      restTimer: EMPTY_TIMER,
      startSession: (session) => set({ session, currentExerciseIndex: 0, sets: {}, executionTimer: EMPTY_TIMER, restTimer: EMPTY_TIMER }),
      setCurrentExerciseIndex: (currentExerciseIndex) => set({ currentExerciseIndex }),
      selectVariation: (exerciseId, variationId) => set((state) => ({ selectedVariations: { ...state.selectedVariations, [exerciseId]: variationId } })),
      logSet: (setLog) => set((state) => ({ sets: { ...state.sets, [setLog.exerciseId]: [...(state.sets[setLog.exerciseId] ?? []).filter((item) => item.id !== setLog.id), setLog] } })),
      removeLastSet: (exerciseId) => set((state) => ({ sets: { ...state.sets, [exerciseId]: (state.sets[exerciseId] ?? []).slice(0, -1) } })),
      startExecutionTimer: (seconds) => set({ executionTimer: startTimer(seconds) }),
      pauseExecutionTimer: () => set((state) => ({ executionTimer: pauseTimer(state.executionTimer) })),
      resumeExecutionTimer: () => set((state) => ({ executionTimer: resumeTimer(state.executionTimer) })),
      restartExecutionTimer: () => set((state) => ({ executionTimer: restartTimer(state.executionTimer) })),
      addExecutionSeconds: (seconds) => set((state) => ({ executionTimer: addTimerSeconds(state.executionTimer, seconds) })),
      stopExecutionTimer: () => set({ executionTimer: EMPTY_TIMER }),
      startRestTimer: (seconds) => set({ restTimer: startTimer(seconds) }),
      pauseRestTimer: () => set((state) => ({ restTimer: pauseTimer(state.restTimer) })),
      resumeRestTimer: () => set((state) => ({ restTimer: resumeTimer(state.restTimer) })),
      restartRestTimer: () => set((state) => ({ restTimer: restartTimer(state.restTimer) })),
      addRestSeconds: (seconds) => set((state) => ({ restTimer: addTimerSeconds(state.restTimer, seconds) })),
      stopRestTimer: () => set({ restTimer: EMPTY_TIMER }),
      reset: () => set({ session: null, currentExerciseIndex: 0, sets: {}, selectedVariations: {}, executionTimer: EMPTY_TIMER, restTimer: EMPTY_TIMER }),
    }),
    { name: 'gymtrack-daily-core-v1', storage: createJSONStorage(() => localStorage) }
  )
)
