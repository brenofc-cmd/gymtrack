import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  Workout,
  WorkoutLetter,
  WorkoutWithExercises,
  WorkoutExerciseWithExercise,
} from '@/types/database'
import { todayLetter } from '@/lib/utils/weekday'
import { ROUTINE_VERSION } from '@/lib/routine/powerbuilding-v4'
import { nextRotatingWorkout } from '@/lib/training/schedule'

type SupabaseDB = SupabaseClient<Database>

export type { WorkoutWithExercises, WorkoutExerciseWithExercise }

export type WorkoutWithCount = Workout & {
  workout_exercises: { id: string }[]
}

const WORKOUT_WITH_EXERCISES_SELECT = `
  *,
  workout_exercises!inner (
    *,
    exercise:exercises (*),
    substitutions:workout_exercise_substitutions (
      *,
      exercise:exercises (*)
    )
  )
`

export async function getWorkouts(
  supabase: SupabaseDB,
  userId: string
): Promise<WorkoutWithCount[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*, workout_exercises(id)')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .eq('routine_version', ROUTINE_VERSION)
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
    .select(WORKOUT_WITH_EXERCISES_SELECT)
    .eq('user_id', userId)
    .eq('letter', letter)
    .eq('is_archived', false)
    .eq('routine_version', ROUTINE_VERSION)
    .eq('workout_exercises.is_hidden', false)
    .order('order_index', { referencedTable: 'workout_exercises' })
    .single()

  if (error) throw error
  return data as unknown as WorkoutWithExercises
}

/**
 * Busca por id (usado pela sessão). NÃO filtra is_archived: sessões antigas
 * apontam para treinos arquivados e o histórico precisa continuar abrindo.
 */
export async function getWorkoutById(
  supabase: SupabaseDB,
  workoutId: string
): Promise<WorkoutWithExercises> {
  const { data, error } = await supabase
    .from('workouts')
    .select(WORKOUT_WITH_EXERCISES_SELECT)
    .eq('id', workoutId)
    .eq('workout_exercises.is_hidden', false)
    .order('order_index', { referencedTable: 'workout_exercises' })
    .single()

  if (error) throw error
  return data as unknown as WorkoutWithExercises
}

/**
 * Treino sugerido do dia:
 * Domingo continua como descanso. Nos demais dias, a agenda mostra o dia
 * planejado quando não há histórico e passa a continuar a sequência após o
 * último treino concluído, evitando pular uma sessão perdida.
 */
export async function getSuggestedWorkout(
  supabase: SupabaseDB,
  userId: string
): Promise<WorkoutLetter | null> {
  const { data: userWorkouts } = await supabase
    .from('workouts')
    .select('letter, day_of_week')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .eq('routine_version', ROUTINE_VERSION)
    .order('order_index')

  const workouts = (userWorkouts ?? []) as Array<{
    letter: string | null
    day_of_week: number | null
  }>

  if (workouts.length === 0) return 'A'

  const scheduledToday = todayLetter()
  if (scheduledToday === null) return null

  const rotation = workouts
    .map((w) => w.letter as WorkoutLetter | null)
    .filter((l): l is WorkoutLetter => l != null)

  if (rotation.length === 0) return scheduledToday

  const { data: lastSession } = await supabase
    .from('workout_sessions')
    .select('workout_id')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(1)
    .single()

  if (!lastSession) return rotation.includes(scheduledToday) ? scheduledToday : rotation[0]

  const { data: workout } = await supabase
    .from('workouts')
    .select('letter')
    .eq('id', (lastSession as { workout_id: string }).workout_id)
    .single()

  if (!workout) return rotation.includes(scheduledToday) ? scheduledToday : rotation[0]

  const lastLetter = (workout as { letter: string }).letter as WorkoutLetter
  if (!rotation.includes(lastLetter)) return rotation[0]
  return nextRotatingWorkout(scheduledToday, lastLetter)
}
