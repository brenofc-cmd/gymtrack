import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PreferencesForm } from '@/components/settings/PreferencesForm'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 py-5 lg:py-7">
      <header className="mb-5">
        <h1 className="text-[22px] font-extrabold tracking-tight">Configurações</h1>
        <p className="mt-1 text-xs text-muted-foreground">Timer, unidade e metas gerais</p>
      </header>
      <PreferencesForm userId={user.id} initial={preferences} />
    </div>
  )
}
