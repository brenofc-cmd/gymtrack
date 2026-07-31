import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const body = await request.json().catch(() => null) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | null
  if (!body?.endpoint || !body.keys?.p256dh || !body.keys.auth) return NextResponse.json({ error: 'Inscrição inválida.' }, { status: 400 })
  const { error } = await (supabase as any).from('push_subscriptions').upsert({ user_id: user.id, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth, updated_at: new Date().toISOString() }, { onConflict: 'endpoint' })
  if (error) return NextResponse.json({ error: 'Não foi possível registrar este aparelho.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
