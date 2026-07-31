import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const { jobId } = await request.json().catch(() => ({})) as { jobId?: string }
  if (!jobId) return NextResponse.json({ error: 'Aviso inválido.' }, { status: 400 })
  const { error } = await (supabase as any).from('rest_push_jobs').update({ cancelled_at: new Date().toISOString() }).eq('id', jobId).eq('user_id', user.id).is('sent_at', null)
  if (error) return NextResponse.json({ error: 'Não foi possível cancelar.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
