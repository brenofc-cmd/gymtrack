'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, CirclePause, CirclePlay, Loader2, RotateCcw, ShieldAlert, Square, TimerReset, WifiOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { evaluateProgression, localDateISO, type CoreExercisePlan } from '@/lib/daily-core/logic'
import { CORE_SYNC_EVENT, flushCoreSyncQueue, persistCoreOperation, type CoreSyncState } from '@/lib/daily-core/syncQueue'
import { coreTimerRemaining, useDailyCoreStore, type CoreLocalSet, type CoreTimer } from '@/lib/daily-core/store'
import type { DailyCoreDayRow, DailyCoreExecutionQuality, DailyCorePainLevel, DailyCoreSessionRow } from '@/types/database'

interface CoreSessionClientProps {
  userId: string
  day: DailyCoreDayRow
  exercises: CoreExercisePlan[]
  adaptationWeek: number
  existingSession: DailyCoreSessionRow | null
}

const QUALITY_OPTIONS: Array<{ value: DailyCoreExecutionQuality; label: string }> = [
  { value: 'excelente', label: 'Excelente' }, { value: 'boa', label: 'Boa' }, { value: 'aceitavel', label: 'Aceitável' }, { value: 'ruim', label: 'Ruim' },
]
const PAIN_OPTIONS: Array<{ value: DailyCorePainLevel; label: string }> = [
  { value: 'sem_dor', label: 'Sem dor' }, { value: 'desconforto_leve', label: 'Desconforto leve' }, { value: 'dor_moderada', label: 'Dor moderada' }, { value: 'dor_forte', label: 'Dor forte' }, { value: 'dor_lombar', label: 'Dor lombar' },
]

export function CoreSessionClient({ userId, day, exercises, adaptationWeek, existingSession }: CoreSessionClientProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [syncState, setSyncState] = useState<CoreSyncState>('synced')
  const [pending, setPending] = useState(0)
  const [reps, setReps] = useState(() => String(exercises[useDailyCoreStore.getState().currentExerciseIndex]?.target_reps_min ?? ''))
  const [weight, setWeight] = useState('')
  const [rir, setRir] = useState(String(adaptationWeek > 0 && adaptationWeek <= 2 ? 3 : 2))
  const [quality, setQuality] = useState<DailyCoreExecutionQuality>('boa')
  const [pain, setPain] = useState<DailyCorePainLevel>('sem_dor')
  const [lumbarControlled, setLumbarControlled] = useState(true)
  const [editingSet, setEditingSet] = useState<CoreLocalSet | null>(null)
  const store = useDailyCoreStore()
  const exercise = exercises[store.currentExerciseIndex]
  const exerciseSets = exercise ? store.sets[exercise.id] ?? [] : []
  const totalSets = exercises.reduce((total, item) => total + item.effectiveSets, 0)
  const completedSets = Object.values(store.sets).reduce((total, list) => total + list.length, 0)
  const progress = totalSets ? Math.min(100, Math.round((completedSets / totalSets) * 100)) : 0
  const selectedVariationId = exercise ? (store.selectedVariations[exercise.id] ?? exercise.selectedVariation?.id ?? null) : null

  useEffect(() => {
    const supabase = createClient()
    const today = localDateISO()
    const sessionState = useDailyCoreStore.getState()
    if (!sessionState.session || sessionState.session.sessionDate !== today || sessionState.session.dayOfWeek !== day.day_of_week) {
      const session = {
        id: existingSession?.id ?? crypto.randomUUID(), userId, sessionDate: today, dayOfWeek: day.day_of_week,
        sessionType: day.session_type, adaptationWeek, startedAt: existingSession?.started_at ?? new Date().toISOString(),
      }
      sessionState.startSession(session)
      void persistCoreOperation(supabase, {
        key: `session:${session.id}`,
        table: 'daily_core_sessions',
        payload: {
          id: session.id, user_id: userId, day_of_week: day.day_of_week, session_date: today,
          session_type: day.session_type, status: 'em_andamento', adaptation_week: adaptationWeek,
          started_at: session.startedAt, client_updated_at: session.startedAt,
        },
      }).catch(() => toast.info('Sessão guardada no aparelho; sincronizaremos quando possível.'))
    }
    void flushCoreSyncQueue(supabase)
    function onSync(event: Event) {
      const detail = (event as CustomEvent<{ state: CoreSyncState; pending: number }>).detail
      setSyncState(detail.state); setPending(detail.pending)
    }
    function onOnline() { void flushCoreSyncQueue(supabase) }
    window.addEventListener(CORE_SYNC_EVENT, onSync)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOnline)
    return () => {
      window.removeEventListener(CORE_SYNC_EVENT, onSync)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOnline)
    }
  }, [adaptationWeek, day.day_of_week, day.session_type, existingSession, userId])

  function goToExercise(index: number) {
    const next = exercises[index]
    if (!next) return
    store.setCurrentExerciseIndex(index)
    setReps(String(next.target_reps_min ?? ''))
    setWeight('')
    setPain('sem_dor')
    setQuality('boa')
    setLumbarControlled(true)
    setEditingSet(null)
    store.stopExecutionTimer()
  }

  function previousSet() {
    let index = store.currentExerciseIndex
    let targetExercise = exercises[index]
    let priorSets = targetExercise ? store.sets[targetExercise.id] ?? [] : []
    while (priorSets.length === 0 && index > 0) {
      index -= 1
      targetExercise = exercises[index]
      priorSets = targetExercise ? store.sets[targetExercise.id] ?? [] : []
    }
    const prior = priorSets.at(-1)
    if (!prior || !targetExercise) return
    if (index !== store.currentExerciseIndex) goToExercise(index)
    setEditingSet(prior)
    setReps(prior.reps == null ? '' : String(prior.reps))
    setWeight(prior.weightKg == null ? '' : String(prior.weightKg))
    setRir(prior.rir == null ? '' : String(prior.rir))
    setQuality(prior.executionQuality ?? 'boa')
    setPain(prior.painLevel ?? 'sem_dor')
    setLumbarControlled(prior.lumbarControlled ?? true)
    store.selectVariation(targetExercise.id, prior.variationId)
    toast.info('Série anterior carregada para revisão.')
  }

  const isStrong = exercise?.exercise_type === 'hipertrofia' || exercise?.exercise_type === 'anti_extensao'
  const nextSetNumber = exerciseSets.length + 1
  const targetLabel = exercise?.measure_type === 'tempo'
    ? `${exercise.target_seconds_min}–${exercise.target_seconds_max} s`
    : `${exercise?.target_reps_min}–${exercise?.target_reps_max}${exercise?.per_side ? ' por lado' : ''}`

  async function completeSet() {
    if (!exercise || !store.session || (!editingSet && nextSetNumber > exercise.effectiveSets)) return
    setSaving(true)
    const now = new Date().toISOString()
    const duration = exercise.measure_type === 'tempo'
      ? editingSet?.durationSeconds ?? Math.max(exercise.target_seconds_min ?? 0, store.executionTimer.totalSeconds - coreTimerRemaining(store.executionTimer))
      : null
    const localSet: CoreLocalSet = {
      id: editingSet?.id ?? crypto.randomUUID(), exerciseId: exercise.id, variationId: selectedVariationId,
      setNumber: editingSet?.setNumber ?? nextSetNumber, reps: exercise.measure_type === 'tempo' ? null : Math.max(0, Number(reps) || 0),
      durationSeconds: duration, weightKg: weight ? Math.max(0, Number(weight)) : null,
      rir: isStrong ? Math.max(0, Number(rir) || 0) : null,
      executionQuality: isStrong ? quality : null, painLevel: pain,
      lumbarControlled: exercise.slug === 'ab-wheel' || exercise.slug.includes('prancha') ? lumbarControlled : null,
      completedAt: now,
    }
    store.logSet(localSet)
    store.stopExecutionTimer()
    const supabase = createClient()
    await persistCoreOperation(supabase, {
      key: `set:${localSet.id}`,
      table: 'daily_core_sets',
      payload: {
        id: localSet.id, session_id: store.session.id, user_id: userId, exercise_id: exercise.id,
        variation_id: localSet.variationId, set_number: localSet.setNumber, reps: localSet.reps,
        duration_seconds: localSet.durationSeconds, weight_kg: localSet.weightKg, rir: localSet.rir,
        execution_quality: localSet.executionQuality, pain_level: localSet.painLevel,
        lumbar_controlled: localSet.lumbarControlled, completed_at: now, client_updated_at: now,
      },
    }).catch(() => undefined)
    if (pain === 'dor_moderada' || pain === 'dor_forte' || pain === 'dor_lombar') {
      const painId = crypto.randomUUID()
      const painLevel = pain === 'dor_moderada' ? 'dor_muscular_moderada' : pain
      await persistCoreOperation(supabase, {
        key: `pain:${painId}`,
        table: 'daily_core_pain_logs',
        payload: { id: painId, user_id: userId, session_id: store.session.id, exercise_id: exercise.id, logged_on: store.session.sessionDate, pain_level: painLevel },
      }).catch(() => undefined)
      toast.error('Interrompa o exercício. Não haverá sugestão de progressão; procure orientação se a dor persistir ou piorar.')
    }
    const wasEditing = editingSet != null
    const updatedSets = wasEditing
      ? exerciseSets.map((item) => item.id === localSet.id ? localSet : item)
      : [...exerciseSets, localSet]
    setEditingSet(null)
    if (updatedSets.length >= exercise.effectiveSets) {
      const decision = evaluateProgression(exercise, updatedSets.map((set) => ({
        reps: set.reps, duration_seconds: set.durationSeconds, weight_kg: set.weightKg, rir: set.rir,
        execution_quality: set.executionQuality, pain_level: set.painLevel, lumbar_controlled: set.lumbarControlled,
      })), adaptationWeek)
      await persistCoreOperation(supabase, {
        key: `progression:${userId}:${exercise.id}`,
        table: 'daily_core_progressions',
        payload: {
          user_id: userId, exercise_id: exercise.id, current_variation_id: selectedVariationId,
          status: decision.status, reason: decision.reason, suggested_reps: decision.suggestedReps,
          suggested_seconds: decision.suggestedSeconds, suggested_weight_kg: decision.suggestedWeightKg,
        },
      }).catch(() => undefined)
      toast(decision.status === 'progredir' ? 'Progressão disponível' : 'Exercício concluído', { description: decision.reason })
      if (!wasEditing && store.currentExerciseIndex < exercises.length - 1) goToExercise(store.currentExerciseIndex + 1)
    } else if (!wasEditing) {
      store.startRestTimer(exercise.rest_seconds_max)
    }
    setSaving(false)
  }

  async function finish(completion: 'treino' | 'pausa_por_dor' | 'recuperacao_completa' = 'treino') {
    if (!store.session) return
    if (completion === 'treino' && progress < 100 && !window.confirm('Ainda há séries pendentes. Deseja encerrar mesmo assim?')) return
    setSaving(true)
    const now = new Date().toISOString()
    const durationSeconds = Math.max(0, Math.round((Date.now() - new Date(store.session.startedAt).getTime()) / 1000))
    await persistCoreOperation(createClient(), {
      key: `session:${store.session.id}`,
      table: 'daily_core_sessions',
      payload: {
        id: store.session.id, user_id: userId, day_of_week: day.day_of_week, session_date: store.session.sessionDate,
        session_type: day.session_type, status: completion === 'treino' || completion === 'recuperacao_completa' ? 'concluido' : 'interrompido',
        completion_kind: completion, adaptation_week: adaptationWeek, started_at: store.session.startedAt,
        finished_at: now, duration_seconds: durationSeconds, client_updated_at: now,
      },
    }).catch(() => undefined)
    store.reset()
    setSaving(false)
    router.push('/abdomen')
    router.refresh()
  }

  if (!exercise) {
    return <div className="grid min-h-dvh place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col px-4 pb-6 pt-4">
      <header className="flex items-center gap-3">
        <button type="button" onClick={() => void finish('pausa_por_dor')} aria-label="Interromper rotina" className="grid size-11 place-items-center rounded-xl border border-input bg-secondary"><ArrowLeft className="size-5" /></button>
        <div className="min-w-0 flex-1"><p className="metric-label">{day.name}</p><h1 className="truncate text-lg font-extrabold">{exercise.name}</h1></div>
        <div className={`flex items-center gap-1 text-[10px] ${syncState === 'offline' || pending ? 'text-[#ffb547]' : 'text-muted-foreground'}`}>{syncState === 'offline' ? <WifiOff className="size-3.5" /> : null}{pending ? `${pending} pendente${pending === 1 ? '' : 's'}` : 'Sincronizado'}</div>
      </header>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground"><span>{progress}% concluído</span><span>{completedSets}/{totalSets} séries</span></div>

      <section className="mt-5 flex-1 space-y-4">
        <div className="surface-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div><p className="metric-label">{editingSet ? 'Revisando série' : 'Série atual'}</p><p className="mt-1 font-mono text-3xl font-black">{editingSet?.setNumber ?? Math.min(nextSetNumber, exercise.effectiveSets)}<span className="text-base font-medium text-muted-foreground">/{exercise.effectiveSets}</span></p></div>
            <div className="text-right"><p className="metric-label">Alvo</p><p className="mt-1 font-mono text-lg font-bold">{targetLabel}</p>{exercise.effectiveRir != null && <p className="text-[10px] text-muted-foreground">RIR {exercise.effectiveRir}</p>}</div>
          </div>
          <div className="mt-4 rounded-xl bg-secondary/65 p-3 text-xs leading-relaxed"><strong className="text-primary">Técnica:</strong> {exercise.short_cue}</div>
          <details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer font-semibold text-foreground">Ver instruções completas</summary><ul className="mt-2 list-disc space-y-1 pl-4">{exercise.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ul><p className="mt-2 text-[11px]">{exercise.progression_rule}</p></details>
        </div>

        {exercise.variations.length > 0 && (
          <label className="surface-card block p-4"><span className="metric-label">Variação disponível</span><select value={selectedVariationId ?? ''} onChange={(event) => store.selectVariation(exercise.id, event.target.value || null)} className="mt-2 h-12 w-full rounded-xl border border-input bg-secondary px-3 text-sm">{exercise.variations.map((variation) => <option key={variation.id} value={variation.id}>{variation.name}</option>)}</select></label>
        )}

        {exercise.measure_type === 'tempo' ? (
          <TimerControls timer={store.executionTimer} label="Cronômetro de execução" onStart={() => store.startExecutionTimer(exercise.target_seconds_min ?? 20)} onPause={store.pauseExecutionTimer} onResume={store.resumeExecutionTimer} onRestart={store.restartExecutionTimer} onAdd={() => store.addExecutionSeconds(10)} onStop={store.stopExecutionTimer} />
        ) : (
          <div className="surface-card grid grid-cols-3 gap-2 p-4">
            <Field label={exercise.measure_type === 'respiracoes' ? 'Respirações' : 'Repetições'} value={reps} onChange={setReps} min={0} />
            <Field label="Carga kg" value={weight} onChange={setWeight} min={0} step="0.5" placeholder="—" />
            <Field label="RIR" value={rir} onChange={setRir} min={0} max={10} disabled={!isStrong} />
          </div>
        )}

        {isStrong && (
          <div className="surface-card space-y-3 p-4">
            <label className="block"><span className="metric-label">Qualidade da execução</span><select value={quality} onChange={(event) => setQuality(event.target.value as DailyCoreExecutionQuality)} className="mt-1.5 h-11 w-full rounded-xl border border-input bg-secondary px-3 text-sm">{QUALITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            {(exercise.slug === 'ab-wheel' || exercise.slug.includes('prancha')) && <label className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3 text-xs font-semibold"><input type="checkbox" checked={lumbarControlled} onChange={(event) => setLumbarControlled(event.target.checked)} className="size-4 accent-primary" /> Lombar controlada durante toda a série</label>}
          </div>
        )}

        <label className="surface-card block p-4"><span className="metric-label">Dor ou desconforto</span><select value={pain} onChange={(event) => setPain(event.target.value as DailyCorePainLevel)} className="mt-1.5 h-11 w-full rounded-xl border border-input bg-secondary px-3 text-sm">{PAIN_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{(pain === 'dor_moderada' || pain === 'dor_forte' || pain === 'dor_lombar') && <p className="mt-2 flex gap-2 text-[11px] leading-relaxed text-destructive"><ShieldAlert className="mt-0.5 size-3.5 shrink-0" />Interrompa o exercício. Não diagnosticamos lesões; procure um profissional se a dor for relevante, progressiva ou persistente.</p>}</label>

        {(store.restTimer.endsAt != null || store.restTimer.pausedRemaining != null) && <TimerControls timer={store.restTimer} label="Descanso" onStart={() => store.startRestTimer(exercise.rest_seconds_max)} onPause={store.pauseRestTimer} onResume={store.resumeRestTimer} onRestart={store.restartRestTimer} onAdd={() => store.addRestSeconds(10)} onStop={store.stopRestTimer} compact />}
      </section>

      <div className="sticky bottom-0 mt-5 space-y-2 bg-background/95 pb-[env(safe-area-inset-bottom)] pt-3 backdrop-blur-xl">
        <button type="button" onClick={completeSet} disabled={saving || (!editingSet && nextSetNumber > exercise.effectiveSets)} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50">{saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} {editingSet ? 'Salvar correção' : 'Concluir série'}</button>
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={previousSet} disabled={completedSets === 0} className="flex h-11 items-center justify-center gap-1 rounded-xl border border-input bg-secondary text-xs font-semibold disabled:opacity-40"><ChevronLeft className="size-4" /> Série anterior</button>
          <button type="button" onClick={() => void finish(pain === 'dor_moderada' || pain === 'dor_forte' || pain === 'dor_lombar' ? 'pausa_por_dor' : 'treino')} className="flex h-11 items-center justify-center gap-1 rounded-xl border border-input bg-secondary text-xs font-semibold"><Square className="size-3.5" /> Encerrar</button>
          <button type="button" onClick={() => goToExercise(Math.min(exercises.length - 1, store.currentExerciseIndex + 1))} disabled={store.currentExerciseIndex === exercises.length - 1} className="flex h-11 items-center justify-center gap-1 rounded-xl border border-input bg-secondary text-xs font-semibold disabled:opacity-40">Próximo <ChevronRight className="size-4" /></button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, min, max, step = '1', placeholder, disabled }: { label: string; value: string; onChange: (value: string) => void; min?: number; max?: number; step?: string; placeholder?: string; disabled?: boolean }) {
  return <label><span className="metric-label">{label}</span><input type="number" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} min={min} max={max} step={step} placeholder={placeholder} disabled={disabled} className="mt-1.5 h-12 w-full rounded-xl border border-input bg-secondary px-2 text-center font-mono text-base font-bold outline-none focus:border-primary disabled:opacity-40" /></label>
}

interface TimerControlsProps {
  timer: CoreTimer
  label: string
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onRestart: () => void
  onAdd: () => void
  onStop: () => void
  compact?: boolean
}

function TimerControls({ timer, label, onStart, onPause, onResume, onRestart, onAdd, onStop, compact = false }: TimerControlsProps) {
  const [now, setNow] = useState(0)
  useEffect(() => {
    const firstTick = window.setTimeout(() => setNow(Date.now()), 0)
    const interval = window.setInterval(() => setNow(Date.now()), 250)
    return () => { window.clearTimeout(firstTick); window.clearInterval(interval) }
  }, [])
  const remaining = now === 0 ? timer.totalSeconds : coreTimerRemaining(timer, now)
  const active = timer.endsAt != null || timer.pausedRemaining != null
  const paused = timer.pausedRemaining != null
  return (
    <div className={`surface-card ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between"><span className="metric-label">{label}</span><span className="font-mono text-3xl font-black tabular-nums">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</span></div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {!active ? <button type="button" onClick={onStart} className="col-span-2 flex h-10 items-center justify-center gap-1 rounded-xl bg-primary text-xs font-bold text-primary-foreground"><CirclePlay className="size-4" /> Iniciar</button> : <button type="button" onClick={paused ? onResume : onPause} className="col-span-2 flex h-10 items-center justify-center gap-1 rounded-xl bg-primary text-xs font-bold text-primary-foreground">{paused ? <CirclePlay className="size-4" /> : <CirclePause className="size-4" />}{paused ? 'Retomar' : 'Pausar'}</button>}
        <button type="button" onClick={onRestart} className="grid h-10 place-items-center rounded-xl bg-secondary" aria-label="Reiniciar cronômetro"><RotateCcw className="size-4" /></button>
        <button type="button" onClick={onAdd} className="h-10 rounded-xl bg-secondary text-xs font-bold">+10 s</button>
      </div>
      {active && <button type="button" onClick={onStop} className="mt-2 flex h-9 w-full items-center justify-center gap-1 rounded-xl border border-input text-xs font-semibold"><TimerReset className="size-3.5" /> Encerrar timer</button>}
    </div>
  )
}
