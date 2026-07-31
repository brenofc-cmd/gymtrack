import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  if (!publicKey) return NextResponse.json({ error: 'Push não configurado.' }, { status: 503 })
  return NextResponse.json({ publicKey })
}
