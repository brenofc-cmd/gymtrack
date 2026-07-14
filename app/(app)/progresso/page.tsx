import { redirect } from 'next/navigation'
import { TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWeeklyVolume } from '@/lib/queries/analytics'
import { getLifetimeStats } from '@/lib/queries/profile'
import { getBodyMeasurements, getExerciseProgressSummaries } from '@/lib/queries/progress'
import { formatVolume } from '@/lib/utils/volume'
import { WeeklyVolumeChart } from '@/components/analytics/WeeklyVolumeChart'
import { ExerciseProgressExplorer } from '@/components/progress/ExerciseProgressExplorer'
import { MeasurementsPanel } from '@/components/progress/MeasurementsPanel'

export default async function ProgressoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const [weeklyVolume, lifetime, exercises, measurements] = await Promise.all([
    getWeeklyVolume(admin, user.id, 12),
    getLifetimeStats(admin, user.id),
    getExerciseProgressSummaries(admin, user.id),
    getBodyMeasurements(admin, user.id),
  ])
  const current = weeklyVolume.at(-1)?.volumeKg ?? 0
  const previous = weeklyVolume.at(-2)?.volumeKg ?? 0
  const delta = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null

  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-col gap-3 px-4 py-5 lg:py-7">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">Progresso</h1>
          <p className="mt-1 text-xs text-muted-foreground">Força, consistência e medidas</p>
        </div>
        <div className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 font-mono text-xs font-semibold text-primary">
          {lifetime.totalSessions} treinos
        </div>
      </header>

      <section className="surface-card p-4">
        <p className="metric-label">Principal evolução</p>
        <div className="mt-2 flex items-center gap-2">
          <TrendingUp className="size-4 text-[#4ad17e]" />
          <p className="text-sm font-bold">
            Volume desta semana{' '}
            <span className={delta != null && delta < 0 ? 'text-[#ffb547]' : 'text-[#4ad17e]'}>
              {delta == null ? 'sem comparação' : `${delta >= 0 ? '+' : ''}${delta}%`}
            </span>
          </p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{formatVolume(current)} registrados na semana atual.</p>
      </section>

      <section className="surface-card p-4">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">Volume total</h2>
            <p className="text-[11px] text-muted-foreground">kg por semana</p>
          </div>
          <p className="font-mono text-sm font-bold text-primary">{formatVolume(current)}</p>
        </div>
        <WeeklyVolumeChart data={weeklyVolume} />
      </section>

      <ExerciseProgressExplorer exercises={exercises} />
      <MeasurementsPanel userId={user.id} initialMeasurements={measurements} />
    </div>
  )
}
