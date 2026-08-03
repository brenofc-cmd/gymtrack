'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  Loader2,
  NotebookPen,
  ShieldAlert,
  SkipForward,
  Sparkles,
  TimerReset,
} from 'lucide-react'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { createClient } from '@/lib/supabase/client'
import {
  flushSyncQueue,
  getPendingSyncCount,
} from '@/lib/offline/syncQueue'
import {
  sessionElapsed,
  useSessionStore,
} from '@/lib/store/sessionStore'
import { getLoadInputConfig } from '@/lib/training/load-input'
import { calcVolume, formatVolume } from '@/lib/utils/volume'
import { formatDurationLong } from '@/lib/utils/time'
import type { WorkoutExerciseWithExercise } from '@/types/database'
import { maybeAdvanceActiveDupBlockWeek } from '@/lib/queries/dup-program'

interface FinishWorkoutSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  startedAt: string
  workoutExercises: WorkoutExerciseWithExercise[]
  bestWeights: Array<number | null>
}

export function FinishWorkoutSheet({
  open,
  onOpenChange,
  sessionId,
  startedAt,
  workoutExercises,
  bestWeights,
}: FinishWorkoutSheetProps) {
  const router = useRouter()
  const {
    sets,
    feedback,
    skippedExerciseIds,
    sessionClock,
    skipRestTimer,
    resetSession,
  } = useSessionStore()
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [duration, setDuration] = useState(0)
  const [finishError, setFinishError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const update = () => setDuration(sessionElapsed(startedAt, sessionClock))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [open, sessionClock, startedAt])

  const allSets = Object.values(sets).flat()
  const workSets = allSets.filter((set) => !set.is_warmup)
  const warmupCount = allSets.length - workSets.length
  const targetSets = workoutExercises.reduce((sum, exercise) => sum + exercise.target_sets, 0)
  const pendingSets = Math.max(0, targetSets - workSets.length)
  const completedExercises = workoutExercises.filter((exercise) =>
    (sets[exercise.id] ?? []).filter((set) => !set.is_warmup).length >= exercise.target_sets
  ).length
  const painEntries = workoutExercises.filter((exercise) => {
    const pain = feedback[exercise.id]?.painLevel
    return pain === 'moderada' || pain === 'forte'
  })
  const observationCount = workoutExercises.filter((exercise) => feedback[exercise.id]?.notes.trim()).length
  const records = workoutExercises.filter((exercise, index) => {
    const config = getLoadInputConfig(exercise.exercise, exercise.notes)
    const previousBest = bestWeights[index]
    if (!config.acceptsLoad || previousBest == null) return false
    return (sets[exercise.id] ?? []).some((set) =>
      !set.is_warmup && set.weight_kg != null && (
        config.lowerIsHarder ? set.weight_kg < previousBest : set.weight_kg > previousBest
      )
    )
  }).length
  const totalVolume = calcVolume(workSets)

  async function finish() {
    setLoading(true)
    setFinishError(null)
    if (!navigator.onLine) {
      setFinishError('Conecte-se à internet para encerrar a sessão com segurança. Suas séries offline continuam guardadas.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    await flushSyncQueue(supabase)
    if (getPendingSyncCount() > 0) {
      setFinishError('Ainda existem alterações aguardando sincronização. Tente novamente em alguns instantes.')
      setLoading(false)
      return
    }

    const finalDuration = sessionElapsed(startedAt, sessionClock)
    const { error } = await supabase
      .from('workout_sessions')
      .update({
        finished_at: new Date().toISOString(),
        duration_seconds: finalDuration,
        notes: notes.trim() || null,
      })
      .eq('id', sessionId)

    if (error) {
      setFinishError('Não foi possível finalizar agora. Nenhum dado foi apagado; tente novamente.')
      setLoading(false)
      return
    }

    await maybeAdvanceActiveDupBlockWeek(supabase).catch(() => null)

    skipRestTimer()
    resetSession(sessionId)
    toast.success('Treino finalizado', {
      description: `${workSets.length} séries · ${formatVolume(totalVolume)} de volume`,
    })
    router.push(`/historico/${sessionId}`)
    router.refresh()
  }

  const statItems = [
    { icon: TimerReset, value: formatDurationLong(duration), label: 'Duração' },
    { icon: CheckCircle2, value: `${completedExercises}/${workoutExercises.length}`, label: 'Exercícios' },
    { icon: CheckCircle2, value: workSets.length.toString(), label: 'Séries válidas' },
    { icon: Flame, value: warmupCount.toString(), label: 'Aquecimentos' },
    { icon: Sparkles, value: records.toString(), label: 'Recordes' },
    { icon: SkipForward, value: skippedExerciseIds.length.toString(), label: 'Pulados' },
  ]

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => !loading && onOpenChange(next)}
      title="Resumo do treino"
      description="Revise a sessão antes de finalizar."
    >
      {pendingSets > 0 && (
        <div className="mb-3 flex gap-2 rounded-xl bg-[var(--warn-tint)]/10 px-3 py-2.5 text-xs leading-relaxed text-[var(--warn-text)]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Existem {pendingSets} {pendingSets === 1 ? 'série não concluída' : 'séries não concluídas'}.
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {statItems.map(({ icon: Icon, value, label }) => (
          <div key={label} className="rounded-xl bg-secondary/45 px-2 py-3 text-center">
            <Icon className="mx-auto size-3.5 text-primary" />
            <p className="mt-1 truncate font-mono text-base font-black">{value}</p>
            <p className="text-[9px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl bg-secondary/35 px-3 py-2.5">
        <p className="text-xs text-muted-foreground">Volume válido</p>
        <p className="mt-0.5 text-xl font-black">{formatVolume(totalVolume)}</p>
      </div>

      {painEntries.length > 0 && (
        <div className="mt-3 flex gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <span>Dor moderada/forte: {painEntries.map((exercise) => exercise.exercise.name_pt).join(', ')}.</span>
        </div>
      )}

      {observationCount > 0 && (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <NotebookPen className="size-4" /> {observationCount} {observationCount === 1 ? 'exercício com observação' : 'exercícios com observações'}.
        </p>
      )}

      <label htmlFor="session-notes" className="mt-4 block text-xs font-bold">Observação da sessão</label>
      <textarea
        id="session-notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={2}
        maxLength={500}
        disabled={loading}
        placeholder="Como foi o treino? (opcional)"
        className="mt-1.5 w-full resize-none rounded-xl border border-input bg-background px-3 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
      />

      {finishError && (
        <p role="alert" className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {finishError}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={loading}
          className="min-h-12 rounded-xl border border-input text-sm font-bold"
        >
          Voltar ao treino
        </button>
        <button
          type="button"
          onClick={() => void finish()}
          disabled={loading}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {pendingSets > 0 ? 'Finalizar mesmo assim' : 'Finalizar treino'}
        </button>
      </div>
    </BottomSheet>
  )
}
