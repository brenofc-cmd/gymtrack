import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import {
  getExercise,
  getExerciseProgressHistory,
  getExercisePR,
  getExerciseTrendSessions,
} from '@/lib/queries/exercises'
import { analyzeTrend } from '@/lib/progression/trend'
import { getLoadInputConfig } from '@/lib/training/load-input'
import { ExerciseTrendCard } from '@/components/progress/ExerciseTrendCard'
import { ProgressChart } from '@/components/exercise/ProgressChart'
import { ExerciseAnimation } from '@/components/exercise/ExerciseAnimation'
import { exerciseDetailBackHref } from '@/lib/navigation/exercise-detail'

export default async function ExercicioPage(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string; workout?: string; workoutSource?: string }>
}) {
  const { id } = await props.params
  const detailContext = await props.searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const exercise = await getExercise(supabase, id).catch(() => null)
  if (!exercise) notFound()

  const [history, pr, trend4, trend6, trend8] = await Promise.all([
    getExerciseProgressHistory(supabase, id, user.id),
    getExercisePR(supabase, id, user.id),
    getExerciseTrendSessions(supabase, id, user.id, 4).catch(() => []),
    getExerciseTrendSessions(supabase, id, user.id, 6).catch(() => []),
    getExerciseTrendSessions(supabase, id, user.id, 8).catch(() => []),
  ])

  const trends = {
    4: analyzeTrend(trend4, 4),
    6: analyzeTrend(trend6, 6),
    8: analyzeTrend(trend8, 8),
  } as const
  const backHref = exerciseDetailBackHref(detailContext)

  const MUSCLE_LABELS: Record<string, string> = {
    peito: 'Peitoral',
    ombro: 'Ombro',
    'tríceps': 'Tríceps',
    'bíceps': 'Bíceps',
    costas: 'Costas',
    'quadríceps': 'Quadríceps',
    isquiotibiais: 'Isquiotibiais',
    'panturrilha': 'Panturrilha',
    'abdômen': 'Abdômen',
    glúteos: 'Glúteos',
  }

  return (
    <div className="max-w-lg mx-auto pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href={backHref} aria-label="Voltar" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base leading-tight truncate">
            {exercise.name_pt}
          </h1>
        </div>
      </div>

      <div className="space-y-4">
        {/* Exercise photo */}
        <div className="relative w-full aspect-square bg-zinc-900">
          <ExerciseAnimation
            name={exercise.name_pt}
            primaryMuscle={exercise.muscle_group}
            movementPattern={exercise.movement_pattern}
            mediaUrl={exercise.gif_url}
          />
        </div>

        <div className="px-4 space-y-4">
          {/* Metadata */}
          <div className="flex flex-wrap gap-2">
            {exercise.muscle_group && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                {MUSCLE_LABELS[exercise.muscle_group] ?? exercise.muscle_group}
              </span>
            )}
            {exercise.equipment && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                {exercise.equipment}
              </span>
            )}
          </div>

          {/* Recorde pessoal */}
          {pr && (pr.maxWeight !== null || pr.maxReps > 0) && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-amber-500">Recorde pessoal</h2>
              </div>
              <div className="flex gap-4 flex-wrap">
                {pr.maxWeight !== null && (
                  <div>
                    <p className="text-2xl font-black">{pr.maxWeight} kg</p>
                    <p className="text-xs text-muted-foreground">maior peso</p>
                  </div>
                )}
                {pr.maxReps > 0 && (
                  <div>
                    <p className="text-2xl font-black">{pr.maxReps} reps</p>
                    <p className="text-xs text-muted-foreground">maior número de reps</p>
                  </div>
                )}
                {pr.estimated1RM !== null && (
                  <div>
                    <p className="text-2xl font-black">~{pr.estimated1RM} kg</p>
                    <p className="text-xs text-muted-foreground">e1RM seguro (não é teste máximo)</p>
                  </div>
                )}
              </div>
              {pr.achievedAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Último PR em{' '}
                  {format(new Date(pr.achievedAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              )}
            </div>
          )}

          <ExerciseTrendCard trends={trends} loadConfig={getLoadInputConfig(exercise)} />

          {/* Progress chart */}
          {history.length > 0 && (
            <div className="rounded-xl bg-card border border-border p-4 space-y-2">
              <h2 className="text-sm font-semibold">Progresso de peso</h2>
              <ProgressChart data={history} />
            </div>
          )}

          {/* Instructions */}
          {exercise.instructions && exercise.instructions.length > 0 && (
            <div className="rounded-xl bg-card border border-border p-4 space-y-3">
              <h2 className="text-sm font-semibold">Como executar</h2>
              <ol className="space-y-2">
                {exercise.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
