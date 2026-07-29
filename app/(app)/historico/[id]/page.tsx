import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Clock, Weight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSessionWithLogs, getPreviousSessionVolume } from '@/lib/queries/sessions'
import { formatDurationLong } from '@/lib/utils/time'
import { calcVolume, formatVolume } from '@/lib/utils/volume'

export default async function HistoricoDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const session = await getSessionWithLogs(supabase, id).catch(() => null)
  if (!session || session.user_id !== user.id) notFound()

  const workout = session.workout as { name: string; letter: string } | null

  type SetLogEntry = {
    id: string
    set_number: number
    weight_kg: number | null
    reps: number
    rpe: number | null
    workout_exercise_id: string
    workout_exercise: {
      exercise: {
        id: string
        name_pt: string
      }
    }
  }

  const logs = (session.set_logs ?? []) as SetLogEntry[]

  // Group by workout_exercise_id
  const exerciseGroups = new Map<
    string,
    { exerciseName: string; exerciseId: string; sets: SetLogEntry[] }
  >()
  for (const log of logs) {
    const wexId = log.workout_exercise_id
    if (!exerciseGroups.has(wexId)) {
      exerciseGroups.set(wexId, {
        exerciseName: log.workout_exercise.exercise.name_pt,
        exerciseId: log.workout_exercise.exercise.id,
        sets: [],
      })
    }
    exerciseGroups.get(wexId)!.sets.push(log)
  }

  const totalVolume = calcVolume(
    logs.map((l) => ({ weight_kg: l.weight_kg, reps: l.reps }))
  )

  const prevVolume = session.workout_id
    ? await getPreviousSessionVolume(supabase, user.id, session.workout_id, id)
    : null

  const volumeDiffPct =
    prevVolume && prevVolume > 0
      ? Math.round(((totalVolume - prevVolume) / prevVolume) * 100)
      : null

  const sessionData = session as {
    started_at: string
    duration_seconds: number | null
    notes: string | null
  }

  return (
    <div className="max-w-lg mx-auto pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link
            href="/historico"
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-lg leading-tight">
              Treino {workout?.letter} — {workout?.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(sessionData.started_at), "d 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <p className="text-xl font-black">{exerciseGroups.size}</p>
            <p className="text-xs text-muted-foreground">exercícios</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center flex flex-col items-center gap-1">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-bold">
              {sessionData.duration_seconds != null
                ? formatDurationLong(sessionData.duration_seconds)
                : '—'}
            </p>
            <p className="text-xs text-muted-foreground">duração</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center flex flex-col items-center gap-1">
            <Weight className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-bold">{formatVolume(totalVolume)}</p>
            <p className="text-xs text-muted-foreground">volume</p>
          </div>
        </div>

        {/* Nota da sessão */}
        {sessionData.notes && (
          <div className="rounded-xl bg-card border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Anotação</p>
            <p className="text-sm text-foreground leading-relaxed">{sessionData.notes}</p>
          </div>
        )}

        {/* Comparativo com sessão anterior */}
        {volumeDiffPct !== null && (
          <div className={`rounded-xl border p-3 text-center text-sm font-medium ${
            volumeDiffPct >= 0
              ? 'bg-primary/5 border-primary/20 text-primary'
              : 'bg-destructive/5 border-destructive/20 text-destructive'
          }`}>
            {volumeDiffPct >= 0 ? '▲' : '▼'}{' '}
            {Math.abs(volumeDiffPct)}% de volume vs último treino {workout?.letter}
          </div>
        )}

        {/* Exercise breakdown */}
        {Array.from(exerciseGroups.values()).map(
          ({ exerciseName, exerciseId, sets }) => (
            <div
              key={exerciseId}
              className="rounded-xl bg-card border border-border overflow-hidden"
            >
              <Link
                href={`/exercicios/${exerciseId}`}
                className="flex items-center justify-between px-4 py-3 border-b border-border"
              >
                <p className="font-semibold text-sm">{exerciseName}</p>
                <span className="text-xs text-primary">ver progresso →</span>
              </Link>
              <div className="px-4 py-2 space-y-1">
                {sets
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <span className="text-muted-foreground w-14">
                        Série {s.set_number}
                      </span>
                      <span className="font-medium">
                        {s.weight_kg != null ? `${s.weight_kg}kg` : '—'} ×{' '}
                        {s.reps} reps
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {s.rpe != null && (
                          <span className="mr-2 text-amber-500 font-medium">
                            RPE {s.rpe}
                          </span>
                        )}
                        {s.weight_kg != null
                          ? formatVolume(s.weight_kg * s.reps)
                          : ''}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
