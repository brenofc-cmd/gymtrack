import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  Check,
  ChevronRight,
  Droplets,
  Moon,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkoutWithExercises, getSuggestedWorkout } from '@/lib/queries/workouts'
import {
  getActiveSession,
  getTrainingDays,
  getWeekStats,
} from '@/lib/queries/sessions'
import { getStreakStats } from '@/lib/utils/streak'
import { formatVolume } from '@/lib/utils/volume'
import { DIA_LABEL, TRAINING_FOCUS_LABEL } from '@/lib/routine/powerbuilding-v4'
import { ResumeSessionBanner } from '@/components/dashboard/ResumeSessionBanner'
import { DailyCoreHomeCard } from '@/components/dashboard/DailyCoreHomeCard'
import type { WorkoutLetter } from '@/types/database'

function formatDate(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date())
}

function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()
  const suggestedLetter = await getSuggestedWorkout(admin, user.id).catch(() => 'A' as WorkoutLetter)

  const [
    workout,
    weekStats,
    streak,
    activeSession,
    trainingDays,
    latestWeight,
    latestSleep,
    latestRecovery,
    latestReadiness,
    nutritionGoal,
    hydrationRows,
  ] = await Promise.all([
    suggestedLetter
      ? getWorkoutWithExercises(admin, user.id, suggestedLetter).catch(() => null)
      : Promise.resolve(null),
    getWeekStats(admin, user.id).catch(() => ({ count: 0, totalSeconds: 0, totalVolumeKg: 0 })),
    getStreakStats(admin, user.id).catch(() => ({ current: 0, longest: 0 })),
    getActiveSession(admin, user.id).catch(() => null),
    getTrainingDays(admin, user.id, 7).catch(() => []),
    admin
      .from('body_weight_logs')
      .select('weight_kg, logged_on')
      .eq('user_id', user.id)
      .order('logged_on', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('sleep_logs')
      .select('duration_minutes, quality, night_of')
      .eq('user_id', user.id)
      .order('night_of', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('recovery_logs')
      .select('fatigue, motivation, soreness, stress, logged_on')
      .eq('user_id', user.id)
      .order('logged_on', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('daily_readiness')
      .select('recommendation, recommendation_reason, readiness_date')
      .eq('user_id', user.id)
      .order('readiness_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('nutrition_goals')
      .select('protein_g, calories_kcal, water_ml')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('hydration_logs')
      .select('amount_ml')
      .eq('user_id', user.id)
      .eq('logged_on', todayISO()),
  ])

  const firstName =
    (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ??
    user.email?.split('@')[0] ??
    'Atleta'
  const sets = workout?.workout_exercises.reduce((total, item) => total + item.target_sets, 0) ?? 0
  const minutes = workout
    ? Math.max(
        35,
        Math.round(
          workout.workout_exercises.reduce(
            (total, item) => total + item.target_sets * (item.rest_seconds + 45),
            0
          ) / 60
        )
      )
    : 0
  const muscleNames = workout
    ? [...new Set(workout.workout_exercises.map((item) => item.exercise.muscle_group))]
        .slice(0, 3)
        .join(', ')
    : ''
  const trainedDates = new Set(trainingDays.map((item) => item.date))
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
  }).format(new Date())
  const weeklyDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((key, index) => {
    const now = new Date()
    const currentIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday)
    const offset = index - ((currentIndex + 6) % 7)
    const date = new Date(now)
    date.setDate(now.getDate() + offset)
    const iso = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
    return { label: ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][index], done: trainedDates.has(iso), today: offset === 0 }
  })
  const sleepMinutes = latestSleep.data?.duration_minutes ?? null
  const sleepLabel = sleepMinutes
    ? `${Math.floor(sleepMinutes / 60)}h${String(sleepMinutes % 60).padStart(2, '0')}`
    : '—'
  const waterToday = hydrationRows.data?.reduce((total, item) => total + item.amount_ml, 0) ?? 0
  const waterGoal = nutritionGoal.data?.water_ml ?? 3000
  const readinessStatus = latestReadiness.data?.recommendation ?? 'ready'
  const readinessGood = readinessStatus === 'ready'

  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-col gap-3.5 px-4 py-5 lg:py-7">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs capitalize text-muted-foreground">{formatDate()}</p>
          <h1 className="mt-0.5 text-[22px] font-extrabold tracking-tight">Olá, {firstName}</h1>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-input px-3 py-1.5">
          <span className="size-2 rounded-full bg-primary" />
          <span className="font-mono text-xs font-semibold text-[#c7d0db]">{streak.current} dias</span>
        </div>
      </header>

      {activeSession && (
        <ResumeSessionBanner
          sessionId={activeSession.id}
          workoutName={activeSession.workout?.name ?? 'Treino'}
          startedAt={activeSession.started_at}
        />
      )}

      <DailyCoreHomeCard userId={user.id} />

      {workout ? (
        <section className="relative overflow-hidden rounded-[20px] border border-border bg-card p-5">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-3 -top-10 select-none text-[190px] font-black leading-none tracking-[-0.06em] text-primary/[0.055]"
          >
            {workout.letter}
          </span>
          <div className="relative">
            <div className="mb-3.5 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary" />
              <span className="metric-label text-primary">Treino de hoje</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Treino {workout.letter} · {workout.day_of_week ? DIA_LABEL[workout.day_of_week] : 'Hoje'}
            </p>
            <p className="mt-1 text-xs font-semibold text-primary">
              {TRAINING_FOCUS_LABEL[workout.session_focus as keyof typeof TRAINING_FOCUS_LABEL] ?? 'Hipertrofia'}
            </p>
            <h2 className="mt-0.5 text-3xl font-extrabold leading-tight tracking-[-0.02em]">
              {workout.name}
            </h2>
            <p className="mt-1 text-[13px] capitalize text-muted-foreground">
              {muscleNames} · {workout.workout_exercises.length} exercícios · ~{minutes} min
            </p>

            <div className="my-4 flex items-stretch gap-4">
              <div>
                <p className="font-mono text-base font-bold">{sets}</p>
                <p className="metric-label mt-1">séries</p>
              </div>
              <div className="w-px bg-input" />
              <div>
                <p className="font-mono text-base font-bold">{weekStats.count}</p>
                <p className="metric-label mt-1">na semana</p>
              </div>
              <div className="w-px bg-input" />
              <div>
                <p className="font-mono text-base font-bold">{formatVolume(weekStats.totalVolumeKg)}</p>
                <p className="metric-label mt-1">volume</p>
              </div>
            </div>

            <Link
              href={`/treino/${workout.letter}`}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-primary text-base font-bold text-primary-foreground transition-transform active:scale-[0.985]"
            >
              Ver treino
              <ArrowRight className="size-4" strokeWidth={2.4} />
            </Link>
          </div>
        </section>
      ) : (
        <section className="surface-card p-5 text-center">
          <ShieldCheck className="mx-auto size-7 text-primary" />
          <h2 className="mt-2 font-bold">Dia de recuperação</h2>
          <p className="mt-1 text-sm text-muted-foreground">Domingo é o dia planejado de descanso.</p>
        </section>
      )}

      <Link
        href="/acompanhamento"
        className="flex items-center gap-3 rounded-[14px] border border-border bg-card px-3.5 py-3"
      >
        <span className={`grid size-9 place-items-center rounded-[10px] border ${readinessGood ? 'border-[#4ad17e]/25 bg-[#4ad17e]/10' : 'border-[#ffb547]/30 bg-[#ffb547]/10'}`}>
          <span className={`size-2.5 rounded-full ${readinessGood ? 'bg-[#4ad17e]' : 'bg-[#ffb547]'}`} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold">
            {readinessGood ? 'Prontidão boa' : readinessStatus === 'stop_for_pain' ? 'Dor pede interrupção' : 'Recuperação pede atenção'}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
            {latestReadiness.data?.recommendation_reason ?? `Sono ${sleepLabel} · fadiga ${latestRecovery.data?.fatigue ?? '—'} · dor ${latestRecovery.data?.soreness ?? '—'}`}
          </span>
        </span>
        <span className="text-xs font-semibold text-primary">Check-in</span>
        <ChevronRight className="size-3.5 text-primary" />
      </Link>

      <section className="grid grid-cols-2 gap-2">
        <Link href="/alimentacao" className="surface-card p-3.5">
          <div className="flex items-center justify-between">
            <p className="metric-label">Proteína</p>
            <Sparkles className="size-3.5 text-primary" />
          </div>
          <p className="mt-2 font-mono text-base font-bold">
            {nutritionGoal.data?.protein_g ?? '—'}
            <span className="text-[11px] font-normal text-muted-foreground"> g/meta</span>
          </p>
        </Link>
        <Link href="/alimentacao" className="surface-card p-3.5">
          <div className="flex items-center justify-between">
            <p className="metric-label">Água</p>
            <Droplets className="size-3.5 text-[#5ba8ff]" />
          </div>
          <p className="mt-2 font-mono text-base font-bold">
            {(waterToday / 1000).toFixed(1).replace('.', ',')}
            <span className="text-[11px] font-normal text-muted-foreground"> / {(waterGoal / 1000).toFixed(1).replace('.', ',')} L</span>
          </p>
        </Link>
        <Link href="/progresso" className="surface-card p-3.5">
          <div className="flex items-center justify-between">
            <p className="metric-label">Peso</p>
            <Scale className="size-3.5 text-[#4ad17e]" />
          </div>
          <p className="mt-2 font-mono text-base font-bold">
            {latestWeight.data?.weight_kg ?? '—'}
            <span className="text-[11px] font-normal text-muted-foreground"> kg</span>
          </p>
        </Link>
        <Link href="/acompanhamento" className="surface-card p-3.5">
          <div className="flex items-center justify-between">
            <p className="metric-label">Sono</p>
            <Moon className="size-3.5 text-[#98a3b3]" />
          </div>
          <p className="mt-2 font-mono text-base font-bold">{sleepLabel}</p>
        </Link>
      </section>

      <section className="surface-card p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="metric-label">Últimos 7 dias</p>
          <p className="text-[11px] text-muted-foreground">
            <strong className="font-semibold text-foreground">{weekStats.count} treinos</strong> · {formatVolume(weekStats.totalVolumeKg)}
          </p>
        </div>
        <div className="flex gap-1.5">
          {weeklyDays.map((day, index) => (
            <div key={`${day.label}-${index}`} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`grid h-8 w-full place-items-center rounded-lg border text-[11px] font-bold ${
                  day.done
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : day.today
                      ? 'border-input bg-secondary text-foreground'
                      : 'border-transparent bg-secondary/40 text-muted-foreground'
                }`}
              >
                {day.done ? <Check className="size-3.5" strokeWidth={2.7} /> : '·'}
              </div>
              <span className="text-[9px] font-semibold text-muted-foreground">{day.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
