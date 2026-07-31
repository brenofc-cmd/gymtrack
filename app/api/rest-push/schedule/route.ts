import { NextResponse } from 'next/server'
import { start } from 'workflow/api'
import { createClient } from '@/lib/supabase/server'
import { restPushWorkflow } from '@/lib/workflows/rest-push'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const body = await request.json().catch(() => null) as { endsAt?: number; workoutExerciseId?: string } | null
  if (!body?.endsAt || !body.workoutExerciseId || !Number.isFinite(body.endsAt) || body.endsAt < Date.now()) return NextResponse.json({ error: 'Descanso inválido.' }, { status: 400 })
  const endsAt = new Date(body.endsAt).toISOString()
  const { data: job, error } = await (supabase as any).from('rest_push_jobs').insert({ user_id: user.id, workout_exercise_id: body.workoutExerciseId, ends_at: endsAt }).select('id').single()
  if (error || !job) return NextResponse.json({ error: 'Não foi possível agendar o aviso.' }, { status: 500 })
  try { await start(restPushWorkflow, [job.id, endsAt]) }
  catch { await (supabase as any).from('rest_push_jobs').update({ cancelled_at: new Date().toISOString() }).eq('id', job.id); return NextResponse.json({ error: 'Agendamento indisponível.' }, { status: 503 }) }
  return NextResponse.json({ jobId: job.id })
}
