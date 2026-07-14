'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { formatDuration } from '@/lib/utils/time'

interface SessionHeaderProps {
  startedAt: string
  workoutName: string
  workoutLetter: string
  completedSets: number
  totalSets: number
  onFinish: () => void
}

export function SessionHeader({
  startedAt,
  workoutName,
  workoutLetter,
  completedSets,
  totalSets,
  onFinish,
}: SessionHeaderProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = new Date(startedAt).getTime()
    const update = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  const percentage = totalSets > 0 ? Math.min(100, (completedSets / totalSets) * 100) : 0

  return (
    <header className="sticky top-0 z-20 bg-sidebar/95 backdrop-blur-md">
      <div className="mx-auto max-w-lg px-4 pb-3 pt-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onFinish} aria-label="Sair ou finalizar treino" className="grid size-10 shrink-0 place-items-center rounded-xl border border-input text-muted-foreground">
            <X className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-muted-foreground">Treino {workoutLetter} — {workoutName}</p>
            <p className="font-mono text-xl font-extrabold leading-tight tabular-nums text-primary">{formatDuration(elapsed)}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-bold">{completedSets}/{totalSets}</p>
            <p className="text-[10px] text-muted-foreground">séries</p>
          </div>
        </div>
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percentage}%` }} />
        </div>
      </div>
    </header>
  )
}
