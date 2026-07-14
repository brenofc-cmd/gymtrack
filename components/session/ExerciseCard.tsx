'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  CheckCircle2,
  Flame,
  TrendingUp,
  MinusCircle,
  AlertTriangle,
  OctagonAlert,
  Repeat2,
  BookOpen,
  Plus,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getExerciseImage } from '@/lib/exercise-media'
import { SetRow } from './SetRow'
import { ExerciseFeedbackPanel } from './ExerciseFeedbackPanel'
import { ExerciseDetailSheet } from './ExerciseDetailSheet'
import { ExerciseSwapSheet } from './ExerciseSwapSheet'
import { WarmupPanel } from './WarmupPanel'
import { useSessionStore } from '@/lib/store/sessionStore'
import { createClient } from '@/lib/supabase/client'
import { persistSetLog } from '@/lib/offline/syncQueue'
import { buildWarmupPlan } from '@/lib/progression/warmup'
import { MOVEMENT_PATTERN_LABEL, AVISO_ABDOMEN } from '@/lib/routine/powerbuilding-v4'
import { backoffWeight } from '@/lib/training/strength'
import type { ProgressionSuggestion } from '@/lib/progression/progression'
import type { WorkoutExerciseWithExercise } from '@/types/database'

interface ExerciseCardProps {
  sessionId: string
  workoutExercise: WorkoutExerciseWithExercise
  isOpen: boolean
  onToggle: () => void
  lastWeight: number | null
  lastReps: number | null
  lastRir: number | null
  prWeight: number | null
  progression: ProgressionSuggestion | null
  history: Array<{ date: string; maxWeight: number; totalVolume: number; maxReps: number }>
  /** Mostra plano de aquecimento (primeiro composto do treino) */
  showWarmupPlan: boolean
  onAllSetsComplete: () => void
}

const PROGRESSION_STYLE: Record<
  ProgressionSuggestion['action'],
  { icon: typeof TrendingUp; className: string; title: string }
> = {
  aumentar: {
    icon: TrendingUp,
    className: 'border-primary/30 bg-primary/10 text-primary',
    title: 'Sugestão: aumentar carga',
  },
  manter: {
    icon: MinusCircle,
    className: 'border-border bg-card text-muted-foreground',
    title: 'Sugestão: manter carga',
  },
  revisar: {
    icon: AlertTriangle,
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
    title: 'Sugestão: revisar carga',
  },
  bloquear_por_dor: {
    icon: OctagonAlert,
    className: 'border-destructive/40 bg-destructive/10 text-destructive',
    title: 'Progressão bloqueada por dor',
  },
}

export function ExerciseCard({
  sessionId,
  workoutExercise,
  isOpen,
  onToggle,
  lastWeight,
  lastReps,
  lastRir,
  prWeight,
  progression,
  history,
  showWarmupPlan,
  onAllSetsComplete,
}: ExerciseCardProps) {
  const { exercise } = workoutExercise
  const substitutions = workoutExercise.substitutions ?? []
  const {
    sets: storeSets,
    logSet,
    startRestTimer,
    variation,
    setVariation,
    feedback,
  } = useSessionStore()

  const allLogged = storeSets[workoutExercise.id] ?? []
  const completedSets = allLogged.filter((s) => !s.is_warmup)
  const warmupSets = allLogged.filter((s) => s.is_warmup)
  const totalSets = workoutExercise.target_sets
  const allDone = completedSets.length >= totalSets
  const notifiedDoneRef = useRef(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [extraWarmupRows, setExtraWarmupRows] = useState(0)
  const [detailOpen, setDetailOpen] = useState(false)
  const [swapOpen, setSwapOpen] = useState(false)

  const selectedVariation = variation[workoutExercise.id] ?? null
  const selectedExercise =
    substitutions.find((substitution) => substitution.exercise.id === selectedVariation)?.exercise ??
    exercise
  const isAbdominal = selectedExercise.exercise_type === 'abdominal'
  const movementPattern = selectedExercise.movement_pattern

  useEffect(() => {
    if (allDone && !notifiedDoneRef.current) {
      notifiedDoneRef.current = true
      onAllSetsComplete()
    }
  }, [allDone, onAllSetsComplete])

  async function handleSetComplete(
    setNumber: number,
    weight: number | null,
    reps: number,
    rir: number | null,
    isWarmup: boolean,
    setRole: 'warmup' | 'top' | 'backoff' | 'standard'
  ) {
    const completed_at = new Date().toISOString()
    const logId = crypto.randomUUID()
    const currentFeedback = feedback[workoutExercise.id]
    logSet(workoutExercise.id, {
      set_number: setNumber,
      weight_kg: weight,
      reps,
      rir,
      is_warmup: isWarmup,
      set_role: setRole,
      completed_at,
    })

    // Aquecimento não dispara o cronômetro de descanso completo
    if (!isWarmup) {
      startRestTimer(workoutExercise.rest_seconds, workoutExercise.id)
    }

    try {
      const supabase = createClient()
      const result = await persistSetLog(supabase, {
        id: logId,
        sessionId,
        workoutExerciseId: workoutExercise.id,
        set_number: setNumber,
        weight_kg: weight,
        reps,
        rir,
        is_warmup: isWarmup,
        set_role: setRole,
        execution_quality: currentFeedback?.executionQuality ?? null,
        pain_level: currentFeedback?.painLevel ?? null,
        rom_quality: currentFeedback?.romQuality ?? null,
        performed_exercise_id: selectedVariation,
        completed_at,
      })
      if (result.queued) {
        toast.info('Sem conexão. A série será sincronizada automaticamente.')
      }
    } catch {
      toast.error('Não foi possível salvar a série. Ela está guardada localmente.')
    }
  }

  // Pré-preenchimento: última série desta sessão, senão última sessão
  function getDefaultForSet(setIndex: number) {
    const prev = completedSets[setIndex - 1]
    const isBackoff = workoutExercise.top_set_enabled && setIndex > 0
    if (prev) {
      return {
        weight: isBackoff && prev.weight_kg != null
          ? backoffWeight(prev.weight_kg, workoutExercise.backoff_percentage ?? 7.5, exercise.equipment === 'halter' ? 1 : 2.5)
          : prev.weight_kg,
        reps: isBackoff ? Math.max(workoutExercise.target_reps_min, 8) : prev.reps,
      }
    }
    return {
      weight: isBackoff && lastWeight != null
        ? backoffWeight(lastWeight, workoutExercise.backoff_percentage ?? 7.5, exercise.equipment === 'halter' ? 1 : 2.5)
        : lastWeight,
      reps: lastReps ?? workoutExercise.target_reps_min,
    }
  }

  const progressionStyle = progression ? PROGRESSION_STYLE[progression.action] : null
  const guidance =
    selectedVariation === null
      ? workoutExercise.technique_notes ?? exercise.instructions ?? []
      : selectedExercise.instructions ?? []
  const suggestedWarmups = buildWarmupPlan(lastWeight).slice(1)
  const warmupRowCount =
    Math.max(warmupSets.length, showWarmupPlan ? suggestedWarmups.length : 0) + extraWarmupRows

  return (
    <div
      className={cn(
        'rounded-2xl border overflow-hidden transition-colors',
        allDone ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
      )}
    >
      {/* Card header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
          <Image
            src={getExerciseImage(selectedExercise.gif_url)}
            alt={`Demonstração de ${selectedExercise.name_pt}`}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">
            {selectedExercise.name_pt}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {isAbdominal && movementPattern && (
              <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {MOVEMENT_PATTERN_LABEL[movementPattern as keyof typeof MOVEMENT_PATTERN_LABEL] ?? movementPattern}
              </span>
            )}
            {allDone ? (
              <span className="flex items-center gap-1 text-xs text-primary font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Concluído
              </span>
            ) : (
              Array.from({ length: totalSets }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-3 h-3 rounded-full transition-all duration-300',
                    i < completedSets.length ? 'bg-primary scale-110' : 'bg-zinc-700'
                  )}
                />
              ))
            )}
          </div>
        </div>

        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {/* Contexto: anterior, recorde, meta */}
              <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground border-b border-border pb-2">
                <span>
                  Meta:{' '}
                  <span className="text-foreground font-semibold">
                    {totalSets}×{workoutExercise.target_reps_min}–{workoutExercise.target_reps_max}
                  </span>
                </span>
                {workoutExercise.rir_min != null && (
                  <span>
                    RIR:{' '}
                    <span className="text-foreground font-semibold">
                      {workoutExercise.rir_min === workoutExercise.rir_max
                        ? workoutExercise.rir_min
                        : `${workoutExercise.rir_min}–${workoutExercise.rir_max}`}
                    </span>
                  </span>
                )}
                <span>
                  Descanso:{' '}
                  <span className="text-foreground font-semibold">
                    {workoutExercise.rest_seconds}s
                  </span>
                </span>
                {lastWeight != null && (
                  <span>
                    Anterior:{' '}
                    <span className="text-foreground font-semibold">
                      {lastWeight}kg × {lastReps}
                      {lastRir != null ? ` @RIR ${lastRir}` : ''}
                    </span>
                  </span>
                )}
                {prWeight != null && (
                  <span>
                    Recorde:{' '}
                    <span className="text-foreground font-semibold">{prWeight}kg</span>
                  </span>
                )}
              </div>

              {/* Sugestão de progressão */}
              {progression && progressionStyle && (
                <div
                  className={cn(
                    'flex gap-2 items-start rounded-xl border px-3 py-2',
                    progressionStyle.className
                  )}
                >
                  <progressionStyle.icon className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">
                      {progressionStyle.title}
                      {progression.incrementKg ? ` (+${progression.incrementKg}kg)` : ''}
                    </p>
                    <p className="text-xs opacity-90 mt-0.5">{progression.reason}</p>
                  </div>
                </div>
              )}

              <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-[10.5px] leading-relaxed text-muted-foreground">
                {workoutExercise.failure_allowed
                  ? 'Falha não é obrigatória. Somente a última série pode chegar a RIR 0–1 após adaptação, com prontidão boa, técnica controlada e sem dor.'
                  : 'Falha bloqueada neste exercício: mantenha o RIR planejado e encerre a série antes de perder técnica.'}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDetailOpen(true)}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-input bg-secondary/30 text-xs font-semibold text-[#c7d0db] transition-colors hover:border-primary/30 hover:text-primary"
                >
                  <Info className="size-3.5" />
                  Detalhes
                </button>
                <button
                  type="button"
                  onClick={() => setSwapOpen(true)}
                  disabled={substitutions.length === 0}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-input bg-secondary/30 text-xs font-semibold text-[#c7d0db] transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Repeat2 className="size-3.5" />
                  Trocar exercício
                </button>
              </div>
              {selectedVariation !== null && (
                <p className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-[10.5px] leading-relaxed text-muted-foreground">
                  Hoje: <span className="font-semibold text-primary">{selectedExercise.name_pt}</span>.
                  O histórico fica separado para não comparar cargas incompatíveis.
                </p>
              )}

              {/* Plano de aquecimento (primeiro composto) */}
              {showWarmupPlan && <WarmupPanel workingWeightKg={lastWeight} />}

              {/* Aquecimento — séries não contam no volume */}
              {(warmupRowCount > 0 || !allDone) && (
                <div className="space-y-1">
                  {warmupRowCount > 0 && (
                    <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-amber-500/90 px-1">
                      <Flame className="w-3 h-3" />
                      Aquecimento (não conta no volume)
                    </p>
                  )}
                  {Array.from({ length: warmupRowCount }, (_, i) => {
                    const completed = warmupSets[i] ?? null
                    return (
                      <SetRow
                        key={`w-${i}`}
                        setNumber={i + 1}
                        isWarmup
                        defaultWeight={suggestedWarmups[i]?.weightKg ?? null}
                        defaultReps={i === 0 ? 10 : i === 1 ? 6 : i === 2 ? 3 : null}
                        completed={completed}
                        setRole="warmup"
                        onComplete={(w, r) => handleSetComplete(i + 1, w, r, null, true, 'warmup')}
                      />
                    )
                  })}
                  {!allDone && (
                    <button
                      onClick={() => setExtraWarmupRows((n) => n + 1)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-amber-500 transition-colors px-1 py-1"
                    >
                      <Plus className="w-3 h-3" />
                      Série de aquecimento
                    </button>
                  )}
                </div>
              )}

              {/* Séries válidas */}
              <div className="space-y-1">
                <div className="grid grid-cols-[32px_1fr_1fr_44px] gap-2 px-1">
                  <span className="text-xs text-muted-foreground text-center">Série</span>
                  <span className="text-xs text-muted-foreground text-center">Peso</span>
                  <span className="text-xs text-muted-foreground text-center">Reps</span>
                  <span />
                </div>

                {Array.from({ length: totalSets }, (_, i) => {
                  const completed = completedSets[i] ?? null
                  const defaults = getDefaultForSet(i)
                  const setRole = workoutExercise.top_set_enabled
                    ? i === 0 ? 'top' : 'backoff'
                    : 'standard'
                  return (
                    <SetRow
                      key={i}
                      setNumber={i + 1}
                      setRole={setRole}
                      defaultWeight={defaults.weight}
                      defaultReps={defaults.reps}
                      targetRirMin={workoutExercise.rir_min}
                      targetRirMax={workoutExercise.rir_max}
                      completed={completed}
                      onComplete={(w, r, rir) => handleSetComplete(i + 1, w, r, rir, false, setRole)}
                    />
                  )
                })}
              </div>

              {/* Orientação curta + instruções completas */}
              {guidance.length > 0 && (
                <div className="pt-1 border-t border-border">
                  <p className="text-xs text-muted-foreground italic">{guidance[0]}</p>
                  {guidance.length > 1 && (
                    <>
                      <button
                        onClick={() => setShowInstructions((v) => !v)}
                        className="flex items-center gap-1 text-xs text-primary mt-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        {showInstructions ? 'Ocultar instruções' : 'Instruções completas'}
                      </button>
                      {showInstructions && (
                        <ul className="mt-1.5 space-y-1">
                          {guidance.slice(1).map((g, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                              <span className="text-primary shrink-0">·</span>
                              {g}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Nota do exercício (ex: repetições por lado) */}
              {workoutExercise.notes && (
                <p className="text-xs text-muted-foreground italic">
                  {workoutExercise.notes}
                </p>
              )}

              {/* Aviso discreto de abdômen */}
              {isAbdominal && (
                <p className="text-[10px] leading-relaxed text-muted-foreground/80 border-t border-border pt-2">
                  {AVISO_ABDOMEN}
                </p>
              )}

              {/* Execução / dor / observações */}
              <ExerciseFeedbackPanel
                sessionId={sessionId}
                workoutExerciseId={workoutExercise.id}
                hasSubstitutions={substitutions.length > 0}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ExerciseDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        exercise={selectedExercise}
        guidance={guidance}
        history={selectedVariation === null ? history : []}
      />
      <ExerciseSwapSheet
        open={swapOpen}
        onOpenChange={setSwapOpen}
        workoutExercise={workoutExercise}
        selectedVariation={selectedVariation}
        onSelectToday={(exerciseId) => setVariation(workoutExercise.id, exerciseId)}
      />
    </div>
  )
}
