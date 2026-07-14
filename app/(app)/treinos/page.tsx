import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, ChevronRight, Dumbbell } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkouts, getSuggestedWorkout } from '@/lib/queries/workouts'
import { getLastSessionsPerWorkout } from '@/lib/queries/sessions'
import { DIA_LABEL } from '@/lib/routine/rotina-v2'

export default async function TreinosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const [workouts, suggested, lastSessions] = await Promise.all([
    getWorkouts(admin, user.id),
    getSuggestedWorkout(admin, user.id),
    getLastSessionsPerWorkout(admin, user.id),
  ])
  const lastByWorkout = new Map(lastSessions.map((session) => [session.workout_id, session]))

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 py-5 lg:py-7">
      <header className="mb-5">
        <h1 className="text-[22px] font-extrabold tracking-tight">Treino</h1>
        <p className="mt-1 text-[12.5px] text-muted-foreground">Rotina PPL · 6 dias por semana · v3</p>
      </header>

      {workouts.length === 0 ? (
        <div className="surface-card px-5 py-10 text-center">
          <Dumbbell className="mx-auto size-8 text-primary" />
          <h2 className="mt-3 font-bold">Nenhuma rotina ativa</h2>
          <p className="mt-1 text-sm text-muted-foreground">Conclua o onboarding para preparar sua ficha.</p>
          <Link href="/onboarding" className="mt-4 inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">
            Configurar rotina
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {workouts.map((workout) => {
            const isToday = workout.letter === suggested
            const last = lastByWorkout.get(workout.id)
            return (
              <Link
                key={workout.id}
                href={`/treino/${workout.letter}`}
                className={`flex items-center gap-3 rounded-2xl border bg-card p-3.5 transition-colors ${isToday ? 'border-primary/40' : 'border-border hover:border-input'}`}
              >
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl border text-lg font-extrabold ${isToday ? 'border-primary/30 bg-primary/10 text-primary' : 'border-input bg-secondary text-muted-foreground'}`}>
                  {workout.letter}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">
                    {workout.name}
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      · {workout.day_of_week ? DIA_LABEL[workout.day_of_week].replace('-feira', '') : ''}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">{workout.objective}</span>
                  <span className="mt-1 block font-mono text-[10.5px] text-muted-foreground">
                    {workout.workout_exercises.length} exercícios
                    {last?.finished_at ? ' · já realizado' : ' · sem registro'}
                  </span>
                </span>
                {isToday ? (
                  <span className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">Hoje</span>
                ) : last?.finished_at ? (
                  <CheckCircle2 className="size-4 shrink-0 text-[#4ad17e]" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
