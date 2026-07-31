'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Minus,
  Pause,
  Play,
  Plus,
  SkipForward,
  TimerReset,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  timerIsActive,
  timerRemaining,
  useSessionStore,
} from '@/lib/store/sessionStore'
import { formatDuration } from '@/lib/utils/time'
import { safeNotify, safeVibrate } from '@/lib/utils/browser-feedback'
import { cancelRestPush } from '@/lib/push/client'
import type { WorkoutExerciseWithExercise } from '@/types/database'

function playBeep() {
  try {
    const Context = window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Context) return
    const context = new Context()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.frequency.value = 880
    gain.gain.setValueAtTime(0.22, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.55)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.55)
    oscillator.onended = () => void context.close()
  } catch {
    // Vibração e aria-live continuam disponíveis quando áudio não é suportado.
  }
}

interface RestTimerDockProps {
  exercises: WorkoutExerciseWithExercise[]
  currentExerciseId: string
  notificationsEnabled?: boolean
  soundEnabled?: boolean
  vibrateEnabled?: boolean
}

export function RestTimerDock({
  exercises,
  currentExerciseId,
  notificationsEnabled = true,
  soundEnabled = true,
  vibrateEnabled = true,
}: RestTimerDockProps) {
  const {
    restTimer,
    sets,
    addRestSeconds,
    pauseRestTimer,
    resumeRestTimer,
    skipRestTimer,
  } = useSessionStore()
  const [now, setNow] = useState(() => Date.now())
  const [minimized, setMinimized] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [keyboardOffset, setKeyboardOffset] = useState(0)
  const finishedNotified = useRef(false)
  const warnedTenSeconds = useRef(false)
  const active = timerIsActive(restTimer)
  const paused = restTimer.pausedRemaining != null
  const remaining = timerRemaining(restTimer, now)
  const timerExerciseId = restTimer.workoutExerciseId ?? currentExerciseId
  const exercise = exercises.find((item) => item.id === timerExerciseId)
  const completedCount = (sets[timerExerciseId] ?? []).filter((set) => !set.is_warmup).length
  const nextSet = Math.min(completedCount + 1, exercise?.target_sets ?? completedCount + 1)
  const endRest = () => {
    const jobId = restTimer.pushJobId
    skipRestTimer()
    void cancelRestPush(jobId)
  }

  useEffect(() => {
    if (!active || paused) return
    const interval = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(interval)
  }, [active, paused])

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const update = () => {
      const offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
      setKeyboardOffset(offset)
    }
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [])

  useEffect(() => {
    if (!active || paused) return
    if (remaining <= 10 && remaining > 0 && !warnedTenSeconds.current) {
      warnedTenSeconds.current = true
      if (vibrateEnabled) safeVibrate(150)
    }
    if (remaining > 10) warnedTenSeconds.current = false
  }, [active, paused, remaining, vibrateEnabled])

  useEffect(() => {
    if (!active || paused) return
    if (remaining === 0 && !finishedNotified.current) {
      finishedNotified.current = true
      setAnnouncement('Descanso concluído. Próxima série pronta.')
      // A limpeza é a única ação obrigatória. APIs do aparelho podem falhar
      // em PWAs e não devem manter a tela em erro.
      endRest()
      if (vibrateEnabled) safeVibrate([350, 100, 350])
      if (soundEnabled) playBeep()
      if (notificationsEnabled) {
        safeNotify('Descanso concluído', {
          body: `${exercise?.exercise.name_pt ?? 'Próxima série'}: pronto para continuar.`,
          tag: 'gymtrack-rest-timer',
        }, () => window.focus())
      }
      toast('Descanso concluído', { description: 'A próxima série está pronta.' })
    }
    if (remaining > 0) finishedNotified.current = false
  }, [active, paused, remaining, skipRestTimer, exercise?.exercise.name_pt, notificationsEnabled, soundEnabled, vibrateEnabled])

  const progress = restTimer.totalSeconds > 0
    ? Math.max(0, Math.min(100, (remaining / restTimer.totalSeconds) * 100))
    : 0

  if (!active) {
    const current = exercises.find((item) => item.id === currentExerciseId)
    const currentCompleted = (sets[currentExerciseId] ?? []).filter((set) => !set.is_warmup).length
    const currentNext = Math.min(currentCompleted + 1, current?.target_sets ?? currentCompleted + 1)
    const allDone = current != null && currentCompleted >= current.target_sets
    return (
      <div
        className="fixed inset-x-0 z-40 border-t border-sidebar-border bg-card/97 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_36px_rgba(0,0,0,.35)] backdrop-blur-xl"
        style={{ bottom: keyboardOffset }}
      >
        <div className="mx-auto flex min-h-16 max-w-3xl items-center gap-3 px-3 sm:px-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            {allDone ? <SkipForward className="size-4" /> : <TimerReset className="size-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold">{current?.exercise.name_pt ?? 'Exercício atual'}</p>
            <p className="text-[10px] text-muted-foreground">
              {allDone ? 'Exercício concluído' : `Série ${currentNext} de ${current?.target_sets ?? '—'} pronta`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              document.querySelector('[data-current-set="true"]')?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              })
            }}
            className="min-h-12 rounded-xl bg-primary px-4 text-xs font-extrabold text-primary-foreground"
          >
            {allDone ? 'Revisar' : 'Ir para série'}
          </button>
        </div>
        <p className="sr-only" aria-live="assertive">{announcement}</p>
      </div>
    )
  }

  if (minimized) {
    return (
      <div
        className="fixed inset-x-0 z-40 border-t border-sidebar-border bg-card/97 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_36px_rgba(0,0,0,.35)] backdrop-blur-xl"
        style={{ bottom: keyboardOffset }}
      >
        <div className="h-1 bg-secondary"><div className="h-full bg-primary" style={{ width: `${progress}%` }} /></div>
        <div className="mx-auto flex min-h-14 max-w-3xl items-center gap-3 px-3 sm:px-4">
          <span className="text-[10px] font-bold uppercase text-muted-foreground">Descanso</span>
          <span className="font-mono text-2xl font-black tabular-nums text-primary">{formatDuration(remaining)}</span>
          <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">Próxima: série {nextSet}</span>
          <button type="button" onClick={() => setMinimized(false)} aria-label="Expandir cronômetro" className="grid size-11 place-items-center rounded-xl border border-input">
            <ChevronUp className="size-4" />
          </button>
        </div>
      </div>
    )
  }

  const controlClass = 'flex min-h-11 min-w-11 flex-1 items-center justify-center gap-1 rounded-xl border border-input text-[10px] font-bold'
  return (
    <div
      className="fixed inset-x-0 z-40 border-t border-sidebar-border bg-card/97 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_36px_rgba(0,0,0,.35)] backdrop-blur-xl"
      style={{ bottom: keyboardOffset }}
    >
      <div className="h-1 bg-secondary"><div className="h-full bg-primary transition-[width] motion-reduce:transition-none" style={{ width: `${progress}%` }} /></div>
      <div className="mx-auto max-w-3xl px-3 py-2 sm:px-4">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Descanso · {exercise?.exercise.name_pt}</p>
            <p className="text-[10px] text-muted-foreground">Próxima: série {nextSet} de {exercise?.target_sets ?? '—'}</p>
          </div>
          <p className="font-mono text-3xl font-black tabular-nums text-primary" aria-live="off">{formatDuration(remaining)}</p>
          <button type="button" onClick={() => setMinimized(true)} aria-label="Minimizar cronômetro" className="grid size-11 place-items-center rounded-xl text-muted-foreground">
            <ChevronDown className="size-4" />
          </button>
        </div>
        <div className="mt-1.5 flex gap-1.5">
          <button type="button" onClick={() => addRestSeconds(-15)} className={controlClass} aria-label="Reduzir 15 segundos">
            <Minus className="size-3" />15
          </button>
          <button type="button" onClick={paused ? resumeRestTimer : pauseRestTimer} className={controlClass} aria-label={paused ? 'Retomar cronômetro' : 'Pausar cronômetro'}>
            {paused ? <Play className="size-3" fill="currentColor" /> : <Pause className="size-3" fill="currentColor" />}
            <span className="hidden min-[390px]:inline">{paused ? 'Retomar' : 'Pausar'}</span>
          </button>
          <button type="button" onClick={() => addRestSeconds(15)} className={controlClass} aria-label="Adicionar 15 segundos">
            <Plus className="size-3" />15
          </button>
          <button type="button" onClick={() => addRestSeconds(30)} className={controlClass} aria-label="Adicionar 30 segundos">
            <Plus className="size-3" />30
          </button>
          <button type="button" onClick={endRest} className={controlClass} aria-label="Pular descanso">
            <SkipForward className="size-3" /><span className="hidden min-[390px]:inline">Pular</span>
          </button>
        </div>
      </div>
      <p className="sr-only" aria-live="assertive">{announcement}</p>
    </div>
  )
}
