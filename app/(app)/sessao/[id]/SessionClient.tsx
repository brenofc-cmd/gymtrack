'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  timerIsActive,
  useSessionStore,
  type ExerciseFeedback,
  type LocalSetLog,
} from '@/lib/store/sessionStore'
import type { ProgressionSuggestion } from '@/lib/progression/progression'
import { cancelSessionLogically, type SessionWithLogs } from '@/lib/queries/sessions'
import type { WorkoutLetter, WorkoutWithExercises } from '@/types/database'
import { readinessGuidance, type ReadinessStatus } from '@/lib/training/readiness'
import { useWakeLock } from '@/lib/hooks/useWakeLock'
import { classifyDay } from '@/components/workout/WorkoutFocusBadge'
import type { LoadRecommendation } from '@/lib/training/dup-progression'
import { ActiveWorkoutHeader } from '@/components/session/ActiveWorkoutHeader'
import {
  CurrentExercisePanel,
  type PreviousExerciseSet,
} from '@/components/session/CurrentExercisePanel'
import { ExerciseNavigator } from '@/components/session/ExerciseNavigator'
import { FinishWorkoutSheet } from '@/components/session/FinishWorkoutSheet'
import { RestTimerDock } from '@/components/session/RestTimerDock'
import { SessionExitSheet } from '@/components/session/SessionExitSheet'
import { WorkoutOverview } from '@/components/session/WorkoutOverview'
import { estimateWorkoutTime } from '@/lib/training/session-time'

interface SessionClientProps {
  session: SessionWithLogs
  workout: WorkoutWithExercises
  previousSets: PreviousExerciseSet[][]
  prWeights: Array<number | null>
  progressions: Array<ProgressionSuggestion | null>
  recommendedLoads: LoadRecommendation[]
  exerciseHistories: Array<Array<{ date: string; maxWeight: number; totalVolume: number; maxReps: number }>>
  readinessStatus: ReadinessStatus
  keepScreenAwake?: boolean
  notificationsEnabled?: boolean
  restTimerSound?: boolean
  restTimerVibrate?: boolean
  /** Fase fundamentos: top set/back-off exibido como séries retas conservadoras */
  straightSetsNotice?: boolean
  blockChoices?: Record<string, string | null>
  isDeload?: boolean
  equipmentProfile?: { barWeightKg: number; smallestPlateKg: number }
}

function normalizeSetRole(value: string): LocalSetLog['set_role'] {
  return value === 'warmup' || value === 'top' || value === 'backoff' || value === 'rm_effort'
    ? value
    : 'standard'
}

export function SessionClient({
  session,
  workout,
  previousSets,
  prWeights,
  progressions,
  recommendedLoads,
  exerciseHistories,
  readinessStatus,
  keepScreenAwake = true,
  notificationsEnabled = true,
  restTimerSound = true,
  restTimerVibrate = true,
  straightSetsNotice = false,
  blockChoices = {},
  isDeload = false,
  equipmentProfile = { barWeightKg: 20, smallestPlateKg: 1.25 },
}: SessionClientProps) {
  useWakeLock(keepScreenAwake)
  const router = useRouter()
  const store = useSessionStore()
  const {
    sessionId,
    currentExerciseIndex,
    currentExerciseId,
    sets,
    feedback,
    skippedExerciseIds,
    restTimer,
    hydrateSession,
    setCurrentExercise,
    setExerciseSkipped,
    pauseSessionClock,
    pauseRestTimer,
    resetSession,
  } = store
  const [orderedExercises, setOrderedExercises] = useState(workout.workout_exercises)
  const [currentIndex, setCurrentIndex] = useState(() =>
    sessionId === session.id && currentExerciseId
      ? Math.max(0, workout.workout_exercises.findIndex((exercise) => exercise.id === currentExerciseId))
      : sessionId === session.id
        ? Math.min(currentExerciseIndex, Math.max(0, workout.workout_exercises.length - 1))
        : 0
  )
  const [exitOpen, setExitOpen] = useState(false)
  const [finishOpen, setFinishOpen] = useState(false)
  const [overviewOpen, setOverviewOpen] = useState(true)

  useEffect(() => {
    const serverSets: Record<string, LocalSetLog[]> = {}
    const serverFeedback: Record<string, ExerciseFeedback> = {}
    const serverVariation: Record<string, string | null> = { ...blockChoices }

    const orderedLogs = [...session.set_logs].sort((a, b) =>
      new Date(a.completed_at ?? 0).getTime() - new Date(b.completed_at ?? 0).getTime()
    )
    for (const log of orderedLogs) {
      const exerciseId = log.workout_exercise_id
      const local: LocalSetLog = {
        id: log.id,
        set_number: log.set_number,
        weight_kg: log.weight_kg,
        reps: log.reps,
        rir: log.rir,
        is_warmup: log.is_warmup,
        set_role: normalizeSetRole(log.set_role),
        attempt_result: (log.attempt_result as LocalSetLog['attempt_result']) ?? null,
        is_deload: log.is_deload,
        external_assistance: log.external_assistance,
        completed_at: log.completed_at ?? session.started_at,
      }
      serverSets[exerciseId] = [...(serverSets[exerciseId] ?? []), local]
      serverFeedback[exerciseId] = {
        executionQuality: log.execution_quality as ExerciseFeedback['executionQuality'],
        painLevel: log.pain_level as ExerciseFeedback['painLevel'],
        romQuality: log.rom_quality as ExerciseFeedback['romQuality'],
        externalAssistance: log.external_assistance,
        notes: log.notes ?? '',
      }
      serverVariation[exerciseId] = log.performed_exercise_id
    }

    hydrateSession(
      session.id,
      session.workout_id,
      session.started_at,
      serverSets,
      serverFeedback,
      serverVariation
    )
  }, [blockChoices, hydrateSession, session.id, session.set_logs, session.started_at, session.workout_id])

  const originalIndexById = useMemo(
    () => new Map(workout.workout_exercises.map((exercise, index) => [exercise.id, index])),
    [workout.workout_exercises]
  )
  const firstCompoundId = workout.workout_exercises.find(
    (exercise) => exercise.exercise.exercise_type === 'composto'
  )?.id

  const go = useCallback((index: number) => {
    if (index < 0 || index >= orderedExercises.length) return
    setCurrentIndex(index)
    setCurrentExercise(orderedExercises[index].id, index)
  }, [orderedExercises, setCurrentExercise])

  const moveCurrent = useCallback((direction: -1 | 1) => {
    const nextIndex = currentIndex + direction
    if (nextIndex < 0 || nextIndex >= orderedExercises.length) return
    setOrderedExercises((items) => {
      const next = [...items]
      ;[next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]]
      return next
    })
    setCurrentIndex(nextIndex)
    setCurrentExercise(orderedExercises[currentIndex].id, nextIndex)
  }, [currentIndex, orderedExercises, setCurrentExercise])

  const completedSetCount = orderedExercises.reduce(
    (total, exercise) => total + (sets[exercise.id] ?? []).filter((set) => !set.is_warmup).length,
    0
  )
  const totalSetCount = orderedExercises.reduce((total, exercise) => total + exercise.target_sets, 0)
  const timeEstimate = useMemo(() => estimateWorkoutTime(
    orderedExercises.map((exercise) => ({
      target_sets: exercise.target_sets,
      rest_seconds: exercise.rest_seconds,
    })),
    workout.letter === 'C' || workout.letter === 'F' ? 8 : 0
  ), [orderedExercises, workout.letter])
  const current = orderedExercises[currentIndex]
  const originalIndex = current ? originalIndexById.get(current.id) ?? 0 : 0
  const readinessMessage = readinessGuidance(readinessStatus)

  useEffect(() => {
    if (current) setCurrentExercise(current.id, currentIndex)
  }, [current, currentIndex, setCurrentExercise])

  if (!current) return null

  async function cancelWorkout() {
    // Cancelamento LÓGICO: nunca delete — o cascade apagaria os set_logs.
    await cancelSessionLogically(createClient(), session, 'Cancelado pelo usuário na sessão')
    resetSession(session.id)
    router.push('/')
    router.refresh()
  }

  function exitWorkout(pause: boolean) {
    if (pause) {
      pauseSessionClock()
      if (timerIsActive(restTimer) && restTimer.pausedRemaining == null) pauseRestTimer()
    }
    router.push('/')
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background">
      <ActiveWorkoutHeader
        startedAt={session.started_at}
        workoutName={workout.name}
        workoutLetter={workout.letter ?? ''}
        classification={classifyDay(
          workout.session_focus,
          workout.workout_exercises.map((we) => ({ exercise_type: we.exercise.exercise_type }))
        )}
        completedSets={completedSetCount}
        totalSets={totalSetCount}
        blockWeekNumber={session.block_week_number}
        onExit={() => setExitOpen(true)}
        onBackToOverview={() => setOverviewOpen(true)}
        overview={overviewOpen}
        onFinish={() => setFinishOpen(true)}
        timeEstimate={timeEstimate}
      />

      {!overviewOpen && <ExerciseNavigator
        exercises={orderedExercises}
        currentIndex={currentIndex}
        completedSets={completedSetCount}
        totalSets={totalSetCount}
        sets={sets}
        feedback={feedback}
        skippedExerciseIds={skippedExerciseIds}
        onGo={go}
      />}

      {overviewOpen ? (
        <WorkoutOverview
          exercises={orderedExercises}
          sets={sets}
          skippedExerciseIds={skippedExerciseIds}
          workoutLetter={(workout.letter ?? 'A') as WorkoutLetter}
          routineVersion={workout.routine_version}
          onOpenExercise={(index) => {
            go(index)
            setOverviewOpen(false)
          }}
        />
      ) : <main className="mx-auto w-full max-w-[430px] px-3 pb-48 pt-2 sm:px-4 sm:pt-3">
        {readinessMessage && (
          <div className="mb-2 flex gap-2 rounded-xl bg-[#ffb547]/10 px-3 py-2 text-[11px] leading-relaxed text-[#ffcf7a]">
            <Activity className="mt-0.5 size-4 shrink-0" />
            {readinessMessage}
          </div>
        )}
        {straightSetsNotice && (
          <p className="mb-2 rounded-xl bg-secondary/60 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            Fase Fundamentos: séries retas conservadoras e RIR um pouco maior, para
            priorizar execução e consistência. Você pode avançar de fase no Perfil
            quando cumprir os critérios.
          </p>
        )}

        <CurrentExercisePanel
          key={current.id}
          sessionId={session.id}
          workoutExercise={current}
          exerciseNumber={currentIndex + 1}
          totalExercises={orderedExercises.length}
          previousSets={previousSets[originalIndex] ?? []}
          bestWeight={prWeights[originalIndex] ?? null}
          progression={progressions[originalIndex] ?? null}
          recommendedLoad={recommendedLoads[originalIndex] ?? null}
          userId={session.user_id}
          programBlockId={session.program_block_id}
          isDeload={isDeload}
          equipmentProfile={equipmentProfile}
          history={exerciseHistories[originalIndex] ?? []}
          showWarmupPlan={current.id === firstCompoundId}
          canMoveEarlier={currentIndex > 0}
          canMoveLater={currentIndex < orderedExercises.length - 1}
          onMoveEarlier={() => moveCurrent(-1)}
          onMoveLater={() => moveCurrent(1)}
          onSkip={() => {
            setExerciseSkipped(current.id, true)
            if (currentIndex < orderedExercises.length - 1) go(currentIndex + 1)
          }}
          onNextExercise={() => go(currentIndex + 1)}
          hasNextExercise={currentIndex < orderedExercises.length - 1}
        />
      </main>}

      <RestTimerDock
        exercises={orderedExercises}
        currentExerciseId={current.id}
        notificationsEnabled={notificationsEnabled}
        soundEnabled={restTimerSound}
        vibrateEnabled={restTimerVibrate}
      />
      <SessionExitSheet
        open={exitOpen}
        onOpenChange={setExitOpen}
        onExit={exitWorkout}
        onCancelWorkout={cancelWorkout}
      />
      <FinishWorkoutSheet
        open={finishOpen}
        onOpenChange={setFinishOpen}
        sessionId={session.id}
        startedAt={session.started_at}
        workoutExercises={workout.workout_exercises}
        bestWeights={prWeights}
      />
    </div>
  )
}
