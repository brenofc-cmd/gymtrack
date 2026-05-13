import { redirect } from 'next/navigation'
import { subWeeks } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLifetimeStats } from '@/lib/queries/profile'
import { getTrainingDays, getMuscleGroupDistribution } from '@/lib/queries/sessions'
import { getWeeklyVolume } from '@/lib/queries/analytics'
import { formatVolume } from '@/lib/utils/volume'
import { WeeklyVolumeChart } from '@/components/analytics/WeeklyVolumeChart'
import { WeekdayFrequencyChart } from '@/components/analytics/WeekdayFrequencyChart'

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default async function AnalisesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [lifetimeStats, weeklyVolume, trainingDays, muscleMonth] =
    await Promise.all([
      getLifetimeStats(admin, user.id),
      getWeeklyVolume(admin, user.id, 12),
      getTrainingDays(admin, user.id, 365),
      getMuscleGroupDistribution(admin, user.id, subWeeks(new Date(), 4)),
    ])

  // Semanas ativas e média
  const weeksActive = lifetimeStats.memberSince
    ? Math.max(
        1,
        Math.round(
          (Date.now() - new Date(lifetimeStats.memberSince).getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        )
      )
    : 1
  const avgPerWeek = (lifetimeStats.totalSessions / weeksActive).toFixed(1)

  // Frequência por dia da semana (último ano)
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]
  for (const { date } of trainingDays) {
    const [y, m, d] = date.split('-').map(Number)
    const dayOfWeek = new Date(y, m - 1, d).getDay()
    weekdayCounts[dayOfWeek]++
  }
  const weekdayData = WEEKDAY_LABELS.map((label, i) => ({
    day: label,
    count: weekdayCounts[i],
  }))

  const favoriteDay =
    weekdayCounts.every((c) => c === 0)
      ? null
      : WEEKDAY_LABELS[weekdayCounts.indexOf(Math.max(...weekdayCounts))]

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-6">
      <h1 className="text-2xl font-bold">Análises</h1>

      {/* Stats vitalícios */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-card border border-border p-4 space-y-0.5">
          <p className="text-3xl font-black tabular-nums">
            {lifetimeStats.totalSessions}
          </p>
          <p className="text-xs text-muted-foreground">treinos no total</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4 space-y-0.5">
          <p className="text-3xl font-black tabular-nums">
            {formatVolume(lifetimeStats.totalVolumeKg)}
          </p>
          <p className="text-xs text-muted-foreground">volume total levantado</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4 space-y-0.5">
          <p className="text-3xl font-black tabular-nums">{avgPerWeek}</p>
          <p className="text-xs text-muted-foreground">treinos/semana (média)</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4 space-y-0.5">
          <p className="text-3xl font-black tabular-nums">
            {favoriteDay ?? '—'}
          </p>
          <p className="text-xs text-muted-foreground">dia favorito</p>
        </div>
      </div>

      {/* Volume por semana */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Volume por semana</h2>
          <p className="text-xs text-muted-foreground">últimas 12 semanas · kg levantados</p>
        </div>
        <WeeklyVolumeChart data={weeklyVolume} />
      </div>

      {/* Frequência por dia da semana */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Dia mais treinado</h2>
          <p className="text-xs text-muted-foreground">último ano · treinos por dia da semana</p>
        </div>
        <WeekdayFrequencyChart data={weekdayData} />
      </div>

      {/* Distribuição muscular — últimas 4 semanas */}
      {muscleMonth.length > 0 ? (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Grupos musculares</h2>
            <p className="text-xs text-muted-foreground">últimas 4 semanas</p>
          </div>
          <div className="space-y-2.5">
            {muscleMonth.map(({ muscle, sets, pct }) => {
              const MUSCLE_LABELS: Record<string, string> = {
                peito: 'Peitoral',
                ombro: 'Ombro',
                'tríceps': 'Tríceps',
                'bíceps': 'Bíceps',
                costas: 'Costas',
                'quadríceps': 'Quadríceps',
                isquiotibiais: 'Isquiotibiais',
                panturrilha: 'Panturrilha',
                'abdômen': 'Abdômen',
                glúteos: 'Glúteos',
                trapézio: 'Trapézio',
                antebraço: 'Antebraço',
              }
              const MUSCLE_COLORS: Record<string, string> = {
                peito: 'bg-blue-500',
                costas: 'bg-green-500',
                ombro: 'bg-purple-500',
                'bíceps': 'bg-amber-500',
                'tríceps': 'bg-orange-500',
                'quadríceps': 'bg-red-500',
                isquiotibiais: 'bg-pink-500',
                glúteos: 'bg-rose-500',
                'abdômen': 'bg-cyan-500',
                panturrilha: 'bg-teal-500',
                trapézio: 'bg-indigo-500',
                antebraço: 'bg-yellow-500',
              }
              const label = MUSCLE_LABELS[muscle] ?? muscle
              const color = MUSCLE_COLORS[muscle] ?? 'bg-primary'
              return (
                <div key={muscle} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground">
                      {sets} {sets === 1 ? 'série' : 'séries'} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border p-4 text-center py-8">
          <p className="text-sm text-muted-foreground">
            Treine nas próximas 4 semanas para ver a distribuição muscular.
          </p>
        </div>
      )}
    </div>
  )
}
