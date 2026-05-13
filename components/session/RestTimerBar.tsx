'use client'

import { useEffect, useRef } from 'react'
import { Minus, Plus, SkipForward } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/lib/store/sessionStore'
import { formatDuration } from '@/lib/utils/time'

export function RestTimerBar() {
  const { restTimer, tickTimer, adjustTimer, skipTimer } = useSessionStore()
  const vibrated10sRef = useRef(false)
  const wasActiveRef = useRef(false)

  useEffect(() => {
    if (!restTimer.active) {
      vibrated10sRef.current = false
      return
    }

    const interval = setInterval(() => {
      tickTimer()
    }, 1000)

    return () => clearInterval(interval)
  }, [restTimer.active, tickTimer])

  // Vibration at 10s warning
  useEffect(() => {
    if (!restTimer.active) return
    if (restTimer.remaining <= 10 && restTimer.remaining > 0 && !vibrated10sRef.current) {
      vibrated10sRef.current = true
      if ('vibrate' in navigator) navigator.vibrate(200)
    }
  }, [restTimer.remaining, restTimer.active])

  // Toast + vibration when timer completes
  useEffect(() => {
    if (restTimer.active) {
      wasActiveRef.current = true
      return
    }
    if (wasActiveRef.current && restTimer.remaining === 0) {
      wasActiveRef.current = false
      if ('vibrate' in navigator) navigator.vibrate([400, 100, 400])
      toast('Descanso concluído! 💪', { description: 'Hora da próxima série.' })
    }
  }, [restTimer.active, restTimer.remaining])

  if (!restTimer.active && restTimer.remaining === 0) return null

  const progress =
    restTimer.total > 0 ? (restTimer.remaining / restTimer.total) * 100 : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border safe-area-bottom">
      {/* Progress bar */}
      <div className="h-1 bg-zinc-800">
        <div
          className="h-full bg-primary transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Descansando</p>
          <p
            className={`text-2xl font-black tabular-nums tracking-tight ${
              restTimer.remaining <= 10 ? 'text-primary' : 'text-foreground'
            }`}
          >
            {formatDuration(restTimer.remaining)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => adjustTimer(-15)}
            className="h-9 w-12 text-xs font-semibold"
          >
            <Minus className="w-3 h-3 mr-0.5" />
            15
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => adjustTimer(15)}
            className="h-9 w-12 text-xs font-semibold"
          >
            <Plus className="w-3 h-3 mr-0.5" />
            15
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={skipTimer}
            className="h-9 px-3 text-muted-foreground"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
