'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, CirclePause, CirclePlay, Loader2, RotateCcw, ShieldAlert, Square, TimerReset, WifiOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { coreSessionElapsedSeconds, evaluateProgression, localDateISO, resolveCoreExercise, type CoreExercisePlan } from '@/lib/daily-core/logic'
import { CORE_SYNC_EVENT, flushCoreSyncQueue, persistCoreOperation, type CoreSyncState } from '@/lib/daily-core/syncQueue'
import { coreTimerRemaining, useDailyCoreStore, type CoreLocalSet, type CoreTimer } from '@/lib/daily-core/store'
import type { DailyCoreDayRow, DailyCoreExecutionQuality, DailyCorePainLevel, DailyCoreSessionRow } from '@/types/database'
import { CoreExerciseImage } from './CoreExerciseImage'
import { useWakeLock } from '@/lib/hooks/useWakeLock'

interface CoreSessionClientProps {
  userId: string
  day: DailyCoreDayRow
  exercises: CoreExercisePlan[]
  adaptationWeek: number
  existingSession: DailyCoreSessionRow | null
  keepScreenAwake?: boolean
}

const QUALITY_OPTIONS: Array<{ value: DailyCoreExecutionQuality; label: string }> = [
  { value: 'excelente', label: 'Excelente' }, { value: 'boa', label: 'Boa' }, { value: 'aceitavel', label: 'Aceitável' }, { value: 'ruim', label: 'Ruim' },
]
const PAIN_OPTIONS: Array<{ value: DailyCorePainLevel; label: string }> = [
  { value: 'sem_dor', label: 'Sem dor' }, { value: 'desconforto_leve', label: 'Desconforto leve' }, { value: 'dor_moderada', label: 'Dor moderada' }, { value: 'dor_forte', label: 'Dor forte' }, { value: 'dor_lombar', label: 'Dor lombar' },
]

export function CoreSessionClient({ userId, day, exercises, adaptationWeek, existingSession, keepScreenAwake = true }: CoreSessionClientProps) {
  useWakeLock(keepScreenAwake)
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [syncState, setSyncState] = useState<CoreSyncState>('synced')
  const [pending, setPending] = useState(0)
  const [reps, setReps] = useState(() => {
    const initialExercise = exercises[useDailyCoreStore.getState().currentExerciseIndex]
    return String(initialExercise ? resolveCoreExercise(initialExercise).targetRepsMin ?? '' : '')
  })
  const [weight, setWeight] = useState('')
  const [rir, setRir] = useState(String(adaptationWeek > 0 && adaptationWeek <= 2 ? 3 : 2))
  const [quality, setQuality] = useState<DailyCoreExecutionQuality>('boa')
  const [pain, setPain] = useState<DailyCorePainLevel>('sem_dor')
  const [lumbarControlled, setLumbarControlled] = useState(true)
  const [notes, setNotes] = useState('')
  const [editingSet, setEditingSet] = useState<CoreLocalSet | null>(null)
  const store = useDailyCoreStore()
  const exercise = exercises[store.currentExerciseIndex]
  const exerciseSets = exercise ? store.sets[exercise.id] ?? [] : []
  const totalSets = exercises.reduce((total, item) => total + item.effectiveSets, 0)
  const completedSets = Object.values(store.sets).reduce((total, list) => total + list.length, 0)
  const progress = totalSets ? Math.min(100, Math.round((completedSets / totalSets) * 100)) : 0
  const selectedVariationId = exercise ? (store.selectedVariations[exercise.id] ?? exercise.selectedVariation?.id ?? null) : null
  const presentation = exercise ? resolveCoreExercise(exercise, selectedVariationId) : null

  useEffect(() => {
    const supabase = createClient()
    const today = localDateISO()
    const sessionState = useDailyCoreStore.getState()
    if (!sessionState.session || sessionState.session.sessionDate !== today || sessionState.session.dayOfWeek !== day.day_of_week) {
      const session = {
        id: existingSession?.id ?? crypto.randomUUID(), userId, sessionDate: today, dayOfWeek: day.day_of_week,
        sessionType: day.session_type, adaptationWeek, startedAt: existingSession?.started_at ?? new Date().toISOString(),
        location: day.location === 'academia' ? 'academia' as const : 'casa' as const,
        routineVersion: existingSession?.routine_version ?? 2,
        pausedAt: existingSession?.paused_at ?? null,
        pausedSeconds: existingSession?.paused_seconds ?? 0,
      }
      sessionState.startSession(session)
      void persistCoreOperation(supabase, {
        key: `session:${session.id}`,
        table: 'daily_core_sessions',
        payload: {
          id: session.id, user_id: userId, day_of_week: day.day_of_week, session_date: today,
          session_type: day.session_type, status: 'em_andamento', adaptation_week: adaptationWeek,
          location: session.location, routine_version: session.routineVersion,
          started_at: session.startedAt, paused_at: session.pausedAt, paused_seconds: session.pausedSeconds,
          client_updated_at: session.startedAt,
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
  }, [adaptationWeek, day.day_of_week, day.location, day.session_type, existingSession, userId])

  function goToExercise(index: number) {
    const next = exercises[index]
    if (!next) return
    const nextVariationId = store.selectedVariations[next.id] ?? next.selectedVariation?.id ?? null
    const nextPresentation = resolveCoreExercise(next, nextVariationId)
    store.setCurrentExerciseIndex(index)
    setReps(String(nextPresentation.targetRepsMin ?? ''))
    setWeight('')
    setPain('sem_dor')
    setQuality('boa')
    setLumbarControlled(true)
    setNotes('')
    setEditingSet(null)
    store.stopExecutionTimer()
  }

  function selectVariation(variationId: string) {
    if (!exercise) return
    store.selectVariation(exercise.id, variationId)
    const nextPresentation = resolveCoreExercise(exercise, variationId)
    setReps(String(nextPresentation.targetRepsMin ?? ''))
    setWeight('')
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
    setNotes(prior.notes ?? '')
    store.selectVariation(targetExercise.id, prior.variationId)
    toast.info('Série anterior carregada para revisão.')
  }

  const tracksRir = exercise?.rir_min != null
  const nextSetNumber = exerciseSets.length + 1
  const targetLabel = presentation?.measureType === 'tempo'
    ? `${presentation.targetSecondsMin}–${presentation.targetSecondsMax} s${presentation.perSide ? ' por lado' : ''}`
    : `${presentation?.targetRepsMin}–${presentation?.targetRepsMax}${presentation?.perSide ? ' por lado' : ''}`

  async function completeSet() {
    if (!exercise || !presentation || !store.session || store.session.pausedAt || (!editingSet && nextSetNumber > exercise.effectiveSets)) return
    setSaving(true)
    const now = new Date().toISOString()
    const duration = presentation.measureType === 'tempo'
      ? editingSet?.durationSeconds ?? Math.max(presentation.targetSecondsMin ?? 0, store.executionTimer.totalSeconds - coreTimerRemaining(store.executionTimer))
      : null
    const localSet: CoreLocalSet = {
      id: editingSet?.id ?? crypto.randomUUID(), exerciseId: exercise.id, variationId: selectedVariationId,
      setNumber: editingSet?.setNumber ?? nextSetNumber, reps: presentation.measureType === 'tempo' ? null : Math.max(0, Number(reps) || 0),
      durationSeconds: duration, weightKg: weight ? Math.max(0, Number(weight)) : null,
      rir: tracksRir ? Math.max(0, Number(rir) || 0) : null,
      executionQuality: tracksRir ? quality : null, painLevel: pain,
      lumbarControlled: exercise.slug === 'ab-wheel' || exercise.slug.includes('prancha') ? lumbarControlled : null,
      notes: notes.trim() || null,
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
        lumbar_controlled: localSet.lumbarControlled, notes: localSet.notes, completed_at: now, client_updated_at: now,
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
      const decision = evaluateProgression({
        ...exercise,
        name: presentation.name,
        measure_type: presentation.measureType,
        target_reps_min: presentation.targetRepsMin,
        target_reps_max: presentation.targetRepsMax,
        target_seconds_min: presentation.targetSecondsMin,
        target_seconds_max: presentation.targetSecondsMax,
        per_side: presentation.perSide,
        rest_seconds_min: presentation.restSecondsMin,
        rest_seconds_max: presentation.restSecondsMax,
        short_cue: presentation.shortCue,
        instructions: presentation.instructions,
        common_mistakes: presentation.commonMistakes,
        image_url: presentation.imageUrl,
        image_alt: presentation.imageAlt,
        rir_min: exercise.effectiveRir,
      }, updatedSets.map((set) => ({
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
          suggested_variation_id: decision.status === 'progredir' && exercise.slug === 'core-v2-reverse-crunch'
            ? [...exercise.variations].sort((a, b) => a.order_index - b.order_index)
                .find((variation) => variation.order_index > (exercise.variations.find((item) => item.id === selectedVariationId)?.order_index ?? -1))?.id ?? null
            : null,
        },
      }).catch(() => undefined)
      toast(decision.status === 'progredir' ? 'Progressão disponível' : 'Exercício concluído', { description: decision.reason })
      if (!wasEditing && store.currentExerciseIndex < exercises.length - 1) goToExercise(store.currentExerciseIndex + 1)
    } else if (!wasEditing) {
      store.startRestTimer(presentation.restSecondsMax)
    }
    setSaving(false)
  }

  async function finish(completion: 'treino' | 'pausa_por_dor' | 'pulado' = 'treino') {
    if (!store.session) return
    if (completion === 'treino' && progress < 100 && !window.confirm('Ainda há séries pendentes. Deseja encerrar mesmo assim?')) return
    setSaving(true)
    const now = new Date().toISOString()
    const durationSeconds = coreSessionElapsedSeconds(
      store.session.startedAt,
      store.session.pausedAt,
      store.session.pausedSeconds
    )
    await persistCoreOperation(createClient(), {
      key: `session:${store.session.id}`,
      table: 'daily_core_sessions',
      payload: {
        id: store.session.id, user_id: userId, day_of_week: day.day_of_week, session_date: store.session.sessionDate,
        session_type: day.session_type, status: completion === 'treino' ? 'concluido' : 'interrompido',
        completion_kind: completion, adaptation_week: adaptationWeek, started_at: store.session.startedAt,
        location: store.session.location, routine_version: store.session.routineVersion,
        finished_at: now, duration_seconds: durationSeconds, paused_at: store.session.pausedAt,
        paused_seconds: store.session.pausedSeconds, client_updated_at: now,
      },
    }).catch(() => undefined)
    store.reset()
    setSaving(false)
    router.push('/abdomen')
    router.refresh()
  }

  if (!exercise || !presentation) {
    return <div className="grid min-h-dvh place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col px-4 pb-6 pt-4">
      <header className="flex items-center gap-3">
        <button type="button" onClick={() => { store.pauseSession(); router.push('/abdomen') }} aria-label="Pausar e voltar" className="grid size-11 place-items-center rounded-xl border border-input bg-secondary"><ArrowLeft className="size-5" /></button>
        <div className="min-w-0 flex-1"><p className="metric-label text-primary">{day.location === 'academia' ? 'Academia' : 'Em casa'} · exercício {store.currentExerciseIndex + 1} de {exercises.length}</p><h1 className="truncate text-lg font-extrabold">{presentation.name}</h1></div>
        <button type="button" onClick={store.session?.pausedAt ? store.resumeSession : store.pauseSession} aria-label={store.session?.pausedAt ? 'Retomar sessão' : 'Pausar sessão'} className="grid size-10 place-items-center rounded-xl border border-input bg-secondary">{store.session?.pausedAt ? <CirclePlay className="size-4" /> : <CirclePause className="size-4" />}</button>
        <div className={`flex items-center gap-1 text-[10px] ${syncState === 'offline' || pending ? 'text-[var(--warn-tint)]' : 'text-muted-foreground'}`}>{syncState === 'offline' ? <WifiOff className="size-3.5" /> : null}{pending ? `${pending} pendente${pending === 1 ? '' : 's'}` : 'Sincronizado'}</div>
      </header>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground"><span>{progress}% concluído</span><span>{completedSets}/{totalSets} séries</span></div>

      <section className="mt-4 flex-1 space-y-3">
        <CoreExerciseImage src={presentation.imageUrl} alt={presentation.imageAlt} priority className="aspect-[4/3] w-full rounded-[22px] border border-border" />

        <div className="surface-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div><p className="metric-label">{editingSet ? 'Revisando série' : 'Série atual'}</p><p className="mt-1 font-mono text-3xl font-black">{editingSet?.setNumber ?? Math.min(nextSetNumber, exercise.effectiveSets)}<span className="text-base font-medium text-muted-foreground">/{exercise.effectiveSets}</span></p></div>
            <div className="text-right"><p className="metric-label">Alvo</p><p className="mt-1 font-mono text-lg font-bold">{targetLabel}</p>{exercise.effectiveRir != null && <p className="text-[10px] text-muted-foreground">RIR {exercise.effectiveRir}</p>}</div>
          </div>
          <div className="mt-4 rounded-xl bg-primary/[0.08] p-3 text-xs leading-relaxed"><strong className="text-primary">Foco:</strong> {presentation.shortCue}</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <details className="rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-semibold text-foreground">Como executar</summary>
              <ol className="mt-2 space-y-2">{presentation.instructions.map((instruction, index) => <li key={instruction} className="flex gap-2"><span className="font-mono text-primary">{index + 1}.</span><span>{instruction}</span></li>)}</ol>
            </details>
            <details className="rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-semibold text-foreground">Erros comuns</summary>
              <ul className="mt-2 space-y-2">{presentation.commonMistakes.map((mistake) => <li key={mistake} className="flex gap-2"><span className="text-[var(--warn-tint)]">•</span><span>{mistake}</span></li>)}</ul>
            </details>
          </div>
        </div>

        {exercise.variations.length > 0 && (
          <section className="surface-card p-4" aria-labelledby="variation-title">
            <div className="flex items-center justify-between gap-3"><h2 id="variation-title" className="metric-label">Escolha a variação</h2><span className="text-[10px] text-muted-foreground">toque para comparar</span></div>
            <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1">
              {exercise.variations.map((variation) => {
                const option = resolveCoreExercise(exercise, variation.id)
                const selected = selectedVariationId === variation.id
                return (
                  <button key={variation.id} type="button" aria-pressed={selected} onClick={() => selectVariation(variation.id)} className={`w-32 shrink-0 snap-start overflow-hidden rounded-xl border text-left transition-colors ${selected ? 'border-primary bg-primary/[0.08]' : 'border-border bg-secondary/40'}`}>
                    <CoreExerciseImage src={option.imageUrl} alt="" className="aspect-[4/3] w-full" sizes="128px" />
                    <span className="block p-2 text-[10px] font-semibold leading-tight">{variation.name}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {presentation.measureType === 'tempo' ? (
          <TimerControls timer={store.executionTimer} label="Cronômetro de execução" onStart={() => store.startExecutionTimer(presentation.targetSecondsMin ?? 20)} onPause={store.pauseExecutionTimer} onResume={store.resumeExecutionTimer} onRestart={store.restartExecutionTimer} onAdd={() => store.addExecutionSeconds(10)} onStop={store.stopExecutionTimer} />
        ) : (
          <div className={`surface-card grid gap-3 p-4 ${tracksRir ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <Field label={presentation.measureType === 'respiracoes' ? 'Respirações' : 'Repetições'} value={reps} onChange={setReps} min={0} />
            {tracksRir && <Field label="Carga opcional (kg)" value={weight} onChange={setWeight} min={0} step="0.5" placeholder="—" inputMode="decimal" />}
          </div>
        )}

        <details className="surface-card p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
            <span>Feedback da série</span>
            <span className={`rounded-full px-2 py-1 text-[10px] ${pain === 'sem_dor' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>{quality === 'boa' ? 'Boa' : QUALITY_OPTIONS.find((item) => item.value === quality)?.label} · {pain === 'sem_dor' ? 'Sem dor' : PAIN_OPTIONS.find((item) => item.value === pain)?.label}</span>
          </summary>
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            {tracksRir && (
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="metric-label">Qualidade</span><select value={quality} onChange={(event) => setQuality(event.target.value as DailyCoreExecutionQuality)} className="mt-1.5 h-11 w-full rounded-xl border border-input bg-secondary px-3 text-sm">{QUALITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                <Field label="RIR" value={rir} onChange={setRir} min={0} max={10} />
              </div>
            )}
            {(exercise.slug === 'ab-wheel' || exercise.slug.includes('prancha')) && <label className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3 text-xs font-semibold"><input type="checkbox" checked={lumbarControlled} onChange={(event) => setLumbarControlled(event.target.checked)} className="size-4 accent-primary" /> Lombar controlada durante toda a série</label>}
            <label className="block"><span className="metric-label">Dor ou desconforto</span><select value={pain} onChange={(event) => setPain(event.target.value as DailyCorePainLevel)} className="mt-1.5 h-11 w-full rounded-xl border border-input bg-secondary px-3 text-sm">{PAIN_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="block"><span className="metric-label">Observação opcional</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className="mt-1.5 w-full rounded-xl border border-input bg-secondary p-3 text-sm" /></label>
            {(pain === 'dor_moderada' || pain === 'dor_forte' || pain === 'dor_lombar') && <p className="flex gap-2 text-[11px] leading-relaxed text-destructive"><ShieldAlert className="mt-0.5 size-3.5 shrink-0" />Interrompa o exercício. Procure um profissional se a dor for relevante, progressiva ou persistente.</p>}
          </div>
        </details>

        {(store.restTimer.endsAt != null || store.restTimer.pausedRemaining != null) && <TimerControls timer={store.restTimer} label="Descanso" onStart={() => store.startRestTimer(presentation.restSecondsMax)} onPause={store.pauseRestTimer} onResume={store.resumeRestTimer} onRestart={store.restartRestTimer} onAdd={() => store.addRestSeconds(10)} onStop={store.stopRestTimer} compact />}
      </section>

      <div className="sticky bottom-0 mt-5 space-y-2 bg-background/95 pb-[env(safe-area-inset-bottom)] pt-3 backdrop-blur-xl">
        {store.session?.pausedAt && <p className="rounded-xl bg-[var(--warn-tint)]/10 p-2 text-center text-xs font-semibold text-[var(--warn-tint)]">Sessão pausada — retome para registrar séries.</p>}
        <button type="button" onClick={completeSet} disabled={saving || Boolean(store.session?.pausedAt) || (!editingSet && nextSetNumber > exercise.effectiveSets)} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50">{saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} {editingSet ? 'Salvar correção' : 'Concluir série'}</button>
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={previousSet} disabled={completedSets === 0} className="flex h-11 items-center justify-center gap-1 rounded-xl border border-input bg-secondary text-xs font-semibold disabled:opacity-40"><ChevronLeft className="size-4" /> Série anterior</button>
          <button type="button" onClick={() => void finish(pain === 'dor_moderada' || pain === 'dor_forte' || pain === 'dor_lombar' ? 'pausa_por_dor' : 'treino')} className="flex h-11 items-center justify-center gap-1 rounded-xl border border-input bg-secondary text-xs font-semibold"><Square className="size-3.5" /> Encerrar</button>
          <button type="button" onClick={() => goToExercise(Math.min(exercises.length - 1, store.currentExerciseIndex + 1))} disabled={store.currentExerciseIndex === exercises.length - 1} className="flex h-11 items-center justify-center gap-1 rounded-xl border border-input bg-secondary text-xs font-semibold disabled:opacity-40">Próximo <ChevronRight className="size-4" /></button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, min, max, step = '1', placeholder, disabled, inputMode = 'numeric' }: { label: string; value: string; onChange: (value: string) => void; min?: number; max?: number; step?: string; placeholder?: string; disabled?: boolean; inputMode?: 'numeric' | 'decimal' }) {
  return <label><span className="metric-label">{label}</span><input type="number" inputMode={inputMode} value={value} onChange={(event) => onChange(event.target.value)} min={min} max={max} step={step} placeholder={placeholder} disabled={disabled} className="mt-1.5 h-12 w-full rounded-xl border border-input bg-secondary px-2 text-center font-mono text-base font-bold outline-none focus:border-primary disabled:opacity-40" /></label>
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
