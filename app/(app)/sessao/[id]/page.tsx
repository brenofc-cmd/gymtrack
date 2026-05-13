import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionWithLogs } from '@/lib/queries/sessions'
import { getWorkoutById } from '@/lib/queries/workouts'
import { getLastSetLogForExercise, getExercisePR } from '@/lib/queries/exercises'
import { SessionClient } from './SessionClient'

export default async function SessaoPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()

  const sessionData = await getSessionWithLogs(admin, id).catch(() => null)
  if (!sessionData || sessionData.user_id !== user.id) notFound()

  if (sessionData.finished_at) {
    redirect(`/historico/${id}`)
  }

  const workoutData = await getWorkoutById(admin, sessionData.workout_id).catch(
    () => null
  )
  if (!workoutData) notFound()

  const [lastLogs, prWeights] = await Promise.all([
    Promise.all(
      workoutData.workout_exercises.map((we) =>
        getLastSetLogForExercise(admin, we.id, id)
      )
    ),
    Promise.all(
      workoutData.workout_exercises.map((we) =>
        getExercisePR(admin, we.exercise_id, user.id).then((pr) => pr?.maxWeight ?? null)
      )
    ),
  ])

  return (
    <SessionClient
      session={sessionData}
      workout={workoutData}
      lastLogs={lastLogs}
      prWeights={prWeights}
    />
  )
}
