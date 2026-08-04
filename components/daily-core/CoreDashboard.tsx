'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Activity, ArrowRight, BarChart3, Building2, CalendarDays, Check, ChevronRight, CircleGauge, Dumbbell, HeartPulse, Home, Moon, Settings, ShieldCheck, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { localDateISO, nextSession, resolveCoreExercise, streakStats, type CoreExercisePlan, type CoreExercisePresentation, type CoreExerciseWithVariations } from '@/lib/daily-core/logic'
import { CoreExerciseImage } from './CoreExerciseImage'
import type {
  DailyCoreDayRow,
  DailyCorePainCheck,
  DailyCorePainLogRow,
  DailyCoreProgressionRow,
  DailyCoreSessionRow,
  DailyCoreSetRow,
} from '@/types/database'

interface CoreDashboardProps {
  userId: string
  today: DailyCoreDayRow
  allDays: DailyCoreDayRow[]
  plan: CoreExercisePlan[]
  exerciseCatalog: CoreExerciseWithVariations[]
  sessions: DailyCoreSessionRow[]
  sets: DailyCoreSetRow[]
  pain: DailyCorePainLogRow[]
  progressions: DailyCoreProgressionRow[]
  adaptationWeek: number
}

const TYPE_META = {
  hipertrofia: { label: 'Hipertrofia', icon: Dumbbell, className: 'border-primary/30 bg-primary/10 text-primary' },
  estabilidade: { label: 'Estabilidade', icon: ShieldCheck, className: 'border-[var(--info-tint)]/30 bg-[var(--info-tint)]/10 text-[var(--info-text)]' },
  recuperacao: { label: 'Recuperação', icon: HeartPulse, className: 'border-[var(--mint-text)]/30 bg-[var(--mint-text)]/10 text-[var(--mint-text)]' },
  descanso: { label: 'Descanso', icon: Moon, className: 'border-border bg-secondary text-muted-foreground' },
} as const

function startOfWeek(date = new Date()) {
  const result = new Date(date)
  const day = result.getDay() || 7
  result.setDate(result.getDate() - day + 1)
  result.setHours(0, 0, 0, 0)
  return result
}

export function CoreDashboard({ userId, today, allDays, plan, exerciseCatalog, sessions, sets, pain, progressions, adaptationWeek }: CoreDashboardProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [painChoice, setPainChoice] = useState<DailyCorePainCheck>('sem_dor')
  const todayISO = localDateISO()
  const todaySession = sessions.find((session) => session.session_date === todayISO)
  const meta = TYPE_META[today.session_type]
  const Icon = meta.icon
  const weekStart = startOfWeek()
  const weekSessions = sessions.filter((session) => new Date(`${session.session_date}T12:00:00`) >= weekStart && session.status === 'concluido')
  const gymSessions = weekSessions.filter((session) => session.location === 'academia').length
  const homeSessions = weekSessions.filter((session) => session.location === 'casa').length
  const volume = sets.filter((set) => weekSessions.some((session) => session.id === set.session_id)).reduce((total, set) => total + (set.weight_kg ?? 0) * (set.reps ?? 0), 0)
  const streak = streakStats(sessions)
  const next = nextSession(allDays, today.day_of_week)
  const completedThisMonth = sessions.filter((session) => session.status === 'concluido' && session.session_date.slice(0, 7) === todayISO.slice(0, 7)).length
  const elapsedDays = Math.max(1, Number(todayISO.slice(8, 10)))
  const expectedThisMonth = Math.max(1, Math.round((elapsedDays / 7) * 4))
  const completionRate = Math.min(100, Math.round((completedThisMonth / expectedThisMonth) * 100))
  const fourWeeks = useMemo(() => {
    return [3, 2, 1, 0].map((weeksAgo) => {
      const end = new Date()
      end.setDate(end.getDate() - weeksAgo * 7)
      const start = startOfWeek(end)
      const finish = new Date(start)
      finish.setDate(finish.getDate() + 7)
      const count = sessions.filter((session) => {
        const date = new Date(`${session.session_date}T12:00:00`)
        return session.status === 'concluido' && date >= start && date < finish
      }).length
      return { label: `S${4 - weeksAgo}`, count }
    })
  }, [sessions])
  const bestExerciseId = [...new Set(sets.map((set) => set.exercise_id))]
    .map((exerciseId) => ({ exerciseId, count: sets.filter((set) => set.exercise_id === exerciseId).length }))
    .sort((a, b) => b.count - a.count)[0]?.exerciseId
  const bestExercise = exerciseCatalog.find((exercise) => exercise.id === bestExerciseId)?.name ?? 'Sem dados ainda'
  const nextProgression = progressions.find((item) => item.status === 'progredir') ?? progressions[0]
  const resolvedPlan = plan.map((exercise) => ({ exercise, presentation: resolveCoreExercise(exercise) }))
  const heroExercise = resolvedPlan[0]?.presentation

  async function skipToday() {
    setSaving(true)
    const now = new Date().toISOString()
    const supabase = createClient()
    const { error } = await supabase.from('daily_core_sessions').upsert({
      id: todaySession?.id ?? crypto.randomUUID(),
      user_id: userId,
      day_of_week: today.day_of_week,
      session_date: todayISO,
      session_type: today.session_type,
      status: 'interrompido',
      completion_kind: 'pulado',
      adaptation_week: adaptationWeek,
      location: today.location === 'academia' ? 'academia' : 'casa',
      routine_version: 2,
      started_at: null,
      finished_at: now,
      duration_seconds: 0,
      client_updated_at: now,
    }, { onConflict: 'user_id,session_date' })
    setSaving(false)
    if (error) toast.error('Não foi possível pular esta sessão.')
    else { toast.success('Sessão pulada. O DUP principal não foi alterado.'); router.refresh() }
  }

  async function logSundayPain() {
    setSaving(true)
    const { error } = await createClient().from('daily_core_pain_logs').insert({ user_id: userId, logged_on: todayISO, pain_level: painChoice })
    setSaving(false)
    if (error) toast.error('Não foi possível salvar o check-in.')
    else { toast.success('Check-in de recuperação salvo.'); router.refresh() }
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[22px] border border-border bg-card">
        {heroExercise && <CoreExerciseImage src={heroExercise.imageUrl} alt={heroExercise.imageAlt} priority className="aspect-[16/9] w-full" />}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="metric-label text-primary">Sessão de hoje</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight">{today.name}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{today.objective}</p>
            </div>
            <span className={`grid size-11 shrink-0 place-items-center rounded-2xl border ${meta.className}`}><Icon className="size-5" /></span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
            <span className={`rounded-full border px-2.5 py-1 font-semibold ${meta.className}`}>{meta.label}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-input bg-secondary px-2.5 py-1">{today.location === 'academia' ? <Building2 className="size-3" /> : today.location === 'casa' ? <Home className="size-3" /> : <Moon className="size-3" />}{today.location === 'academia' ? 'Academia' : today.location === 'casa' ? 'Em casa' : 'Descanso'}</span>
            <span className="rounded-full border border-input bg-secondary px-2.5 py-1">{today.duration_min === today.duration_max ? `${today.duration_min} min` : `${today.duration_min}–${today.duration_max} min`}</span>
            <span className="rounded-full border border-input bg-secondary px-2.5 py-1">{plan.length} exercício{plan.length === 1 ? '' : 's'}</span>
          </div>
          {!today.is_rest && todaySession?.status !== 'concluido' && todaySession?.completion_kind !== 'pulado' && (
            <Link href="/abdomen/sessao" className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
              {todaySession?.status === 'em_andamento' ? 'Continuar rotina' : `Começar treino de ${today.duration_min}–${today.duration_max} min`} <ArrowRight className="size-4" />
            </Link>
          )}
          {todaySession?.status === 'concluido' && (
            <div className="mt-5 flex h-12 items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-primary/8 text-sm font-bold text-primary"><Check className="size-4" /> Rotina concluída</div>
          )}
          {todaySession?.completion_kind === 'pulado' && <div className="mt-5 rounded-2xl border border-input bg-secondary p-3 text-center text-sm font-bold text-muted-foreground">Sessão pulada hoje · DUP mantido</div>}
          {!today.is_rest && !todaySession && (
            <button type="button" disabled={saving} onClick={skipToday} className="mt-2 h-11 w-full rounded-xl text-xs font-semibold text-muted-foreground">Não consigo fazer hoje — pular só o core</button>
          )}
        </div>
      </section>

      {resolvedPlan.length > 0 && (
        <section aria-labelledby="today-exercises-title">
          <div className="mb-2.5 flex items-end justify-between gap-3">
            <div><p className="metric-label text-primary">Roteiro visual</p><h3 id="today-exercises-title" className="mt-1 text-base font-extrabold">Exercícios de hoje</h3></div>
            <span className="text-[10px] text-muted-foreground">{resolvedPlan.length} etapa{resolvedPlan.length === 1 ? '' : 's'}</span>
          </div>
          <div className="grid gap-2.5">
            {resolvedPlan.map(({ exercise, presentation }, index) => (
              <article key={exercise.id} className="surface-card flex min-h-28 overflow-hidden">
                <CoreExerciseImage src={presentation.imageUrl} alt={presentation.imageAlt} className="w-32 shrink-0 sm:w-40" sizes="(max-width: 520px) 128px, 160px" />
                <div className="flex min-w-0 flex-1 flex-col justify-center p-3.5">
                  <p className="metric-label text-primary">{index + 1} de {resolvedPlan.length}</p>
                  <h4 className="mt-1 text-sm font-extrabold leading-tight">{presentation.name}</h4>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">{exercise.effectiveSets} séries · {formatCoreTarget(presentation)}</p>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">{presentation.shortCue}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="surface-card p-4">
        <p className="metric-label text-primary">Plano semanal canônico</p>
        <h3 className="mt-1 text-sm font-extrabold">2 sessões em casa + 2 finalizadores na academia</h3>
        <div className="mt-3 grid gap-2">
          {allDays.filter((item) => !item.is_rest).map((item) => (
            <div key={item.day_of_week} className="flex items-center gap-3 rounded-xl bg-secondary/55 p-3">
              <span className="grid size-9 place-items-center rounded-lg bg-background font-mono text-xs font-black">{['', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'][item.day_of_week]}</span>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{item.name}</p><p className="text-[10px] text-muted-foreground">{item.duration_min}–{item.duration_max} min</p></div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">{item.location === 'academia' ? <Building2 className="size-3" /> : <Home className="size-3" />}{item.location === 'academia' ? 'Academia' : 'Em casa'}</span>
            </div>
          ))}
        </div>
      </section>

      {adaptationWeek > 0 && adaptationWeek <= 2 && (
        <section className="rounded-2xl border border-[var(--info-tint)]/25 bg-[var(--info-tint)]/8 p-4">
          <div className="flex items-center gap-2 text-[var(--info-text)]"><CircleGauge className="size-4" /><h3 className="text-sm font-bold">Adaptação · semana {adaptationWeek} de 2</h3></div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">Mantenha as séries prescritas, use cerca de 3 RIR nos exercícios que controlam esforço e priorize aprender o movimento.</p>
        </section>
      )}

      {today.is_rest && (
        <section className="surface-card p-5 text-center">
          <Moon className="mx-auto size-7 text-muted-foreground" />
          <h3 className="mt-2 font-bold">Hoje é dia de recuperação.</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">O core também precisa se recuperar. Consulte abaixo a próxima sessão programada; pular o core nunca muda a sequência do DUP principal.</p>
          <label className="mt-4 block text-left text-xs font-semibold">Como você está hoje?</label>
          <select value={painChoice} onChange={(event) => setPainChoice(event.target.value as DailyCorePainCheck)} className="mt-1.5 h-12 w-full rounded-xl border border-input bg-secondary px-3 text-sm">
            <option value="sem_dor">Sem dor</option><option value="dor_muscular_leve">Dor muscular leve</option><option value="dor_muscular_moderada">Dor muscular moderada</option><option value="dor_forte">Dor forte</option><option value="dor_lombar">Dor lombar</option>
          </select>
          <button type="button" onClick={logSundayPain} disabled={saving} className="mt-3 h-12 w-full rounded-xl bg-secondary text-sm font-bold disabled:opacity-60">Registrar recuperação</button>
        </section>
      )}

      <section className="grid grid-cols-2 gap-2" aria-label="Resumo de consistência">
        <Metric label="Sequência atual" value={`${streak.current} sessões`} icon={<Sparkles className="size-4 text-primary" />} />
        <Metric label="Conclusão mensal" value={`${completionRate}%`} icon={<Check className="size-4 text-[var(--mint-text)]" />} />
      </section>

      <details className="surface-card overflow-hidden">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2"><BarChart3 className="size-4 text-primary" /> Ver progresso detalhado</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </summary>
        <div className="space-y-3 border-t border-border p-3">
          <section className="grid grid-cols-2 gap-2">
            <Metric label="Melhor sequência" value={`${streak.best} sessões`} icon={<CalendarDays className="size-4 text-[var(--info-tint)]" />} />
            <Metric label="Academia na semana" value={`${gymSessions}/2`} icon={<Dumbbell className="size-4 text-primary" />} />
            <Metric label="Em casa na semana" value={`${homeSessions}/2`} icon={<ShieldCheck className="size-4 text-[var(--info-text)]" />} />
            <Metric label="Volume com carga" value={volume > 0 ? `${Math.round(volume)} kg` : '—'} icon={<Activity className="size-4 text-[var(--warn-tint)]" />} />
          </section>

          <section className="rounded-2xl border border-border bg-background/35 p-4">
            <div className="flex items-center justify-between"><h3 className="text-sm font-bold">Últimas quatro semanas</h3><span className="metric-label">sessões</span></div>
            <div className="mt-4 flex h-24 items-end gap-3">
              {fourWeeks.map((week) => (
                <div key={week.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="font-mono text-xs font-bold">{week.count}</span>
                  <div className="w-full rounded-t-lg bg-primary/80" style={{ height: `${Math.max(8, (week.count / 4) * 64)}px` }} />
                  <span className="text-[10px] text-muted-foreground">{week.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="divide-y divide-sidebar-border rounded-2xl border border-border bg-background/35 px-4">
            <InfoRow label="Maior evolução" value={bestExercise} />
            <InfoRow label="Próxima progressão" value={nextProgression?.reason ?? 'Conclua uma sessão forte para receber uma sugestão.'} />
            <InfoRow label="Dor recente" value={pain[0] ? pain[0].pain_level.replaceAll('_', ' ') : 'Nenhuma registrada'} />
            <InfoRow label="Próxima sessão" value={next?.name ?? '—'} />
          </section>

          <section className="rounded-2xl border border-border bg-background/35 p-4">
            <div className="flex items-center justify-between"><h3 className="text-sm font-bold">Histórico por exercício</h3><span className="metric-label">melhores marcas</span></div>
            <div className="mt-3 divide-y divide-sidebar-border">
              {exerciseCatalog.filter((exercise) => sets.some((set) => set.exercise_id === exercise.id)).slice(0, 5).map((exercise) => {
                const exerciseSets = sets.filter((set) => set.exercise_id === exercise.id)
                const maxReps = Math.max(0, ...exerciseSets.map((set) => set.reps ?? 0))
                const maxWeight = Math.max(0, ...exerciseSets.map((set) => set.weight_kg ?? 0))
                const maxTime = Math.max(0, ...exerciseSets.map((set) => set.duration_seconds ?? 0))
                return <div key={exercise.id} className="flex items-center justify-between gap-3 py-3"><span className="text-xs font-semibold">{exercise.name}</span><span className="shrink-0 font-mono text-[10px] text-muted-foreground">{maxReps ? `${maxReps} reps` : ''}{maxReps && (maxWeight || maxTime) ? ' · ' : ''}{maxWeight ? `${maxWeight} kg` : maxTime ? `${maxTime} s` : ''}</span></div>
              })}
              {!sets.length && <p className="py-4 text-center text-xs text-muted-foreground">Conclua a primeira sessão para iniciar o histórico.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-background/35 p-4">
            <div className="flex items-center justify-between"><h3 className="text-sm font-bold">Calendário de consistência</h3><span className="metric-label">28 dias</span></div>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {Array.from({ length: 28 }, (_, index) => {
                const date = new Date(); date.setDate(date.getDate() - (27 - index)); const iso = localDateISO(date)
                const session = sessions.find((item) => item.session_date === iso)
                return <span key={iso} title={iso} className={`aspect-square rounded-md border ${session?.status === 'concluido' ? 'border-primary/35 bg-primary/70' : date.getDay() === 0 ? 'border-border bg-secondary/60' : 'border-border bg-card'}`} />
              })}
            </div>
          </section>
        </div>
      </details>

      <details className="surface-card p-4">
        <summary className="cursor-pointer text-sm font-bold">Por que esta rotina é curta e separada do DUP?</summary>
        <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
          <p>Terça e sexta trabalham controle motor em casa. Quarta e sábado somam apenas seis séries diretas semanais de hipertrofia, distribuídas em dois finalizadores curtos na academia.</p>
          <p>Se faltar tempo, termine o exercício principal do DUP e marque somente o core como não feito. A sequência dos treinos A–F permanece intacta.</p>
          <p>Exercícios abdominais não removem gordura localizada. A aparência depende de desenvolvimento muscular, alimentação, percentual de gordura e genética.</p>
          <p>O shape em V depende principalmente de dorsais, deltoides laterais, peitoral superior e cintura proporcional. Esta rotina complementa, mas não substitui o restante do programa.</p>
        </div>
      </details>

      <Link href="/abdomen/configuracoes" className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-input bg-secondary text-sm font-semibold"><Settings className="size-4" /> Preferências e lembretes <ChevronRight className="size-4" /></Link>
      <p className="px-2 text-center text-[10.5px] leading-relaxed text-muted-foreground">Esta rotina apresenta orientações gerais de exercício. Ela não substitui avaliação de médico ou profissional de educação física. Interrompa o exercício caso sinta dor forte, dor lombar ou desconforto progressivo.</p>
    </div>
  )
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="surface-card p-3.5"><div className="flex items-center justify-between"><span className="metric-label">{label}</span>{icon}</div><p className="mt-2 font-mono text-base font-bold">{value}</p></div>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="py-3"><p className="metric-label">{label}</p><p className="mt-1 text-xs leading-relaxed text-foreground">{value}</p></div>
}

function formatCoreTarget(presentation: CoreExercisePresentation) {
  if (presentation.measureType === 'tempo') {
    return `${presentation.targetSecondsMin}–${presentation.targetSecondsMax} s${presentation.perSide ? ' por lado' : ''}`
  }
  const unit = presentation.measureType === 'respiracoes' ? 'respirações' : 'reps'
  return `${presentation.targetRepsMin}–${presentation.targetRepsMax} ${unit}${presentation.perSide ? ' por lado' : ''}`
}
