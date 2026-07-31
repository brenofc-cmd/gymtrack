'use client'

import { useEffect, useState } from 'react'
import { ActiveWorkoutHeader } from '@/components/session/ActiveWorkoutHeader'
import { CurrentExercisePanel, type PreviousExerciseSet } from '@/components/session/CurrentExercisePanel'
import { ExerciseNavigator } from '@/components/session/ExerciseNavigator'
import { RestTimerDock } from '@/components/session/RestTimerDock'
import { useSessionStore } from '@/lib/store/sessionStore'
import type { Exercise, WorkoutExerciseWithExercise } from '@/types/database'

function exercise(id: string, name: string, equipment: string, order: number): WorkoutExerciseWithExercise {
  const item: Exercise = {
    id,
    name_pt: name,
    name_en: null,
    muscle_group: order === 0 ? 'costas' : 'bíceps',
    equipment,
    exercise_type: order < 3 ? 'composto' : 'isolador',
    movement_pattern: order === 0 ? 'vertical_pull' : order === 1 ? 'horizontal_pull' : 'elbow_flexion',
    secondary_muscles: order < 3 ? ['bíceps'] : [],
    instructions: ['Mantenha o movimento controlado e a técnica consistente.'],
    load_guidance: null,
    training_objective: null,
    risk_level: order < 3 ? 'moderate' : 'low',
    difficulty_level: 'intermediário',
    exercisedb_id: null,
    slug: id,
    load_unit: 'added_load_kg',
    is_unilateral: false,
    technical_warnings: [],
    default_rest_seconds: 90,
    min_increment_kg: 1,
    gif_url: order === 0
      ? 'https://brendongym.vercel.app/exercises/Band_Assisted_Pull-Up.jpg'
      : null,
    created_at: null,
  }
  return {
    id: `we-${id}`,
    workout_id: 'workout-preview',
    exercise_id: id,
    order_index: order,
    target_sets: order === 0 ? 3 : order < 3 ? 3 : 2,
    target_reps_min: order === 0 ? 8 : 10,
    target_reps_max: order === 0 ? 12 : 15,
    rest_seconds: order === 0 ? 150 : 90,
    rest_seconds_source: 'source',
    rir_min: 2,
    rir_max: 2,
    superset_group: null,
    notes: null,
    user_note: null,
    is_hidden: false,
    created_at: null,
    top_set_enabled: false,
    backoff_percentage: null,
    technique_notes: ['Amplitude controlada e sem balanço.'],
    load_guidance: null,
    progression_type: 'double_progression',
    failure_allowed: false,
    failure_risk_level: order < 3 ? 'moderate' : 'low',
    default_set_role: 'standard',
    prescription_type: 'rep_range',
    fixed_reps: null,
    rep_max_target: null,
    prescription_locked: false,
    is_priority: order === 0,
    aesthetic_function: null,
    percentage_of_e1rm: null,
    load_strategy: null,
    source_prescription: null,
    guided_prescription: null,
    guided_reps_fixed: null,
    exercise: item,
    substitutions: [],
  }
}

const EXERCISES = [
  exercise('pullup', 'Barra fixa assistida com pegada neutra', 'máquina assistida', 0),
  exercise('row', 'Remada unilateral no cabo', 'cabo', 1),
  exercise('trow', 'Remada T com apoio', 'máquina', 2),
  exercise('rear', 'Crucifixo inverso no cabo', 'cabo', 3),
  exercise('curl', 'Rosca alternada no banco inclinado', 'halter', 4),
  exercise('cablecurl', 'Rosca direta no cabo', 'cabo', 5),
]

const PREVIOUS: PreviousExerciseSet[] = [
  { set_number: 1, weight_kg: 30, reps: 10, rir: 2, is_warmup: false, pain_level: 'nenhuma', execution_quality: 'boa', completed_at: '2026-07-07T12:00:00.000Z' },
  { set_number: 2, weight_kg: 30, reps: 9, rir: 2, is_warmup: false, pain_level: 'nenhuma', execution_quality: 'boa', completed_at: '2026-07-07T12:03:00.000Z' },
  { set_number: 3, weight_kg: 30, reps: 8, rir: 2, is_warmup: false, pain_level: 'nenhuma', execution_quality: 'boa', completed_at: '2026-07-07T12:06:00.000Z' },
]

export default function VisualHarnessPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const store = useSessionStore()
  const startSession = useSessionStore((state) => state.startSession)
  const upsertSet = useSessionStore((state) => state.upsertSet)
  const startRestTimer = useSessionStore((state) => state.startRestTimer)

  useEffect(() => {
    startSession('session-preview', 'workout-preview', new Date(Date.now() - 4_356_000).toISOString())
    const params = new URLSearchParams(window.location.search)
    if (params.get('state') === 'timer') {
      upsertSet(EXERCISES[0].id, {
        id: 'preview-set-1',
        set_number: 1,
        weight_kg: 30,
        reps: 10,
        rir: 2,
        is_warmup: false,
        set_role: 'standard',
        completed_at: new Date().toISOString(),
      })
      startRestTimer(102, EXERCISES[0].id)
    }
  }, [startRestTimer, startSession, upsertSet])

  const current = EXERCISES[currentIndex]
  const completed = Object.values(store.sets).flat().filter((set) => !set.is_warmup).length
  const total = EXERCISES.reduce((sum, item) => sum + item.target_sets, 0)

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background">
      <ActiveWorkoutHeader
        startedAt={store.startedAt ?? new Date().toISOString()}
        workoutName="Pull B"
        workoutLetter="E"
        completedSets={completed}
        totalSets={total}
        onExit={() => {}}
        onFinish={() => {}}
      />
      <ExerciseNavigator
        exercises={EXERCISES}
        currentIndex={currentIndex}
        completedSets={completed}
        totalSets={total}
        sets={store.sets}
        feedback={store.feedback}
        skippedExerciseIds={store.skippedExerciseIds}
        onGo={setCurrentIndex}
      />
      <main className="mx-auto w-full max-w-3xl px-3 pb-48 pt-2 sm:px-4 sm:pt-3">
        <CurrentExercisePanel
          sessionId="session-preview"
          workoutExercise={current}
          exerciseNumber={currentIndex + 1}
          totalExercises={EXERCISES.length}
          previousSets={currentIndex === 0 ? PREVIOUS : []}
          bestWeight={currentIndex === 0 ? 25 : null}
          progression={currentIndex === 0 ? {
            action: 'manter',
            reason: 'Mantenha a assistência e tente aumentar as repetições com técnica boa.',
          } : null}
          history={[]}
          showWarmupPlan={currentIndex === 0}
          canMoveEarlier={currentIndex > 0}
          canMoveLater={currentIndex < EXERCISES.length - 1}
          onMoveEarlier={() => setCurrentIndex((index) => Math.max(0, index - 1))}
          onMoveLater={() => setCurrentIndex((index) => Math.min(EXERCISES.length - 1, index + 1))}
          onSkip={() => setCurrentIndex((index) => Math.min(EXERCISES.length - 1, index + 1))}
          onNextExercise={() => setCurrentIndex((index) => Math.min(EXERCISES.length - 1, index + 1))}
          hasNextExercise={currentIndex < EXERCISES.length - 1}
        />
      </main>
      <RestTimerDock exercises={EXERCISES} currentExerciseId={current.id} />
    </div>
  )
}
