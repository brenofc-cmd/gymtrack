import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  Workout,
  WorkoutLetter,
  WorkoutWithExercises,
  WorkoutExerciseWithExercise,
} from '@/types/database'
import { todayLetter } from '@/lib/utils/weekday'

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
 * 1. Se a rotina tem dias da semana definidos (rotina v2), usa o dia atual
 *    no fuso America/Sao_Paulo. Domingo → null (descanso).
 * 2. Caso contrário, mantém a rotação clássica (próximo após o último feito).
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
    .order('order_index')

  const workouts = (userWorkouts ?? []) as Array<{
    letter: string | null
    day_of_week: number | null
  }>

  if (workouts.length === 0) return 'A'

  const hasWeekdays = workouts.some((w) => w.day_of_week != null)
  if (hasWeekdays) {
    const letter = todayLetter()
    if (letter === null) return null // domingo: descanso
    const match = workouts.find((w) => w.letter === letter)
    if (match) return letter
  }

  // Fallback: rotação pela ordem
  const rotation = workouts
    .map((w) => w.letter as WorkoutLetter | null)
    .filter((l): l is WorkoutLetter => l != null)

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
