import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WellnessForms } from '@/components/wellness/WellnessForms'

export default async function AcompanhamentoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <div className="max-w-lg mx-auto px-4 py-6 space-y-5"><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Acompanhamento</p><h1 className="text-2xl font-black">Nutrição e recuperação</h1></div><WellnessForms userId={user.id} /></div>
}
