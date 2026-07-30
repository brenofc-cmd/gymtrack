import { redirect } from 'next/navigation'
import { CoreDashboard } from '@/components/daily-core/CoreDashboard'
import { CorePreferencesForm } from '@/components/daily-core/CorePreferencesForm'
import { adaptationWeek, buildExercisePlan, coreWeekday } from '@/lib/daily-core/logic'
import { getCoreCatalog, getCoreSessionSets, getCoreUserState } from '@/lib/daily-core/queries'
import { createClient } from '@/lib/supabase/server'

export default async function AbdomenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let loaded: Awaited<ReturnType<typeof getCoreCatalog>> | null = null
  let userState: Awaited<ReturnType<typeof getCoreUserState>> | null = null
  try {
    ;[loaded, userState] = await Promise.all([getCoreCatalog(supabase), getCoreUserState(supabase, user.id)])
  } catch {
    loaded = null
    userState = null
  }
  if (!loaded || !userState) {
    return (
      <main className="mx-auto w-full max-w-[520px] px-4 py-10">
        <section className="surface-card p-5"><h1 className="text-xl font-extrabold">Abdômen Diário precisa do banco atualizado</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">A interface está instalada, mas as tabelas ainda não estão disponíveis neste ambiente. Aplique a migration <code className="text-foreground">20260717010046_daily_core.sql</code> e recarregue.</p></section>
      </main>
    )
  }
  if (!userState.preferences) {
    return (
      <main className="mx-auto w-full max-w-[520px] px-4 py-5 lg:py-7">
        <p className="metric-label text-primary">Core independente da ficha principal</p>
        <h1 className="mt-1 text-[26px] font-extrabold tracking-tight">Rotina de core</h1>
        <p className="mb-5 mt-2 text-sm leading-relaxed text-muted-foreground">Duas micro-sessões em casa e dois finalizadores de hipertrofia na academia.</p>
        <CorePreferencesForm userId={user.id} initialPreferences={null} initialReminder={userState.reminder} onboarding />
      </main>
    )
  }
  const weekday = coreWeekday()
  const today = loaded.days.find((day) => day.day_of_week === weekday)
  if (!today) throw new Error('Rotina do dia não encontrada')
  const week = adaptationWeek(userState.preferences.adaptation_started_on, userState.preferences.skip_adaptation)
  const exercises = loaded.exercises.filter((exercise) => exercise.day_of_week === weekday)
  const plan = buildExercisePlan(exercises, userState.preferences, week)
  const sets = await getCoreSessionSets(supabase, userState.sessions.map((session) => session.id))
  return (
    <main className="mx-auto w-full max-w-[520px] px-4 py-5 lg:py-7">
      <header className="mb-5"><p className="metric-label text-primary">Em casa + academia</p><h1 className="mt-1 text-[26px] font-extrabold tracking-tight">Rotina de core</h1></header>
      <CoreDashboard userId={user.id} today={today} allDays={loaded.days} plan={plan} exerciseCatalog={loaded.allExercises} sessions={userState.sessions} sets={sets} pain={userState.pain} progressions={userState.progressions} adaptationWeek={week} />
    </main>
  )
}
