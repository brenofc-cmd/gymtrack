import { redirect, notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkoutWithExercises } from '@/lib/queries/workouts'
import { getLastSetLogForExercise } from '@/lib/queries/exercises'
import { ExerciseListItem } from '@/components/workout/ExerciseListItem'
import { StartWorkoutButton } from '@/components/workout/StartWorkoutButton'
import { WorkoutNotes } from '@/components/workout/WorkoutNotes'
import type { WorkoutLetter } from '@/types/database'

const VALID_LETTERS: WorkoutLetter[] = ['A', 'B', 'C', 'D', 'E']

export default async function TreinoPage(props: {
  params: Promise<{ letter: string }>
}) {
  const { letter } = await props.params

  if (!VALID_LETTERS.includes(letter.toUpperCase() as WorkoutLetter)) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()

  const workout = await getWorkoutWithExercises(
    admin,
    user.id,
    letter.toUpperCase() as WorkoutLetter
  ).catch(() => null)

  if (!workout) notFound()

  // Fetch last set logs for each exercise in parallel
  const lastLogs = await Promise.all(
    workout.workout_exercises.map((we) =>
      getLastSetLogForExercise(admin, we.id)
    )
  )

  return (
    <div className="max-w-lg mx-auto pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-lg leading-tight">
              Treino {workout.letter}
            </h1>
            <p className="text-sm text-muted-foreground">{workout.name}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Notas */}
        {workout.notes && <WorkoutNotes notes={workout.notes} />}

        {/* Lista de exercícios */}
        <div className="space-y-2">
          {workout.workout_exercises.map((we, i) => {
            const lastLog = lastLogs[i]
            return (
              <ExerciseListItem
                key={we.id}
                workoutExercise={we as never}
                lastWeight={lastLog?.weight_kg ?? null}
                lastReps={lastLog?.reps ?? null}
              />
            )
          })}
        </div>

        <p className="text-xs text-center text-muted-foreground pb-2">
          {workout.workout_exercises.length} exercícios ·{' '}
          {workout.workout_exercises.reduce((s, we) => s + we.target_sets, 0)} séries totais
        </p>
      </div>

      <StartWorkoutButton
        workoutId={workout.id}
        workoutLetter={workout.letter}
      />
    </div>
  )
}
