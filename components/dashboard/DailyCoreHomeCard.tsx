import Link from 'next/link'
import { ArrowRight, Check, Dumbbell, HeartPulse, Moon, ShieldCheck } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { coreWeekday, localDateISO, nextSession, streakStats } from '@/lib/daily-core/logic'
import type { DailyCoreSessionRow } from '@/types/database'

const META = {
  hipertrofia: { label: 'Forte', icon: Dumbbell, className: 'text-primary' },
  estabilidade: { label: 'Leve', icon: ShieldCheck, className: 'text-[#78b9ff]' },
  recuperacao: { label: 'Recuperação', icon: HeartPulse, className: 'text-[#62dc91]' },
  descanso: { label: 'Descanso', icon: Moon, className: 'text-muted-foreground' },
} as const

export async function DailyCoreHomeCard({ userId }: { userId: string }) {
  const supabase = createAdminClient()
  const weekday = coreWeekday()
  const todayISO = localDateISO()
  const [{ data: days, error }, { data: exercises }, { data: preference }, { data: todaySession }, { data: sessions }] = await Promise.all([
    supabase.from('daily_core_days').select('*').order('day_of_week'),
    supabase.from('daily_core_exercises').select('id, slug').eq('day_of_week', weekday),
    supabase.from('daily_core_preferences').select('has_ab_wheel').eq('user_id', userId).maybeSingle(),
    supabase.from('daily_core_sessions').select('*').eq('user_id', userId).eq('session_date', todayISO).maybeSingle(),
    supabase.from('daily_core_sessions').select('*').eq('user_id', userId).order('session_date', { ascending: false }).limit(60),
  ])
  const day = days?.find((item) => item.day_of_week === weekday)
  if (error || !day) return null
  const meta = META[day.session_type]
  const Icon = meta.icon
  const streak = streakStats((sessions ?? []) as DailyCoreSessionRow[])
  const next = nextSession(days ?? [], weekday)
  const exerciseCount = (exercises ?? []).filter((exercise) => exercise.slug !== (preference?.has_ab_wheel ? 'prancha-longa' : 'ab-wheel')).length
  const status = todaySession?.status === 'concluido' ? 'Concluído' : todaySession?.status === 'em_andamento' ? 'Em andamento' : 'Não iniciado'
  return (
    <section className="rounded-[20px] border border-primary/20 bg-gradient-to-br from-primary/10 to-card p-5">
      <div className="flex items-start justify-between gap-3"><div><p className="metric-label text-primary">Abdômen Diário</p><h2 className="mt-1 text-xl font-extrabold">{day.name}</h2><p className="mt-1 text-xs text-muted-foreground">{day.duration_min === day.duration_max ? `${day.duration_min} min` : `${day.duration_min}–${day.duration_max} min`} · {exerciseCount} exercício{exerciseCount === 1 ? '' : 's'} · {status}</p></div><span className={`grid size-10 place-items-center rounded-xl bg-background/60 ${meta.className}`}><Icon className="size-5" /></span></div>
      <div className="mt-4 flex items-center justify-between text-[11px]"><span className={`font-semibold ${meta.className}`}>{meta.label}</span><span className="text-muted-foreground">Sequência: <strong className="text-foreground">{streak.current} dias</strong></span></div>
      <p className="mt-1 text-[10px] text-muted-foreground">Próxima: <strong className="font-semibold text-foreground">{next?.name ?? '—'}</strong></p>
      <Link href="/abdomen" className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground">{todaySession?.status === 'concluido' ? <Check className="size-4" /> : null}{todaySession?.status === 'concluido' ? 'Ver dashboard' : 'Iniciar rotina'}<ArrowRight className="size-4" /></Link>
    </section>
  )
}
