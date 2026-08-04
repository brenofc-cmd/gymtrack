import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SupplementTracker } from '@/components/supplements/SupplementTracker'

function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export default async function SuplementosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = todayISO()
  const [supplements, logs] = await Promise.all([
    supabase
      .from('supplements')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('supplement_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('taken_on', today),
  ])

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 py-5 lg:py-7">
      <header className="mb-5">
        <h1 className="text-[22px] font-extrabold tracking-tight">Suplementos</h1>
        <p className="mt-1 text-xs text-muted-foreground">Acompanhe somente o que já foi definido para você</p>
      </header>
      <SupplementTracker
        userId={user.id}
        initialSupplements={supplements.data ?? []}
        initialLogs={logs.data ?? []}
        today={today}
      />
      <div className="mt-4 flex gap-2 rounded-[14px] border border-[var(--warn-tint)]/25 bg-[var(--warn-tint)]/5 p-3.5">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[var(--warn-tint)]" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          O registro não é recomendação médica. Doses, necessidade, interações e contraindicações devem ser avaliadas por profissional habilitado.
        </p>
      </div>
    </div>
  )
}
