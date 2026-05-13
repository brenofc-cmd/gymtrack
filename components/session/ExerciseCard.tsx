'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, CheckCircle2, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { SetRow } from './SetRow'
import { useSessionStore } from '@/lib/store/sessionStore'
import { createClient } from '@/lib/supabase/client'
import { saveSetLog } from '@/lib/queries/sessions'
import type { WorkoutExerciseWithExercise } from '@/types/database'

interface ExerciseCardProps {
  sessionId: string
  workoutExercise: WorkoutExerciseWithExercise
  isOpen: boolean
  onToggle: () => void
  lastWeight: number | null
  lastReps: number | null
  prWeight: number | null
  onAllSetsComplete: () => void
}

export function ExerciseCard({
  sessionId,
  workoutExercise,
  isOpen,
  onToggle,
  lastWeight,
  lastReps,
  prWeight,
  onAllSetsComplete,
}: ExerciseCardProps) {
  const { exercise } = workoutExercise
  const { sets: storeSets, logSet, startRestTimer } = useSessionStore()
  const completedSets = storeSets[workoutExercise.id] ?? []
  const totalSets = workoutExercise.target_sets
  const allDone = completedSets.length >= totalSets
  const [notifiedDone, setNotifiedDone] = useState(false)
  const [newPR, setNewPR] = useState(false)

  useEffect(() => {
    if (allDone && !notifiedDone) {
      setNotifiedDone(true)
      onAllSetsComplete()
    }
  }, [allDone, notifiedDone, onAllSetsComplete])

  async function handleSetComplete(
    setNumber: number,
    weight: number | null,
    reps: number
  ) {
    const completed_at = new Date().toISOString()
    logSet(workoutExercise.id, { set_number: setNumber, weight_kg: weight, reps, completed_at })
    startRestTimer(workoutExercise.rest_seconds, workoutExercise.id)

    if (weight !== null && prWeight !== null && weight > prWeight) {
      setNewPR(true)
    }

    try {
      const supabase = createClient()
      await saveSetLog(supabase, sessionId, workoutExercise.id, {
        set_number: setNumber,
        weight_kg: weight,
        reps,
        completed_at,
      })
    } catch {
      toast.error('Não foi possível salvar a série. Ela está guardada localmente.')
    }
  }

  // Pre-fill logic: last completed set in this session, else last session
  function getDefaultForSet(setIndex: number) {
    const prev = completedSets[setIndex - 1]
    if (prev) return { weight: prev.weight_kg, reps: prev.reps }
    return {
      weight: lastWeight,
      reps: lastReps ?? workoutExercise.target_reps_min,
    }
  }

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
        {/* GIF thumbnail */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
          {exercise.gif_url ? (
            <Image
              src={exercise.gif_url}
              alt={exercise.name_pt}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl">
              💪
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">
            {exercise.name_pt}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {newPR && (
              <span className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                <Trophy className="w-3 h-3" />
                Novo recorde!
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
                    i < completedSets.length
                      ? 'bg-primary scale-110'
                      : 'bg-zinc-700'
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

      {/* Expandable sets */}
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
            <div className="px-3 pb-3 space-y-1">
              {/* Table header */}
              <div className="grid grid-cols-[40px_1fr_1fr_48px] gap-2 px-1">
                <span className="text-xs text-muted-foreground text-center">Série</span>
                <span className="text-xs text-muted-foreground text-center">Peso</span>
                <span className="text-xs text-muted-foreground text-center">Reps</span>
                <span />
              </div>

              {/* Rows */}
              {Array.from({ length: totalSets }, (_, i) => {
                const completed = completedSets[i] ?? null
                const defaults = getDefaultForSet(i)
                return (
                  <SetRow
                    key={i}
                    setNumber={i + 1}
                    defaultWeight={defaults.weight}
                    defaultReps={defaults.reps}
                    completed={completed}
                    onComplete={(w, r) => handleSetComplete(i + 1, w, r)}
                  />
                )
              })}

              {/* Notes */}
              {workoutExercise.notes && (
                <p className="text-xs text-muted-foreground italic pt-1 border-t border-border mt-2">
                  {workoutExercise.notes}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
