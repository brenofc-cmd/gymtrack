'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SessionHeader } from '@/components/session/SessionHeader'
import { ExerciseCard } from '@/components/session/ExerciseCard'
import { RestTimerBar } from '@/components/session/RestTimerBar'
import { FinishSessionModal } from '@/components/session/FinishSessionModal'
import { useSessionStore } from '@/lib/store/sessionStore'
import type { ProgressionSuggestion } from '@/lib/progression/progression'
import type { SessionWithLogs } from '@/lib/queries/sessions'
import type { WorkoutWithExercises } from '@/types/database'
import { readinessGuidance, type ReadinessStatus } from '@/lib/training/readiness'

interface SessionClientProps {
  session: SessionWithLogs
  workout: WorkoutWithExercises
  lastLogs: Array<{ weight_kg: number | null; reps: number; rir: number | null } | null>
  prWeights: Array<number | null>
  progressions: Array<ProgressionSuggestion | null>
  exerciseHistories: Array<Array<{ date: string; maxWeight: number; totalVolume: number; maxReps: number }>>
  readinessStatus: ReadinessStatus
}

export function SessionClient({
  session,
  workout,
  lastLogs,
  prWeights,
  progressions,
  exerciseHistories,
  readinessStatus,
}: SessionClientProps) {
  const { sessionId, startSession, sets, setCurrentExerciseIndex } = useSessionStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [finishModalOpen, setFinishModalOpen] = useState(false)
  const exercises = workout.workout_exercises
  const firstCompoundIndex = exercises.findIndex(
    (exercise) => exercise.exercise.exercise_type === 'composto'
  )

  useEffect(() => {
    if (sessionId !== session.id) startSession(session.id, session.workout_id)
  }, [session.id, session.workout_id, sessionId, startSession])

  const go = useCallback(
    (index: number) => {
      if (index < 0 || index >= exercises.length) return
      setCurrentIndex(index)
      setCurrentExerciseIndex(index)
    },
    [exercises.length, setCurrentExerciseIndex]
  )

  const completedSetCount = exercises.reduce(
    (total, exercise) => total + (sets[exercise.id] ?? []).filter((set) => !set.is_warmup).length,
    0
  )
  const totalSetCount = exercises.reduce((total, exercise) => total + exercise.target_sets, 0)
  const current = exercises[currentIndex]
  const readinessMessage = readinessGuidance(readinessStatus)

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SessionHeader
        startedAt={session.started_at}
        workoutName={workout.name}
        workoutLetter={workout.letter ?? ''}
        completedSets={completedSetCount}
        totalSets={totalSetCount}
        onFinish={() => setFinishModalOpen(true)}
      />

      <div className="mx-auto flex w-full max-w-lg gap-1.5 px-4 pt-3">
        {exercises.map((exercise, index) => {
          const validSets = (sets[exercise.id] ?? []).filter((set) => !set.is_warmup)
          const done = validSets.length >= exercise.target_sets
          const active = index === currentIndex
          return (
            <button
              key={exercise.id}
              type="button"
              onClick={() => go(index)}
              aria-label={`Abrir exercício ${index + 1}: ${exercise.exercise.name_pt}`}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'h-5 flex-1 rounded-full border-4 border-background transition-colors',
                active ? 'bg-primary' : done ? 'bg-primary/40' : 'bg-secondary'
              )}
            >
              <span className="sr-only">{done ? 'Concluído' : 'Pendente'}</span>
            </button>
          )
        })}
      </div>

      {workout.objective && (
        <p className="mx-auto w-full max-w-lg px-4 pt-2 text-center text-[10.5px] leading-relaxed text-muted-foreground">
          {workout.objective}
        </p>
      )}

      {readinessMessage && (
        <div className="mx-auto mt-2 w-[calc(100%-2rem)] max-w-lg rounded-xl border border-[#ffb547]/30 bg-[#ffb547]/10 px-3 py-2 text-xs leading-relaxed text-[#ffcf7a]">
          {readinessMessage}
        </div>
      )}

      <div className="mx-auto w-full max-w-lg flex-1 px-4 pb-40 pt-3">
        <ExerciseCard
          key={current.id}
          sessionId={session.id}
          workoutExercise={current}
          isOpen
          onToggle={() => {}}
          lastWeight={lastLogs[currentIndex]?.weight_kg ?? null}
          lastReps={lastLogs[currentIndex]?.reps ?? null}
          lastRir={lastLogs[currentIndex]?.rir ?? null}
          prWeight={prWeights[currentIndex] ?? null}
          progression={progressions[currentIndex] ?? null}
          history={exerciseHistories[currentIndex] ?? []}
          showWarmupPlan={currentIndex === firstCompoundIndex}
          onAllSetsComplete={() => go(currentIndex + 1)}
        />

        <div className="mt-4 flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => go(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-input px-4 text-sm font-medium text-muted-foreground disabled:opacity-25"
          >
            <ChevronLeft className="size-4" /> Anterior
          </button>
          <span className="font-mono text-xs text-muted-foreground">{currentIndex + 1} / {exercises.length}</span>
          <button
            type="button"
            onClick={() => go(currentIndex + 1)}
            disabled={currentIndex === exercises.length - 1}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-4 text-sm font-medium text-primary disabled:border-input disabled:bg-transparent disabled:text-muted-foreground disabled:opacity-25"
          >
            Próximo <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <RestTimerBar />
      <FinishSessionModal
        open={finishModalOpen}
        onClose={() => setFinishModalOpen(false)}
        sessionId={session.id}
        startedAt={session.started_at}
        workoutExercises={exercises}
      />
    </div>
  )
}
