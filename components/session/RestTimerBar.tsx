'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, SkipForward, Pause, Play, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  useSessionStore,
  timerIsActive,
  timerRemaining,
} from '@/lib/store/sessionStore'
import { formatDuration } from '@/lib/utils/time'

/** Beep curto via WebAudio (sem asset externo). */
function playBeep() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start()
    osc.stop(ctx.currentTime + 0.6)
    osc.onended = () => void ctx.close()
  } catch {
    // sem suporte a áudio — vibração/toast cobrem o aviso
  }
}

/**
 * Cronômetro de descanso baseado em timestamp real:
 * - continua correto com a aba minimizada ou em segundo plano;
 * - não reinicia após atualização da página (estado persistido);
 * - pausar / retomar / +30s / reiniciar / pular.
 */
export function RestTimerBar() {
  const {
    restTimer,
    addRestSeconds,
    pauseRestTimer,
    resumeRestTimer,
    restartRestTimer,
    skipRestTimer,
  } = useSessionStore()

  const [now, setNow] = useState(() => Date.now())
  const finishedNotifiedRef = useRef(false)
  const vibrated10sRef = useRef(false)

  const active = timerIsActive(restTimer)
  const paused = restTimer.pausedRemaining != null
  const remaining = timerRemaining(restTimer, now)

  // Re-render frequente enquanto ativo (o valor real vem do timestamp)
  useEffect(() => {
    if (!active || paused) return
    const interval = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(interval)
  }, [active, paused])

  // Aviso de 10s
  useEffect(() => {
    if (!active || paused) return
    if (remaining <= 10 && remaining > 0 && !vibrated10sRef.current) {
      vibrated10sRef.current = true
      if ('vibrate' in navigator) navigator.vibrate(200)
    }
    if (remaining > 10) {
      vibrated10sRef.current = false
    }
  }, [remaining, active, paused])

  // Fim do descanso: som + vibração + toast, depois encerra
  useEffect(() => {
    if (!active || paused) return
    if (remaining === 0 && !finishedNotifiedRef.current) {
      finishedNotifiedRef.current = true
      if ('vibrate' in navigator) navigator.vibrate([400, 100, 400])
      playBeep()
      toast('Descanso concluído! 💪', { description: 'Hora da próxima série.' })
      skipRestTimer()
    }
    if (remaining > 0) {
      finishedNotifiedRef.current = false
    }
  }, [remaining, active, paused, skipRestTimer])

  if (!active) return null

  const progress =
    restTimer.totalSeconds > 0 ? (remaining / restTimer.totalSeconds) * 100 : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border safe-area-bottom">
      {/* Progress bar */}
      <div className="h-1 bg-zinc-800">
        <div
          className="h-full bg-primary transition-all duration-300 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">
            {paused ? 'Descanso pausado' : 'Descansando'}
          </p>
          <p
            className={`text-2xl font-black tabular-nums tracking-tight ${
              remaining <= 10 && !paused ? 'text-primary' : 'text-foreground'
            }`}
          >
            {formatDuration(remaining)}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addRestSeconds(30)}
            aria-label="Adicionar 30 segundos"
            className="h-9 w-12 text-xs font-semibold"
          >
            <Plus className="w-3 h-3 mr-0.5" />
            30
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={paused ? resumeRestTimer : pauseRestTimer}
            aria-label={paused ? 'Retomar descanso' : 'Pausar descanso'}
            className="h-9 w-10 px-0"
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={restartRestTimer}
            aria-label="Reiniciar descanso"
            className="h-9 w-10 px-0"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={skipRestTimer}
            aria-label="Pular descanso"
            className="h-9 px-2.5 text-muted-foreground"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
