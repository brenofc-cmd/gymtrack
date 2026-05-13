'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/utils/time'

interface SessionHeaderProps {
  startedAt: string
  workoutName: string
  workoutLetter: string
  onFinish: () => void
}

export function SessionHeader({
  startedAt,
  workoutName,
  workoutLetter,
  onFinish,
}: SessionHeaderProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = new Date(startedAt).getTime()
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <div>
          <p className="text-xs text-muted-foreground">
            Treino {workoutLetter} — {workoutName}
          </p>
          <p className="text-2xl font-black tabular-nums text-primary tracking-tight">
            {formatDuration(elapsed)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onFinish}
          className="text-muted-foreground hover:text-foreground gap-1.5"
        >
          <X className="w-4 h-4" />
          Finalizar
        </Button>
      </div>
    </div>
  )
}
