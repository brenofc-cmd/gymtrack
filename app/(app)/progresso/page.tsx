import { redirect } from 'next/navigation'
import { TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  getWeeklyVolume,
  getExecutedWeeklyVolumeByMuscle,
  getPlannedWeeklyVolumeByMuscle,
  getDailyCoreWeeklySets,
} from '@/lib/queries/analytics'
import { getLifetimeStats } from '@/lib/queries/profile'
import { getBodyMeasurements, getExerciseProgressSummaries } from '@/lib/queries/progress'
import { formatVolume } from '@/lib/utils/volume'
import { WeeklyVolumeChart } from '@/components/analytics/WeeklyVolumeChart'
import { ExerciseProgressExplorer } from '@/components/progress/ExerciseProgressExplorer'
import { MeasurementsPanel } from '@/components/progress/MeasurementsPanel'
import { PlannedVolumeCard } from '@/components/dashboard/PlannedVolumeCard'
import { getActiveDupBlock, getReferenceMaxes } from '@/lib/queries/dup-program'

const MAIN_LIFTS = [
  ['back-squat', 'Agachamento'],
  ['barbell-bench-press', 'Supino'],
  ['conventional-deadlift', 'Terra'],
  ['barbell-overhead-press', 'Desenvolvimento'],
] as const

export default async function ProgressoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [weeklyVolume, lifetime, exercises, measurements, executedByMuscle, plannedVolume, dailyCoreWeekSets, activeBlock, referenceMaxes] =
    await Promise.all([
      getWeeklyVolume(supabase, user.id, 12),
      getLifetimeStats(supabase, user.id),
      getExerciseProgressSummaries(supabase, user.id),
      getBodyMeasurements(supabase, user.id),
      getExecutedWeeklyVolumeByMuscle(supabase, user.id).catch(() => ({})),
      // Falha na consulta → null: o card mostra erro em vez de números estáticos
      getPlannedWeeklyVolumeByMuscle(supabase, user.id).catch(() => null),
      getDailyCoreWeeklySets(supabase, user.id).catch(() => null),
      getActiveDupBlock(supabase, user.id).catch(() => null),
      getReferenceMaxes(supabase, user.id).catch(() => []),
    ])
  const current = weeklyVolume.at(-1)?.volumeKg ?? 0
  const previous = weeklyVolume.at(-2)?.volumeKg ?? 0
  const delta = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null
  const maxBySlug = new Map(referenceMaxes.map((item) => [item.exercise.slug, item]))

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
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="metric-label text-primary">Powerbuilding DUP Adaptado · bloco de 8 semanas</p>
            <h2 className="mt-1 text-sm font-bold">
              {activeBlock ? `Semana ${activeBlock.week_number} de ${activeBlock.total_weeks}` : 'Bloco ainda não iniciado'}
            </h2>
          </div>
          {activeBlock && (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-primary">
              ciclo {activeBlock.cycle_number}
            </span>
          )}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Máxima testada, estimada e training max são referências distintas. A progressão abaixo é calculada pelo GymTrack e não integra a rotina pública original.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {MAIN_LIFTS.map(([slug, label]) => {
            const max = maxBySlug.get(slug)
            const reference = max?.tested_1rm ?? max?.estimated_1rm ?? null
            return (
              <div key={slug} className="rounded-xl bg-secondary/45 p-3">
                <p className="text-xs font-bold">{label}</p>
                <p className="mt-1 font-mono text-lg font-black text-primary">
                  {reference == null ? '—' : `${reference} kg`}
                </p>
                <p className="text-[9px] text-muted-foreground">
                  {max?.tested_1rm != null
                    ? '1RM testada'
                    : max?.estimated_1rm != null
                      ? '1RM estimada'
                      : 'sem referência'}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Training max: {max?.training_max == null ? '—' : `${max.training_max} kg`}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="surface-card p-4">
        <p className="metric-label">Principal evolução</p>
        <div className="mt-2 flex items-center gap-2">
          <TrendingUp className="size-4 text-[var(--mint-text)]" />
          <p className="text-sm font-bold">
            Volume desta semana{' '}
            <span className={delta != null && delta < 0 ? 'text-[var(--warn-tint)]' : 'text-[var(--mint-text)]'}>
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
      <PlannedVolumeCard
        planned={plannedVolume?.planned ?? null}
        indirect={plannedVolume?.indirect ?? null}
        executed={executedByMuscle}
        dailyCoreWeekSets={dailyCoreWeekSets}
      />
      <MeasurementsPanel userId={user.id} initialMeasurements={measurements} />
    </div>
  )
}
