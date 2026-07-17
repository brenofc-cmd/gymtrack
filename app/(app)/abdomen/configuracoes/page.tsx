import { redirect } from 'next/navigation'
import { CorePreferencesForm } from '@/components/daily-core/CorePreferencesForm'
import { getCoreUserState } from '@/lib/daily-core/queries'
import { createClient } from '@/lib/supabase/server'

export default async function AbdomenConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const state = await getCoreUserState(supabase, user.id)
  return (
    <main className="mx-auto w-full max-w-[520px] px-4 py-5 lg:py-7">
      <header className="mb-5"><p className="metric-label text-primary">Abdômen Diário</p><h1 className="mt-1 text-[24px] font-extrabold tracking-tight">Preferências</h1><p className="mt-1 text-xs text-muted-foreground">Equipamentos, adaptação e lembrete matinal</p></header>
      <CorePreferencesForm userId={user.id} initialPreferences={state.preferences} initialReminder={state.reminder} />
    </main>
  )
}
