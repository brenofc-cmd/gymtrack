'use client'

import { useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleAlert,
  NotebookPen,
  SkipForward,
} from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { cn } from '@/lib/utils'
import type { ExerciseFeedback, LocalSetLog } from '@/lib/store/sessionStore'
import type { WorkoutExerciseWithExercise } from '@/types/database'

interface ExerciseNavigatorProps {
  exercises: WorkoutExerciseWithExercise[]
  currentIndex: number
  completedSets: number
  totalSets: number
  sets: Record<string, LocalSetLog[]>
  feedback: Record<string, ExerciseFeedback>
  skippedExerciseIds: string[]
  onGo: (index: number) => void
}

export function ExerciseNavigator({
  exercises,
  currentIndex,
  completedSets,
  totalSets,
  sets,
  feedback,
  skippedExerciseIds,
  onGo,
}: ExerciseNavigatorProps) {
  const [open, setOpen] = useState(false)
  const percentage = totalSets > 0 ? Math.min(100, (completedSets / totalSets) * 100) : 0

  function go(index: number) {
    if (index < 0 || index >= exercises.length) return
    onGo(index)
  }

  return (
    <>
      <section className="sticky top-[calc(76px+env(safe-area-inset-top))] z-20 bg-background/95 px-3 py-2 backdrop-blur-xl sm:px-4">
        <div className="mx-auto max-w-[430px] rounded-2xl border border-border bg-card/95 px-2 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,.14)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go(currentIndex - 1)}
              disabled={currentIndex === 0}
              aria-label="Exercício anterior"
              className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-secondary disabled:opacity-25"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex min-h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary/70 px-3 text-xs font-bold"
            >
              Exercício {currentIndex + 1} de {exercises.length}
              <ChevronDown className="size-4 text-primary" />
            </button>
            <button
              type="button"
              onClick={() => go(currentIndex + 1)}
              disabled={currentIndex === exercises.length - 1}
              aria-label="Próximo exercício"
              className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-secondary disabled:opacity-25"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
              <div
                className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-[10px] font-bold text-muted-foreground">
              {completedSets} de {totalSets} séries
            </span>
          </div>

          <div className="mt-1.5 flex items-center justify-center gap-1.5" aria-label="Progresso por exercício">
            {exercises.map((exercise, index) => {
              const done = (sets[exercise.id] ?? []).filter((set) => !set.is_warmup).length >= exercise.target_sets
              const skipped = skippedExerciseIds.includes(exercise.id)
              const hasPain = feedback[exercise.id]?.painLevel != null && feedback[exercise.id]?.painLevel !== 'nenhuma'
              return (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => go(index)}
                  aria-label={`${index + 1}. ${exercise.exercise.name_pt}: ${skipped ? 'pulado' : done ? 'concluído' : index === currentIndex ? 'atual' : hasPain ? 'com dor' : 'pendente'}`}
                  aria-current={index === currentIndex ? 'step' : undefined}
                  className={cn(
                    'h-2.5 min-w-5 flex-1 rounded-full transition-colors motion-reduce:transition-none',
                    index === currentIndex ? 'bg-primary' : skipped ? 'bg-muted-foreground/35' : hasPain ? 'bg-destructive/70' : done ? 'bg-primary/45' : 'bg-secondary'
                  )}
                />
              )
            })}
          </div>
        </div>
      </section>

      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title="Exercícios do treino"
        description={`${completedSets} de ${totalSets} séries válidas concluídas`}
      >
        <ol className="space-y-1.5">
          {exercises.map((exercise, index) => {
            const validCount = (sets[exercise.id] ?? []).filter((set) => !set.is_warmup).length
            const done = validCount >= exercise.target_sets
            const skipped = skippedExerciseIds.includes(exercise.id)
            const fb = feedback[exercise.id]
            const hasPain = fb?.painLevel != null && fb.painLevel !== 'nenhuma'
            const hasNote = Boolean(fb?.notes.trim())
            const active = index === currentIndex
            const Icon = skipped ? SkipForward : hasPain ? CircleAlert : done ? Check : Circle
            return (
              <li key={exercise.id}>
                <button
                  type="button"
                  onClick={() => {
                    go(index)
                    setOpen(false)
                  }}
                  aria-current={active ? 'step' : undefined}
                  className={cn(
                    'flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-left',
                    active ? 'bg-primary/10 ring-1 ring-inset ring-primary/35' : 'bg-secondary/35'
                  )}
                >
                  <span className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-full border',
                    done ? 'border-primary/40 bg-primary/10 text-primary' : hasPain ? 'border-destructive/40 text-destructive' : 'border-input text-muted-foreground'
                  )}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{index + 1}. {exercise.exercise.name_pt}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{skipped ? 'Ignorado' : active ? 'Atual' : done ? 'Concluído' : 'Pendente'} · {validCount}/{exercise.target_sets} séries</span>
                      {hasNote && <NotebookPen className="size-3" aria-label="Com observação" />}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </BottomSheet>
    </>
  )
}
