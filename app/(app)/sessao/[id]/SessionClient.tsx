'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SessionHeader } from '@/components/session/SessionHeader'
import { ExerciseCard } from '@/components/session/ExerciseCard'
import { RestTimerBar } from '@/components/session/RestTimerBar'
import { FinishSessionModal } from '@/components/session/FinishSessionModal'
import { useSessionStore } from '@/lib/store/sessionStore'
import type { ProgressionSuggestion } from '@/lib/progression/progression'
import type { SessionWithLogs } from '@/lib/queries/sessions'
import type { WorkoutWithExercises, WorkoutExerciseWithExercise } from '@/types/database'

interface SessionClientProps {
  session: SessionWithLogs
  workout: WorkoutWithExercises
  lastLogs: Array<{ weight_kg: number | null; reps: number; rir: number | null } | null>
  prWeights: Array<number | null>
  progressions: Array<ProgressionSuggestion | null>
}

function shortName(name: string): string {
  const words = name.split(' ')
  if (words.length <= 2 || name.length <= 20) return name
  return words.slice(0, 2).join(' ')
}

export function SessionClient({
  session,
  workout,
  lastLogs,
  prWeights,
  progressions,
}: SessionClientProps) {
  const { sessionId, startSession, sets, setCurrentExerciseIndex } = useSessionStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [finishModalOpen, setFinishModalOpen] = useState(false)
  const exercises = workout.workout_exercises

  // Índice do primeiro exercício composto (recebe o plano de aquecimento)
  const firstCompoundIndex = exercises.findIndex(
    (we) => we.exercise.exercise_type === 'composto'
  )

  useEffect(() => {
    if (sessionId !== session.id) {
      startSession(session.id, session.workout_id)
    }
  }, [session.id, session.workout_id, sessionId, startSession])

  const go = useCallback(
    (index: number) => {
      if (index < 0 || index >= exercises.length) return
      setCurrentIndex(index)
      setCurrentExerciseIndex(index)
    },
    [exercises.length, setCurrentExerciseIndex]
  )

  const handleAllSetsComplete = useCallback(
    (index: number) => {
      go(index + 1)
    },
    [go]
  )

  const we = exercises[currentIndex]

  return (
    <div className="flex flex-col min-h-screen">
      <SessionHeader
        startedAt={session.started_at}
        workoutName={workout.name}
        workoutLetter={workout.letter ?? ''}
        onFinish={() => setFinishModalOpen(true)}
      />

      {/* Objetivo do treino */}
      {workout.objective && (
        <p className="px-4 pt-2 text-xs text-muted-foreground max-w-lg mx-auto w-full">
          {workout.objective}
        </p>
      )}

      {/* Queue — pill scroll horizontal */}
      <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-2 px-4 py-3 w-max">
          {exercises.map((ex: WorkoutExerciseWithExercise, i: number) => {
            const validSets = (sets[ex.id] ?? []).filter((s) => !s.is_warmup)
            const done = validSets.length >= ex.target_sets
            const isCurrent = i === currentIndex
            return (
              <button
                key={ex.id}
                onClick={() => go(i)}
                className={cn(
                  'flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border transition-colors shrink-0',
                  isCurrent
                    ? 'bg-primary text-primary-foreground border-primary'
                    : done
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-transparent text-muted-foreground border-border'
                )}
              >
                <span className="font-mono tabular-nums text-[10px] opacity-70">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {done && !isCurrent && <Check className="w-3 h-3 shrink-0" />}
                <span className="max-w-[88px] truncate">{shortName(ex.exercise.name_pt)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Exercício em foco */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 pt-2 pb-36">
        <ExerciseCard
          key={we.id}
          sessionId={session.id}
          workoutExercise={we}
          isOpen={true}
          onToggle={() => {}}
          lastWeight={lastLogs[currentIndex]?.weight_kg ?? null}
          lastReps={lastLogs[currentIndex]?.reps ?? null}
          lastRir={lastLogs[currentIndex]?.rir ?? null}
          prWeight={prWeights[currentIndex] ?? null}
          progression={progressions[currentIndex] ?? null}
          showWarmupPlan={currentIndex === firstCompoundIndex}
          onAllSetsComplete={() => handleAllSetsComplete(currentIndex)}
        />

        {/* Navegação prev / next */}
        <div className="flex items-center justify-between mt-4 px-1">
          <button
            onClick={() => go(currentIndex - 1)}
            disabled={currentIndex === 0}
            className={cn(
              'flex items-center gap-1.5 h-10 px-4 rounded-xl border text-sm font-medium transition-colors',
              currentIndex === 0
                ? 'border-border text-muted-foreground/30 cursor-not-allowed'
                : 'border-border text-foreground hover:bg-zinc-800 active:scale-[0.97]'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {currentIndex + 1} / {exercises.length}
          </span>

          <button
            onClick={() => go(currentIndex + 1)}
            disabled={currentIndex === exercises.length - 1}
            className={cn(
              'flex items-center gap-1.5 h-10 px-4 rounded-xl border text-sm font-medium transition-colors',
              currentIndex === exercises.length - 1
                ? 'border-border text-muted-foreground/30 cursor-not-allowed'
                : 'border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 active:scale-[0.97]'
            )}
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
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
