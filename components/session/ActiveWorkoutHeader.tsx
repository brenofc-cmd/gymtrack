'use client'

import { useEffect, useState } from 'react'
import { Pause, Play, TimerReset, X } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import {
  sessionElapsed,
  useSessionStore,
} from '@/lib/store/sessionStore'
import { formatDuration } from '@/lib/utils/time'
import { WorkoutSaveStatus } from './WorkoutSaveStatus'

interface ActiveWorkoutHeaderProps {
  startedAt: string
  workoutName: string
  workoutLetter: string
  completedSets: number
  totalSets: number
  onExit: () => void
  onFinish: () => void
}

export function ActiveWorkoutHeader({
  startedAt,
  workoutName,
  workoutLetter,
  completedSets,
  totalSets,
  onExit,
  onFinish,
}: ActiveWorkoutHeaderProps) {
  const { sessionClock, pauseSessionClock, resumeSessionClock } = useSessionStore()
  const [now, setNow] = useState(() => Date.now())
  const [clockOpen, setClockOpen] = useState(false)
  const paused = sessionClock.pausedAt != null
  const elapsed = sessionElapsed(startedAt, sessionClock, now)

  useEffect(() => {
    if (paused) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [paused])

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-sidebar-border bg-sidebar/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[84px] max-w-3xl items-center gap-2 px-3 py-2 sm:px-4">
          <button
            type="button"
            onClick={onExit}
            aria-label="Fechar treino"
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-input text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-foreground">
              {workoutLetter ? `${workoutLetter} · ` : ''}{workoutName}
            </p>
            <button
              type="button"
              onClick={() => setClockOpen(true)}
              aria-label={`${paused ? 'Treino pausado' : 'Duração do treino'} ${formatDuration(elapsed)}. Toque para opções.`}
              className="mt-0.5 inline-flex min-h-7 items-center gap-1.5 rounded-lg font-mono text-lg font-black tabular-nums text-primary"
            >
              {paused ? <Pause className="size-3.5" fill="currentColor" /> : <TimerReset className="size-3.5" />}
              {formatDuration(elapsed)}
            </button>
            <div className="-mt-0.5"><WorkoutSaveStatus compact /></div>
          </div>

          <div className="shrink-0 text-center">
            <p className="font-mono text-sm font-black tabular-nums">{completedSets}/{totalSets}</p>
            <p className="text-[9px] text-muted-foreground">séries</p>
          </div>

          <button
            type="button"
            onClick={onFinish}
            className="min-h-11 shrink-0 rounded-xl bg-primary px-2.5 text-xs font-extrabold text-primary-foreground sm:px-4"
          >
            Finalizar
          </button>
        </div>
      </header>

      <BottomSheet
        open={clockOpen}
        onOpenChange={setClockOpen}
        title="Duração do treino"
        description="O tempo pausado não entra na duração final."
      >
        <div className="rounded-2xl bg-secondary/45 px-4 py-5 text-center">
          <p className="font-mono text-4xl font-black tabular-nums text-primary">{formatDuration(elapsed)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{paused ? 'Sessão pausada' : 'Sessão em andamento'}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (paused) resumeSessionClock()
            else pauseSessionClock()
          }}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-primary-foreground"
        >
          {paused ? <Play className="size-4" fill="currentColor" /> : <Pause className="size-4" fill="currentColor" />}
          {paused ? 'Retomar treino' : 'Pausar treino'}
        </button>
      </BottomSheet>
    </>
  )
}
