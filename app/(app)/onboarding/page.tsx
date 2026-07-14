import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('goal, weight_kg, height_cm, weekly_goal')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <OnboardingFlow
      userId={user.id}
      initial={{
        goal: profile?.goal ?? null,
        weightKg: profile?.weight_kg ?? null,
        heightCm: profile?.height_cm ?? null,
        weeklyGoal: profile?.weekly_goal ?? 6,
      }}
    />
  )
}
