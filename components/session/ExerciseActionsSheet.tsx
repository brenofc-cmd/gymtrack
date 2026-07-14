'use client'

import { useState } from 'react'
import {
  Ban,
  BookOpen,
  ChevronDown,
  ChevronUp,
  History,
  NotebookPen,
  Repeat2,
  ShieldAlert,
  SkipForward,
  Video,
} from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { cn } from '@/lib/utils'
import type { ProgressionSuggestion } from '@/lib/progression/progression'
import type { WorkoutExerciseWithExercise } from '@/types/database'
import { ExerciseDetailSheet } from './ExerciseDetailSheet'
import { ExerciseFeedbackPanel } from './ExerciseFeedbackPanel'
import { ExerciseSwapSheet } from './ExerciseSwapSheet'

interface ExerciseActionsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  workoutExercise: WorkoutExerciseWithExercise
  selectedVariation: string | null
  onSelectVariation: (exerciseId: string | null) => void
  history: Array<{ date: string; maxWeight: number; totalVolume: number; maxReps: number }>
  progression: ProgressionSuggestion | null
  guidance: string[]
  canMoveEarlier: boolean
  canMoveLater: boolean
  onMoveEarlier: () => void
  onMoveLater: () => void
  onSkip: (unavailable?: boolean) => void
}

export function ExerciseActionsSheet({
  open,
  onOpenChange,
  sessionId,
  workoutExercise,
  selectedVariation,
  onSelectVariation,
  history,
  progression,
  guidance,
  canMoveEarlier,
  canMoveLater,
  onMoveEarlier,
  onMoveLater,
  onSkip,
}: ExerciseActionsSheetProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [swapOpen, setSwapOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const selectedExercise = workoutExercise.substitutions?.find(
    (substitution) => substitution.exercise.id === selectedVariation
  )?.exercise ?? workoutExercise.exercise

  const openDetail = () => {
    onOpenChange(false)
    setDetailOpen(true)
  }
  const actionClass = 'flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors hover:bg-secondary'

  return (
    <>
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title="Ações do exercício"
        description={selectedExercise.name_pt}
      >
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={openDetail} className={cn(actionClass, 'border border-input bg-secondary/30')}>
            <BookOpen className="size-4 text-primary" /> Ver execução
          </button>
          <button type="button" onClick={openDetail} className={cn(actionClass, 'border border-input bg-secondary/30')}>
            <Video className="size-4 text-primary" /> Demonstração
          </button>
          <button type="button" onClick={openDetail} className={cn(actionClass, 'border border-input bg-secondary/30')}>
            <History className="size-4 text-primary" /> Histórico
          </button>
          <button
            type="button"
            onClick={() => setFeedbackOpen((value) => !value)}
            className={cn(actionClass, 'border border-input bg-secondary/30')}
          >
            <NotebookPen className="size-4 text-primary" /> Nota e dor
          </button>
        </div>

        {feedbackOpen && (
          <div className="mt-3 rounded-xl bg-secondary/30 p-3">
            <ExerciseFeedbackPanel
              sessionId={sessionId}
              workoutExerciseId={workoutExercise.id}
              hasSubstitutions={(workoutExercise.substitutions?.length ?? 0) > 0}
            />
          </div>
        )}

        {progression && (
          <div className="mt-3 rounded-xl bg-primary/[0.06] px-3 py-2.5 text-xs leading-relaxed text-[#c7d0db]">
            <span className="font-bold text-primary">
              {progression.loadAdjustment === 'decrease_assistance' ? 'Reduzir assistência' : 'Progressão'}:
            </span>{' '}
            {progression.reason}
          </div>
        )}

        <div className="mt-3 border-t border-border pt-2">
          {(workoutExercise.substitutions?.length ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => {
                onOpenChange(false)
                setSwapOpen(true)
              }}
              className={actionClass}
            >
              <Repeat2 className="size-4 text-muted-foreground" /> Trocar exercício
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!canMoveEarlier}
              onClick={onMoveEarlier}
              className={cn(actionClass, 'disabled:opacity-35')}
            >
              <ChevronUp className="size-4" /> Mover antes
            </button>
            <button
              type="button"
              disabled={!canMoveLater}
              onClick={onMoveLater}
              className={cn(actionClass, 'disabled:opacity-35')}
            >
              <ChevronDown className="size-4" /> Mover depois
            </button>
          </div>
          <button type="button" onClick={() => onSkip(true)} className={actionClass}>
            <Ban className="size-4 text-[#ffcf7a]" /> Marcar como indisponível hoje
          </button>
          <button type="button" onClick={() => onSkip()} className={actionClass}>
            <SkipForward className="size-4 text-muted-foreground" /> Pular exercício
          </button>
        </div>

        <div className="mt-2 flex gap-2 rounded-xl bg-secondary/35 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          {workoutExercise.failure_allowed
            ? 'Falha não é obrigatória; use apenas quando a rotina permitir, com técnica controlada e sem dor.'
            : 'Falha bloqueada neste exercício. Encerre a série antes de perder a técnica.'}
        </div>
      </BottomSheet>

      <ExerciseDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        exercise={selectedExercise}
        guidance={guidance}
        history={selectedVariation == null ? history : []}
      />
      <ExerciseSwapSheet
        open={swapOpen}
        onOpenChange={setSwapOpen}
        workoutExercise={workoutExercise}
        selectedVariation={selectedVariation}
        onSelectToday={onSelectVariation}
      />
    </>
  )
}
