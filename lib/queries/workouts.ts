import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  Workout,
  WorkoutExercise,
  Exercise,
  WorkoutLetter,
} from '@/types/database'

type SupabaseDB = SupabaseClient<Database>

export type WorkoutExerciseWithExercise = WorkoutExercise & {
  exercise: Exercise
}

export type WorkoutWithExercises = Workout & {
  workout_exercises: WorkoutExerciseWithExercise[]
}

export type WorkoutWithCount = Workout & {
  workout_exercises: { id: string }[]
}

export async function getWorkouts(
  supabase: SupabaseDB,
  userId: string
): Promise<WorkoutWithCount[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*, workout_exercises(id)')
    .eq('user_id', userId)
    .order('order_index')

  if (error) throw error
  return (data ?? []) as unknown as WorkoutWithCount[]
}

export async function getWorkoutWithExercises(
  supabase: SupabaseDB,
  userId: string,
  letter: WorkoutLetter
): Promise<WorkoutWithExercises> {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_exercises!inner (
        *,
        exercise:exercises (*)
      )
    `)
    .eq('user_id', userId)
    .eq('letter', letter)
    .eq('workout_exercises.is_hidden', false)
    .order('order_index', { referencedTable: 'workout_exercises' })
    .single()

  if (error) throw error
  return data as unknown as WorkoutWithExercises
}

export async function getWorkoutById(
  supabase: SupabaseDB,
  workoutId: string
): Promise<WorkoutWithExercises> {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_exercises!inner (
        *,
        exercise:exercises (*)
      )
    `)
    .eq('id', workoutId)
    .eq('workout_exercises.is_hidden', false)
    .order('order_index', { referencedTable: 'workout_exercises' })
    .single()

  if (error) throw error
  return data as unknown as WorkoutWithExercises
}

export async function getSuggestedWorkout(
  supabase: SupabaseDB,
  userId: string
): Promise<WorkoutLetter> {
  const { data: userWorkouts } = await supabase
    .from('workouts')
    .select('letter')
    .eq('user_id', userId)
    .order('order_index')

  const rotation = (userWorkouts ?? []).map(
    (w) => (w as { letter: string }).letter as WorkoutLetter
  )

  if (rotation.length === 0) return 'A'

  const { data: lastSession } = await supabase
    .from('workout_sessions')
    .select('workout_id')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(1)
    .single()

  if (!lastSession) return rotation[0]

  const { data: workout } = await supabase
    .from('workouts')
    .select('letter')
    .eq('id', (lastSession as { workout_id: string }).workout_id)
    .single()

  if (!workout) return rotation[0]

  const lastLetter = (workout as { letter: string }).letter as WorkoutLetter
  const idx = rotation.indexOf(lastLetter)
  if (idx === -1) return rotation[0]
  return rotation[(idx + 1) % rotation.length]
}
