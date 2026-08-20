import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight, Dumbbell } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getWorkouts, getSuggestedWorkout } from '@/lib/queries/workouts'
import { getLastSessionsPerWorkout } from '@/lib/queries/sessions'
import { ROUTINE_VERSION as DAVID_LAID_VERSION } from '@/lib/routine/david-laid-gymshark-exact-v7'

export default async function TreinosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [workouts, suggested, lastSessions] = await Promise.all([
    getWorkouts(supabase, user.id),
    getSuggestedWorkout(supabase, user.id),
    getLastSessionsPerWorkout(supabase, user.id),
  ])
  const lastByWorkout = new Map(lastSessions.map((session) => [session.workout_id, session]))
  const isDavidLaid = workouts[0]?.routine_version === DAVID_LAID_VERSION

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 py-5 lg:py-7">
      <header className="mb-5">
        {isDavidLaid ? (
          <>
            <h1 className="text-[22px] font-extrabold tracking-tight">David Laid — DUP Powerbuilding</h1>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Sequência: Legs 1 → Push 1 → Pull 1 → Legs 2 → Push 2 → Pull 2
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--faint)]">A sequência continua de onde parou.</p>
          </>
        ) : (
          <>
            <h1 className="text-[22px] font-extrabold tracking-tight">Treino</h1>
            <p className="mt-1 text-[12.5px] text-muted-foreground">A sequência continua de onde parou.</p>
          </>
        )}
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
                href={`/treino/${workout.letter}?from=treinos`}
                className={`flex items-center gap-3 rounded-[18px] bg-card p-3 gt-shadow transition-shadow ${isToday ? 'ring-1 ring-primary/30' : ''}`}
              >
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl text-[17px] font-extrabold ${isToday ? 'bg-accent text-primary' : 'bg-secondary text-foreground'}`}>
                  {workout.letter}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{workout.name}</span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">{workout.objective}</span>
                  <span className="mt-[3px] block text-[10.5px] text-[var(--faint)]">
                    {workout.workout_exercises.length} exercícios
                    {last?.finished_at ? ' · já realizado' : ' · sem registro'}
                  </span>
                </span>
                {isToday ? (
                  <span className="shrink-0 rounded-full bg-primary px-2.5 py-1.5 text-[11px] font-extrabold text-primary-foreground">
                    Próximo
                  </span>
                ) : last?.finished_at ? (
                  <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1.5 text-[11px] font-extrabold text-[var(--body-soft)]">
                    Feito
                  </span>
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-[var(--chevron)]" />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
