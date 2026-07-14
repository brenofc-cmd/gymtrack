'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  CheckCircle2,
  CircleAlert,
  Dumbbell,
  MoreHorizontal,
  NotebookPen,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getExerciseImage } from '@/lib/exercise-media'
import { backoffWeight } from '@/lib/training/strength'
import { getLoadInputConfig } from '@/lib/training/load-input'
import { useSessionStore, type LocalSetLog } from '@/lib/store/sessionStore'
import { createClient } from '@/lib/supabase/client'
import {
  persistSetLog,
  removePersistedSetLog,
} from '@/lib/offline/syncQueue'
import type { ProgressionSuggestion } from '@/lib/progression/progression'
import type { WorkoutExerciseWithExercise } from '@/types/database'
import { ExerciseActionsSheet } from './ExerciseActionsSheet'
import { PreviousPerformanceSummary } from './PreviousPerformanceSummary'
import { WarmupSetList } from './WarmupSetList'
import { WorkingSetList } from './WorkingSetList'
import type { SetDraft, SetSaveState } from './SetRow'

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
  const {
    sets: storeSets,
    feedback,
    variation,
    upsertSet,
    removeSet,
    startRestTimer,
    setVariation,
    setExerciseSkipped,
  } = useSessionStore()
  const selectedVariation = variation[workoutExercise.id] ?? null
  const selectedExercise = workoutExercise.substitutions?.find(
    (substitution) => substitution.exercise.id === selectedVariation
  )?.exercise ?? workoutExercise.exercise
  const guidance = selectedVariation == null
    ? workoutExercise.technique_notes ?? workoutExercise.exercise.instructions ?? []
    : selectedExercise.instructions ?? []
  const loadConfig = getLoadInputConfig(selectedExercise, workoutExercise.notes)
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
    setRole: 'warmup' | 'top' | 'backoff' | 'standard',
    completed: LocalSetLog | null
  ): Promise<SetSaveState> {
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
      completed_at: completedAt,
    }

    upsertSet(workoutExercise.id, log)
    setExerciseSkipped(workoutExercise.id, false)
    if (!isWarmup && !completed) {
      startRestTimer(workoutExercise.rest_seconds, workoutExercise.id)
      if ('vibrate' in navigator) navigator.vibrate(35)
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
      execution_quality: currentFeedback?.executionQuality ?? null,
      pain_level: currentFeedback?.painLevel ?? null,
      rom_quality: currentFeedback?.romQuality ?? null,
      performed_exercise_id: selectedVariation,
      completed_at: completedAt,
    })
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
    const sourceWeight = previousCurrentSet?.weight_kg ?? previousEquivalent?.weight_kg ?? previousWeight
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
    <article className="overflow-hidden rounded-2xl bg-card shadow-[0_12px_40px_rgba(0,0,0,.2)]">
      <header className="flex items-start gap-3 px-3 pb-2 pt-3 sm:px-4">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
          <Image
            src={getExerciseImage(selectedExercise.gif_url)}
            alt={`Demonstração de ${selectedExercise.name_pt}`}
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
            Exercício {exerciseNumber} de {totalExercises}
          </p>
          <h1 className="mt-0.5 text-base font-extrabold leading-tight text-foreground sm:text-lg">
            {selectedExercise.name_pt}
          </h1>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {workoutExercise.target_sets} × {workoutExercise.target_reps_min}–{workoutExercise.target_reps_max}
            {' · '}RIR {workoutExercise.rir_min === workoutExercise.rir_max
              ? workoutExercise.rir_min
              : `${workoutExercise.rir_min ?? '—'}–${workoutExercise.rir_max ?? '—'}`}
            {' · '}Descanso {Math.floor(workoutExercise.rest_seconds / 60)}:{String(workoutExercise.rest_seconds % 60).padStart(2, '0')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActionsOpen(true)}
          aria-label={`Ações de ${selectedExercise.name_pt}`}
          className="grid size-12 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <MoreHorizontal className="size-5" />
        </button>
      </header>

      <div className="space-y-2 px-2.5 pb-3 sm:px-4">
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
                  ? 'bg-[#ffb547]/10 text-[#ffcf7a]'
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

        <PreviousPerformanceSummary
          sets={relevantPreviousSets}
          bestWeight={selectedVariation == null ? bestWeight : null}
          loadConfig={loadConfig}
        />

        <WarmupSetList
          workingWeightKg={previousWeight}
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

      <ExerciseActionsSheet
        open={actionsOpen}
        onOpenChange={setActionsOpen}
        sessionId={sessionId}
        workoutExercise={workoutExercise}
        selectedVariation={selectedVariation}
        onSelectVariation={(exerciseId) => setVariation(workoutExercise.id, exerciseId)}
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
    </article>
  )
}
