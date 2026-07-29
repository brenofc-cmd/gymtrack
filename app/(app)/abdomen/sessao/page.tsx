import { redirect } from 'next/navigation'
import { CoreSessionClient } from '@/components/daily-core/CoreSessionClient'
import { adaptationWeek, buildExercisePlan, coreWeekday, localDateISO } from '@/lib/daily-core/logic'
import { getCoreCatalog, getCoreUserState } from '@/lib/daily-core/queries'
import { createClient } from '@/lib/supabase/server'

export default async function AbdomenSessaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const [catalog, state, userPreferences] = await Promise.all([
    getCoreCatalog(supabase),
    getCoreUserState(supabase, user.id),
    supabase.from('user_preferences').select('*').eq('id', user.id).maybeSingle(),
  ])
  if (!state.preferences) redirect('/abdomen')
  const weekday = coreWeekday()
  const day = catalog.days.find((item) => item.day_of_week === weekday)
  if (!day || day.is_rest) redirect('/abdomen')
  const existingSession = state.sessions.find((session) => session.session_date === localDateISO()) ?? null
  if (existingSession?.status === 'concluido') redirect('/abdomen')
  const week = adaptationWeek(state.preferences.adaptation_started_on, state.preferences.skip_adaptation)
  const exercises = buildExercisePlan(catalog.exercises.filter((exercise) => exercise.day_of_week === weekday), state.preferences, week)
  return <CoreSessionClient userId={user.id} day={day} exercises={exercises} adaptationWeek={week} existingSession={existingSession} keepScreenAwake={userPreferences.data?.keep_screen_awake ?? true} />
}
