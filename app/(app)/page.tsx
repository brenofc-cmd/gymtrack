import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkouts, getSuggestedWorkout } from '@/lib/queries/workouts'
import {
  getLastSessionsPerWorkout,
  getWeekStats,
  getActiveSession,
  getTrainingDays,
  getMuscleGroupDistribution,
} from '@/lib/queries/sessions'
import { getStreakStats } from '@/lib/utils/streak'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { StreakCard } from '@/components/dashboard/StreakCard'
import { WorkoutSuggestion } from '@/components/dashboard/WorkoutSuggestion'
import { WorkoutCard } from '@/components/dashboard/WorkoutCard'
import { WeekStats } from '@/components/dashboard/WeekStats'
import { ResumeSessionBanner } from '@/components/dashboard/ResumeSessionBanner'
import { TrainingHeatmap } from '@/components/dashboard/TrainingHeatmap'
import { MuscleDistribution } from '@/components/dashboard/MuscleDistribution'
import type { WorkoutLetter } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()

  let workouts = [] as Awaited<ReturnType<typeof getWorkouts>>
  let suggestedLetter: WorkoutLetter = 'A'
  let lastSessions = [] as Awaited<ReturnType<typeof getLastSessionsPerWorkout>>
  let weekStats = { count: 0, totalSeconds: 0, totalVolumeKg: 0 }
  let streakStats = { current: 0, longest: 0 }
  let activeSession = null as Awaited<ReturnType<typeof getActiveSession>>
  let trainingDays = [] as Awaited<ReturnType<typeof getTrainingDays>>
  let muscleDistribution = [] as Awaited<ReturnType<typeof getMuscleGroupDistribution>>

  try {
    ;[workouts, suggestedLetter, lastSessions, weekStats, streakStats, activeSession, trainingDays, muscleDistribution] =
      await Promise.all([
        getWorkouts(admin, user.id),
        getSuggestedWorkout(admin, user.id),
        getLastSessionsPerWorkout(admin, user.id),
        getWeekStats(admin, user.id),
        getStreakStats(admin, user.id),
        getActiveSession(admin, user.id),
        getTrainingDays(admin, user.id),
        getMuscleGroupDistribution(admin, user.id),
      ])
  } catch (err) {
    console.error('[DashboardPage] failed to load dashboard data:', err)
  }

  const suggestedWorkout = workouts.find((w) => w.letter === suggestedLetter) ?? null

  const lastSessionMap = new Map<string, string>()
  for (const s of lastSessions) {
    if (s.finished_at) {
      lastSessionMap.set(s.workout_id, s.finished_at)
    }
  }

  const firstName =
    (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? null

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">Olá{firstName ? ',' : '!'}</p>
        {firstName && <h1 className="text-2xl font-bold">{firstName} 👋</h1>}
      </div>

      {/* Banner de sessão em andamento */}
      {activeSession && (
        <ResumeSessionBanner
          sessionId={activeSession.id}
          workoutName={activeSession.workout?.name ?? 'Treino'}
          startedAt={activeSession.started_at}
        />
      )}

      {/* Streak */}
      <StreakCard streak={streakStats.current} longestStreak={streakStats.longest} />

      {/* Sugestão do dia */}
      <WorkoutSuggestion
        letter={suggestedLetter as WorkoutLetter}
        workout={suggestedWorkout}
      />

      {/* Stats da semana */}
      <WeekStats
        sessionCount={weekStats.count}
        totalSeconds={weekStats.totalSeconds}
        totalVolumeKg={weekStats.totalVolumeKg}
      />

      {/* Heatmap de treinos */}
      <TrainingHeatmap trainingDays={trainingDays} />

      {/* Distribuição de grupos musculares */}
      <MuscleDistribution data={muscleDistribution} />

      {/* Cards dos treinos */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Seus treinos
        </h2>
        <div className="space-y-2">
          {workouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              lastSessionDate={lastSessionMap.get(workout.id) ?? null}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
