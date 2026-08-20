'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  BookOpen,
  CircleAlert,
  Dumbbell,
  Expand,
  MoreHorizontal,
  NotebookPen,
  ShieldAlert,
  TimerReset,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExerciseAnimation } from '@/components/exercise/ExerciseAnimation'
import { backoffWeight } from '@/lib/training/strength'
import { getLoadInputConfig } from '@/lib/training/load-input'
import { timerIsActive, useSessionStore, type LocalSetLog } from '@/lib/store/sessionStore'
import { createClient } from '@/lib/supabase/client'
import {
  persistSetLog,
  removePersistedSetLog,
} from '@/lib/offline/syncQueue'
import type { ProgressionSuggestion } from '@/lib/progression/progression'
import type { WorkoutExerciseWithExercise } from '@/types/database'
import { ExerciseActionsSheet } from './ExerciseActionsSheet'
import { ExerciseFeedbackPanel } from './ExerciseFeedbackPanel'
import { PreviousPerformanceSummary } from './PreviousPerformanceSummary'
import { WarmupSetList } from './WarmupSetList'
import { WorkingSetList } from './WorkingSetList'
import type { SetDraft, SetSaveState } from './SetRow'
import { formatPrescription, formatRir, formatRest, rmEffortGuidance } from '@/lib/training/prescription'
import { classifyExerciseStimulus, LOAD_INTENSITY_HINT, LOAD_INTENSITY_LABEL } from '@/lib/training/stimulus'
import { TrainingStimulusBadge } from '@/components/workout/TrainingStimulusBadge'
import {
  MAX_EFFORT_SAFETY_WARNING,
  ONE_RM_CONFIRMATION_TEXT,
  REST_RECOMMENDATION_NOTE,
} from '@/lib/routine/david-laid-gymshark-exact-v7'
import type { LoadRecommendation } from '@/lib/training/dup-progression'
import { requestNotificationPermissionSafely, safeVibrate } from '@/lib/utils/browser-feedback'
import { enableRestPush, scheduleRestPush } from '@/lib/push/client'
import { WhyThisWeightSheet } from './WhyThisWeightSheet'
import { PlateBreakdownSheet } from './PlateBreakdownSheet'
import { ExerciseDetailSheet } from './ExerciseDetailSheet'
import { MuscleMapSheet } from './MuscleMapSheet'

export interface PreviousExerciseSet {
  set_number: number
  weight_kg: number | null
  reps: number
  rir: number | null
  is_warmup: boolean
  pain_level: string | null
  execution_quality: string | null
  completed_at: string | null
}

interface CurrentExercisePanelProps {
  sessionId: string
  workoutExercise: WorkoutExerciseWithExercise
  exerciseNumber: number
  totalExercises: number
  previousSets: PreviousExerciseSet[]
  bestWeight: number | null
  progression: ProgressionSuggestion | null
  recommendedLoad?: LoadRecommendation | null
  userId?: string
  programBlockId?: string | null
  isDeload?: boolean
  equipmentProfile?: { barWeightKg: number; smallestPlateKg: number }
  history: Array<{ date: string; maxWeight: number; totalVolume: number; maxReps: number }>
  showWarmupPlan: boolean
  canMoveEarlier: boolean
  canMoveLater: boolean
  onMoveEarlier: () => void
  onMoveLater: () => void
  onSkip: () => void
  onNextExercise: () => void
  hasNextExercise: boolean
}

export function CurrentExercisePanel({
  sessionId,
  workoutExercise,
  exerciseNumber,
  totalExercises,
  previousSets,
  bestWeight,
  progression,
  recommendedLoad = null,
  userId,
  programBlockId,
  isDeload = false,
  equipmentProfile = { barWeightKg: 20, smallestPlateKg: 1.25 },
  history,
  showWarmupPlan,
  canMoveEarlier,
  canMoveLater,
  onMoveEarlier,
  onMoveLater,
  onSkip,
  onNextExercise,
  hasNextExercise,
}: CurrentExercisePanelProps) {
  const [actionsOpen, setActionsOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [musclesOpen, setMusclesOpen] = useState(false)
  const [rmSafetyConfirmed, setRmSafetyConfirmed] = useState(false)
  const [whyOpen, setWhyOpen] = useState(false)
  const [plateOpen, setPlateOpen] = useState(false)
  const {
    sets: storeSets,
    feedback,
    variation,
    upsertSet,
    removeSet,
    startRestTimer,
    setRestPushJobId,
    setVariation,
    setExerciseSkipped,
    restTimer,
  } = useSessionStore()
  const isRestingThisExercise = restTimer.workoutExerciseId === workoutExercise.id && timerIsActive(restTimer)
  const selectedVariation = variation[workoutExercise.id] ?? null
  const selectedExercise = workoutExercise.substitutions?.find(
    (substitution) => substitution.exercise.id === selectedVariation
  )?.exercise ?? workoutExercise.exercise
  const guidance = selectedVariation == null
    ? workoutExercise.technique_notes ?? workoutExercise.exercise.instructions ?? []
    : selectedExercise.instructions ?? []
  const loadConfig = getLoadInputConfig(selectedExercise, workoutExercise.notes)
  const stimulus = classifyExerciseStimulus({
    prescription_type: workoutExercise.prescription_type,
    target_reps_min: workoutExercise.target_reps_min,
    target_reps_max: workoutExercise.target_reps_max,
    exercise_type: selectedExercise.exercise_type,
  })
  const allLogged = storeSets[workoutExercise.id] ?? []
  const completedSets = allLogged.filter((set) => !set.is_warmup)
  const warmupSets = allLogged.filter((set) => set.is_warmup)
  const allDone = completedSets.length >= workoutExercise.target_sets
  const relevantPreviousSets = selectedVariation == null ? previousSets : []
  const previousWorkSets = relevantPreviousSets.filter((set) => !set.is_warmup)
  const previousWeight = previousWorkSets[0]?.weight_kg ?? null
  const currentFeedback = feedback[workoutExercise.id]
  const hasPain = currentFeedback?.painLevel != null && currentFeedback.painLevel !== 'nenhuma'
  const hasNote = Boolean(currentFeedback?.notes.trim())

  async function saveSet(
    setNumber: number,
    draft: SetDraft,
    isWarmup: boolean,
    setRole: 'warmup' | 'top' | 'backoff' | 'standard' | 'rm_effort',
    completed: LocalSetLog | null
  ): Promise<SetSaveState> {
    if (
      setRole === 'rm_effort' &&
      workoutExercise.rep_max_target === 1 &&
      (draft.attemptResult === 'completed' || draft.attemptResult === 'personal_record') &&
      !rmSafetyConfirmed
    ) {
      throw new Error('Confirme que compreende a tentativa de 1RM antes de validá-la.')
    }
    if (
      !isWarmup &&
      setNumber === workoutExercise.target_sets &&
      (
        currentFeedback?.executionQuality == null ||
        currentFeedback.painLevel == null ||
        currentFeedback.romQuality == null ||
        currentFeedback.externalAssistance == null
      )
    ) {
      throw new Error(
        'Antes da última série, confirme execução, amplitude, dor e ajuda externa.'
      )
    }
    const id = completed?.id ?? crypto.randomUUID()
    const completedAt = completed?.completed_at ?? new Date().toISOString()
    const log: LocalSetLog = {
      id,
      set_number: setNumber,
      weight_kg: draft.weight,
      reps: draft.reps,
      rir: isWarmup ? null : draft.rir,
      is_warmup: isWarmup,
      set_role: setRole,
      attempt_result: draft.attemptResult ?? null,
      is_deload: isDeload,
      external_assistance: currentFeedback?.externalAssistance ?? null,
      completed_at: completedAt,
    }

    upsertSet(workoutExercise.id, log)
    setExerciseSkipped(workoutExercise.id, false)
    if (!isWarmup && !completed) {
      // O pedido ocorre dentro do gesto de concluir série; navegadores móveis
      // normalmente bloqueiam pedidos de permissão feitos fora desse contexto.
      requestNotificationPermissionSafely()
      startRestTimer(workoutExercise.rest_seconds, workoutExercise.id)
      safeVibrate(35)
      void enableRestPush().then((enabled) => {
        if (!enabled) return
        const endsAt = Date.now() + workoutExercise.rest_seconds * 1000
        return scheduleRestPush(endsAt, workoutExercise.id).then(setRestPushJobId)
      })
    }

    const result = await persistSetLog(createClient(), {
      id,
      sessionId,
      workoutExerciseId: workoutExercise.id,
      set_number: setNumber,
      weight_kg: draft.weight,
      reps: draft.reps,
      rir: isWarmup ? null : draft.rir,
      is_warmup: isWarmup,
      set_role: setRole,
      attempt_result: draft.attemptResult ?? null,
      is_deload: isDeload,
      execution_quality: currentFeedback?.executionQuality ?? null,
      pain_level: currentFeedback?.painLevel ?? null,
      rom_quality: currentFeedback?.romQuality ?? null,
      external_assistance: currentFeedback?.externalAssistance ?? null,
      performed_exercise_id: selectedVariation,
      completed_at: completedAt,
    })
    // Ao concluir a última série válida, segue automaticamente para o próximo
    // exercício. O botão de volta no cabeçalho mantém a visão geral acessível.
    if (!isWarmup && !completed && setNumber === workoutExercise.target_sets && hasNextExercise) {
      window.setTimeout(onNextExercise, 250)
    }
    return result.queued ? 'queued' : 'saved'
  }

  async function removeWarmup(completed: LocalSetLog) {
    removeSet(workoutExercise.id, completed)
    if (completed.id) await removePersistedSetLog(createClient(), completed.id)
  }

  function getDefaultForSet(setIndex: number) {
    const previousCurrentSet = completedSets.find((set) => set.set_number === setIndex)
    const previousEquivalent = previousWorkSets.find((set) => set.set_number === setIndex + 1)
    const topSet = completedSets.find((set) => set.set_number === 1)
    const isBackoff = workoutExercise.top_set_enabled && setIndex > 0
    const sourceWeight = previousCurrentSet?.weight_kg
      ?? recommendedLoad?.suggestedKg
      ?? previousEquivalent?.weight_kg
      ?? previousWeight
    const sourceReps = previousCurrentSet?.reps ?? previousEquivalent?.reps

    if (isBackoff && (topSet?.weight_kg ?? sourceWeight) != null) {
      return {
        weight: backoffWeight(
          topSet?.weight_kg ?? sourceWeight ?? 0,
          workoutExercise.backoff_percentage ?? 7.5,
          loadConfig.incrementKg || 2.5
        ),
        reps: sourceReps ?? Math.max(workoutExercise.target_reps_min, 8),
      }
    }

    return {
      weight: sourceWeight,
      reps: sourceReps ?? workoutExercise.target_reps_min,
    }
  }

  const progressionLabel = progression?.action === 'aumentar'
    ? progression.loadAdjustment === 'decrease_assistance'
      ? `Reduzir assistência${progression.incrementKg ? ` ${progression.incrementKg} kg` : ''}`
      : `Progredir${progression.incrementKg ? ` +${progression.incrementKg} kg` : ''}`
    : progression?.action === 'revisar'
      ? 'Revisar carga'
      : progression?.action === 'bloquear_por_dor'
        ? 'Progressão bloqueada'
        : progression ? 'Manter carga' : null

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_16px_44px_rgba(0,0,0,.24)]">
      <header className="px-3 pb-3 pt-3 sm:px-4">
        <div className="relative mx-auto h-44 w-full max-w-md overflow-hidden rounded-2xl bg-secondary sm:h-56">
          <ExerciseAnimation
            name={selectedExercise.name_pt}
            primaryMuscle={selectedExercise.muscle_group}
            movementPattern={selectedExercise.movement_pattern}
            mediaUrl={selectedExercise.gif_url}
          />
          {isRestingThisExercise && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/92 text-muted-foreground">
              <TimerReset className="size-10" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Descanso</span>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-start gap-2">
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
              Exercício {exerciseNumber} de {totalExercises}
            </p>
            <h1 className="mt-0.5 text-lg font-extrabold leading-tight text-foreground">
              {selectedExercise.name_pt}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
              <TrainingStimulusBadge
                exercise={{
                  prescription_type: workoutExercise.prescription_type,
                  target_reps_min: workoutExercise.target_reps_min,
                  target_reps_max: workoutExercise.target_reps_max,
                  exercise_type: selectedExercise.exercise_type,
                }}
              />
              <span className="inline-flex items-center rounded-full border border-input bg-secondary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-foreground">
                {LOAD_INTENSITY_LABEL[stimulus]}
              </span>
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
              {LOAD_INTENSITY_HINT[stimulus]}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {formatPrescription(workoutExercise, { perSide: selectedExercise.is_unilateral })}
              {' · '}RIR {formatRir(workoutExercise.rir_min, workoutExercise.rir_max)}
            </p>
            {(workoutExercise.source_prescription || workoutExercise.guided_prescription) && (
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                {workoutExercise.source_prescription}
                {workoutExercise.source_prescription && workoutExercise.guided_prescription && ' · '}
                {workoutExercise.guided_prescription}
                {workoutExercise.guided_reps_fixed != null && ` (alvo guiado: ${workoutExercise.guided_reps_fixed})`}
              </p>
            )}
            {formatRest(workoutExercise).isAppSuggested && (
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{REST_RECOMMENDATION_NOTE}</p>
            )}
            {workoutExercise.superset_group != null && (
              <p className="mt-1 text-[10px] font-semibold text-primary">
                Superset {workoutExercise.superset_group}: alterne com o exercício do mesmo grupo.
                Aumente o descanso se a execução piorar.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActionsOpen(true)}
            aria-label={`Ações de ${selectedExercise.name_pt}`}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-input text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <MoreHorizontal className="size-5" />
          </button>
        </div>
      </header>

      <div className="space-y-2 px-2.5 pb-3 sm:px-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-secondary/70 px-2 py-2 text-center">
            <p className="text-base font-extrabold tabular-nums text-foreground">{workoutExercise.target_sets}</p>
            <p className="text-[9px] font-semibold text-muted-foreground">Séries</p>
          </div>
          <div className="rounded-xl bg-secondary/70 px-2 py-2 text-center">
            <p className="text-base font-extrabold tabular-nums text-foreground">{formatPrescription(workoutExercise, { perSide: selectedExercise.is_unilateral })}</p>
            <p className="text-[9px] font-semibold text-muted-foreground">Repetições</p>
          </div>
          <div className="rounded-xl bg-secondary/70 px-2 py-2 text-center">
            <p className="text-base font-extrabold tabular-nums text-foreground">{formatRest(workoutExercise).label}</p>
            <p className="text-[9px] font-semibold text-muted-foreground">Descanso</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 py-1">
          {Array.from({ length: workoutExercise.target_sets }, (_, i) => {
            const done = i < completedSets.length
            const isCurrent = i === completedSets.length
            const isCurrentResting = isCurrent && isRestingThisExercise
            return (
              <span
                key={i}
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-colors',
                  done
                    ? 'bg-primary text-primary-foreground'
                    : isCurrentResting
                      ? 'bg-[var(--warn-tint)] text-white'
                      : isCurrent
                        ? 'border-2 border-primary text-primary'
                        : 'bg-secondary text-muted-foreground'
                )}
                aria-label={`Série ${i + 1}: ${done ? 'concluída' : isCurrentResting ? 'em descanso' : isCurrent ? 'atual' : 'pendente'}`}
              >
                {done ? <CheckCircle2 className="size-4" /> : i + 1}
              </span>
            )
          })}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-input bg-secondary/30 text-[10px] font-bold text-foreground transition-colors hover:border-primary/45 hover:bg-primary/10"
          >
            <BookOpen className="size-4 text-primary" /> Execução
          </button>
          <button
            type="button"
            onClick={() => setMusclesOpen(true)}
            className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-input bg-secondary/30 text-[10px] font-bold text-foreground transition-colors hover:border-primary/45 hover:bg-primary/10"
          >
            <Dumbbell className="size-4 text-primary" /> Músculos
          </button>
          <button
            type="button"
            onClick={() => setActionsOpen(true)}
            className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-input bg-secondary/30 text-[10px] font-bold text-foreground transition-colors hover:border-primary/45 hover:bg-primary/10"
          >
            <Expand className="size-4 text-primary" /> Opções
          </button>
        </div>
        <div className="flex min-h-7 flex-wrap items-center gap-1.5 px-0.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[9px] font-semibold text-muted-foreground">
            <Dumbbell className="size-3" /> {loadConfig.loadLabel}
          </span>
          {progressionLabel && (
            <span className={cn(
              'rounded-full px-2 py-1 text-[9px] font-bold',
              progression?.action === 'bloquear_por_dor'
                ? 'bg-destructive/10 text-destructive'
                : progression?.action === 'revisar'
                  ? 'bg-[var(--warn-tint)]/10 text-[var(--warn-text)]'
                  : 'bg-primary/10 text-primary'
            )}>
              {progressionLabel}
            </span>
          )}
          {hasPain && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-[9px] font-bold text-destructive">
              <ShieldAlert className="size-3" /> Dor registrada
            </span>
          )}
          {hasNote && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[9px] text-muted-foreground">
              <NotebookPen className="size-3" /> Com nota
            </span>
          )}
        </div>

        <details className="group rounded-2xl border border-border bg-secondary/20 px-3 py-2">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-bold text-foreground">
            Detalhes, carga e avaliação
            <span className="text-[10px] font-semibold text-primary group-open:hidden">ABRIR</span>
            <span className="hidden text-[10px] font-semibold text-primary group-open:inline">FECHAR</span>
          </summary>
          <div className="mt-3 space-y-2">
            <PreviousPerformanceSummary
              sets={relevantPreviousSets}
              bestWeight={selectedVariation == null ? bestWeight : null}
              loadConfig={loadConfig}
            />
            {isDeload && (
              <div className="rounded-xl border border-[var(--warn-tint)]/30 bg-[var(--warn-tint)]/10 px-3 py-2 text-[11px] text-[var(--warn-text)]">
                Semana de deload: aproximadamente 40% menos séries, RIR 3–4 e nenhuma recomendação de aumento de carga.
              </div>
            )}
            <div className={cn('rounded-xl border px-3 py-2 text-[11px] leading-relaxed', recommendedLoad?.action === 'stop' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-primary/20 bg-primary/[0.06] text-muted-foreground')}>
              <p className="font-bold text-foreground">Progressão individual calculada pelo GymTrack</p>
              <p className="mt-0.5">{recommendedLoad?.suggestedKg != null ? `Carga sugerida: ${recommendedLoad.suggestedKg} kg. ${recommendedLoad.reason}` : recommendedLoad?.reason ?? 'Sem histórico ou máxima de referência: escolha a carga manualmente.'}</p>
              {recommendedLoad?.requiresManualConfirmation && <p className="mt-1 font-semibold text-[var(--warn-text)]">Confirmação manual obrigatória; a carga não aumenta sozinha.</p>}
              {loadConfig.acceptsLoad && <div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => setWhyOpen(true)} className="rounded-lg border border-input bg-background/40 px-2.5 py-1 text-[10px] font-bold text-foreground">Por que este peso?</button>{loadConfig.kind === 'external_total' && <button type="button" onClick={() => setPlateOpen(true)} className="rounded-lg border border-input bg-background/40 px-2.5 py-1 text-[10px] font-bold text-foreground">Ver montagem da barra</button>}</div>}
            </div>
            <div className="rounded-xl border border-border bg-background/20 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Avaliação da série</p>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">Obrigatória antes da última série para confirmar execução, amplitude, ajuda e dor.</p>
              <ExerciseFeedbackPanel sessionId={sessionId} workoutExerciseId={workoutExercise.id} hasSubstitutions={(workoutExercise.substitutions?.length ?? 0) > 0} />
            </div>
            {workoutExercise.prescription_type === 'rep_max_effort' && <div className="rounded-xl border border-[var(--warn-tint)]/30 bg-[var(--warn-tint)]/10 px-3 py-2 text-[11px] leading-relaxed text-[var(--warn-text)]"><p className="font-semibold text-foreground">{MAX_EFFORT_SAFETY_WARNING}</p>{workoutExercise.rep_max_target != null && <p className="mt-1">{rmEffortGuidance(workoutExercise.rep_max_target)}</p>}<p className="mt-1">Use travas. No supino, tenha spotter. Interrompa com dor, falha anterior, sintomas incomuns ou perda grave de técnica.</p>{workoutExercise.rep_max_target === 1 && <label className="mt-2 flex items-start gap-2 rounded-lg bg-background/35 p-2 font-semibold text-foreground"><input type="checkbox" checked={rmSafetyConfirmed} onChange={(event) => setRmSafetyConfirmed(event.target.checked)} className="mt-0.5 size-4" />{ONE_RM_CONFIRMATION_TEXT}</label>}</div>}
          </div>
        </details>

        <WarmupSetList
          workingWeightKg={recommendedLoad?.suggestedKg ?? previousWeight}
          loadConfig={loadConfig}
          completedSets={warmupSets}
          enabled={showWarmupPlan}
          onSave={(setNumber, draft, completed) =>
            saveSet(setNumber, draft, true, 'warmup', completed)
          }
          onRemove={removeWarmup}
        />

        <WorkingSetList
          totalSets={workoutExercise.target_sets}
          topSetEnabled={workoutExercise.top_set_enabled}
          prescriptionType={workoutExercise.prescription_type}
          defaultSetRole={workoutExercise.default_set_role}
          loadConfig={loadConfig}
          targetRirMin={workoutExercise.rir_min}
          targetRirMax={workoutExercise.rir_max}
          completedSets={completedSets}
          previousSets={previousWorkSets}
          getDefault={getDefaultForSet}
          onSave={(setNumber, setRole, draft, completed) =>
            saveSet(setNumber, draft, false, setRole, completed)
          }
        />

        {allDone && (
          <div className="flex items-center gap-3 rounded-xl bg-primary/[0.08] px-3 py-3">
            <CheckCircle2 className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-primary">Exercício concluído</p>
              <p className="text-[10px] text-muted-foreground">Você ainda pode revisar e editar as séries.</p>
            </div>
            {hasNextExercise && (
              <button
                type="button"
                onClick={onNextExercise}
                className="min-h-11 rounded-xl bg-primary px-3 text-xs font-extrabold text-primary-foreground"
              >
                Ir ao próximo
              </button>
            )}
          </div>
        )}

        {hasPain && (currentFeedback?.painLevel === 'moderada' || currentFeedback?.painLevel === 'forte') && (
          <div className="flex gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            Interrompa este exercício e revise uma alternativa segura. Se a dor persistir, procure avaliação profissional.
          </div>
        )}
      </div>

      <WhyThisWeightSheet
        open={whyOpen}
        onOpenChange={setWhyOpen}
        input={recommendedLoad?.suggestedKg != null ? {
          recommendedLoadKg: recommendedLoad.suggestedKg,
          percentageOfE1rm: workoutExercise.percentage_of_e1rm ?? null,
          targetRir: workoutExercise.rir_min,
          lastSession: previousWorkSets[0] ? {
            weightKg: previousWorkSets[0].weight_kg ?? 0,
            setsCompleted: `${previousWorkSets.length}×${previousWorkSets[0].reps}`,
            technique: previousWorkSets[0].execution_quality ?? 'não registrada',
            rir: previousWorkSets[0].rir ?? 0,
          } : null,
        } : null}
      />

      <PlateBreakdownSheet
        open={plateOpen}
        onOpenChange={setPlateOpen}
        totalKg={recommendedLoad?.suggestedKg ?? previousWeight}
        equipment={equipmentProfile}
      />

      <ExerciseActionsSheet
        open={actionsOpen}
        onOpenChange={setActionsOpen}
        sessionId={sessionId}
        workoutExercise={workoutExercise}
        selectedVariation={selectedVariation}
        onSelectVariation={(exerciseId) => {
          setVariation(workoutExercise.id, exerciseId)
          if (userId && programBlockId) {
            void createClient().from('block_exercise_choices').upsert({
              user_id: userId,
              block_id: programBlockId,
              workout_exercise_id: workoutExercise.id,
              selected_exercise_id: exerciseId,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'block_id,workout_exercise_id' })
          }
        }}
        history={history}
        progression={progression}
        guidance={guidance}
        canMoveEarlier={canMoveEarlier}
        canMoveLater={canMoveLater}
        onMoveEarlier={onMoveEarlier}
        onMoveLater={onMoveLater}
        onSkip={() => {
          setExerciseSkipped(workoutExercise.id, true)
          setActionsOpen(false)
          onSkip()
        }}
      />
      <ExerciseDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        exercise={selectedExercise}
        guidance={guidance}
        history={selectedVariation == null ? history : []}
      />
      <MuscleMapSheet
        open={musclesOpen}
        onOpenChange={setMusclesOpen}
        exercise={selectedExercise}
      />
    </article>
  )
}
