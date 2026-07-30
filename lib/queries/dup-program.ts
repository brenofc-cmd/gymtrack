import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  ExerciseReferenceMaxRow,
  TrainingProgramBlockRow,
} from '@/types/database'

type SupabaseDB = SupabaseClient<Database>

export async function ensureActiveAdaptedDupRoutineV6(supabase: SupabaseDB) {
  const { data, error } = await supabase.rpc('ensure_active_powerbuilding_dup_adapted_v6')
  if (error) throw error
  return data
}

export async function getActiveDupBlock(
  supabase: SupabaseDB,
  userId: string
): Promise<TrainingProgramBlockRow | null> {
  const { data, error } = await supabase
    .from('training_program_blocks')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'paused'])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getReferenceMaxes(
  supabase: SupabaseDB,
  userId: string
): Promise<Array<ExerciseReferenceMaxRow & { exercise: { slug: string | null; name_pt: string } }>> {
  const { data, error } = await supabase
    .from('exercise_reference_maxes')
    .select('*, exercise:exercises(slug,name_pt)')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []) as unknown as Array<ExerciseReferenceMaxRow & { exercise: { slug: string | null; name_pt: string } }>
}

/**
 * Seguro para chamar ao finalizar qualquer sessão: a própria função SQL só
 * avança quando A–F foram concluídos na semana corrente e bloqueia a linha.
 */
export async function maybeAdvanceActiveDupBlockWeek(supabase: SupabaseDB) {
  const { data, error } = await supabase.rpc('advance_active_dup_block_week')
  if (error && error.message !== 'active block not found') throw error
  return data
}
