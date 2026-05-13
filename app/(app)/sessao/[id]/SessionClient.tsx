'use client'

import { useState, useEffect, useCallback } from 'react'
import { SessionHeader } from '@/components/session/SessionHeader'
import { ExerciseCard } from '@/components/session/ExerciseCard'
import { RestTimerBar } from '@/components/session/RestTimerBar'
import { FinishSessionModal } from '@/components/session/FinishSessionModal'
import { useSessionStore } from '@/lib/store/sessionStore'
import type { SessionWithLogs } from '@/lib/queries/sessions'
import type { WorkoutWithExercises, WorkoutExerciseWithExercise } from '@/lib/queries/workouts'

interface SessionClientProps {
  session: SessionWithLogs
  workout: WorkoutWithExercises
  lastLogs: Array<{ weight_kg: number | null; reps: number } | null>
  prWeights: Array<number | null>
}

export function SessionClient({ session, workout, lastLogs, prWeights }: SessionClientProps) {
  const { sessionId, startSession, setCurrentExerciseIndex } = useSessionStore()
  const [openExerciseIndex, setOpenExerciseIndex] = useState(0)
  const [finishModalOpen, setFinishModalOpen] = useState(false)

  useEffect(() => {
    if (sessionId !== session.id) {
      startSession(session.id, session.workout_id)
    }
  }, [session.id, session.workout_id, sessionId, startSession])

  const handleAllSetsComplete = useCallback(
    (index: number) => {
      const nextIndex = index + 1
      if (nextIndex < workout.workout_exercises.length) {
        setCurrentExerciseIndex(nextIndex)
        setOpenExerciseIndex(nextIndex)
      }
    },
    [workout.workout_exercises.length, setCurrentExerciseIndex]
  )

  function toggleExercise(index: number) {
    setOpenExerciseIndex((prev) => (prev === index ? -1 : index))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SessionHeader
        startedAt={session.started_at}
        workoutName={workout.name}
        workoutLetter={workout.letter}
        onFinish={() => setFinishModalOpen(true)}
      />

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-32 space-y-2">
        {workout.workout_exercises.map((we: WorkoutExerciseWithExercise, i: number) => (
          <ExerciseCard
            key={we.id}
            sessionId={session.id}
            workoutExercise={we}
            isOpen={openExerciseIndex === i}
            onToggle={() => toggleExercise(i)}
            lastWeight={lastLogs[i]?.weight_kg ?? null}
            lastReps={lastLogs[i]?.reps ?? null}
            prWeight={prWeights[i] ?? null}
            onAllSetsComplete={() => handleAllSetsComplete(i)}
          />
        ))}
      </div>

      <RestTimerBar />

      <FinishSessionModal
        open={finishModalOpen}
        onClose={() => setFinishModalOpen(false)}
        sessionId={session.id}
        startedAt={session.started_at}
        workoutExercises={workout.workout_exercises}
      />
    </div>
  )
}
