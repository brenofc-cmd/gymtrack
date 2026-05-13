'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LocalSetLog } from '@/lib/store/sessionStore'

interface SetRowProps {
  setNumber: number
  defaultWeight: number | null
  defaultReps: number | null
  completed: LocalSetLog | null
  onComplete: (weight: number | null, reps: number) => void
}

export function SetRow({
  setNumber,
  defaultWeight,
  defaultReps,
  completed,
  onComplete,
}: SetRowProps) {
  const [weight, setWeight] = useState<string>(
    completed?.weight_kg?.toString() ?? defaultWeight?.toString() ?? ''
  )
  const [reps, setReps] = useState<string>(
    completed?.reps?.toString() ?? defaultReps?.toString() ?? ''
  )

  const isDone = completed != null
  const [repsError, setRepsError] = useState(false)
  const [weightError, setWeightError] = useState(false)

  function handleCheck() {
    if (isDone) return
    const r = parseInt(reps, 10)
    const w = weight ? parseFloat(weight) : null

    const repsInvalid = isNaN(r) || r <= 0 || r > 999
    const weightInvalid = w !== null && (w < 0 || w > 999)

    setRepsError(repsInvalid)
    setWeightError(weightInvalid)

    if (repsInvalid || weightInvalid) return
    onComplete(w, r)
  }

  return (
    <div
      className={cn(
        'grid grid-cols-[40px_1fr_1fr_48px] gap-2 items-center py-2 px-1 rounded-lg transition-colors',
        isDone ? 'bg-primary/5' : 'bg-transparent'
      )}
    >
      {/* Série número */}
      <span
        className={cn(
          'text-sm font-semibold text-center',
          isDone ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        {setNumber}
      </span>

      {/* Peso */}
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          placeholder="—"
          value={weight}
          onChange={(e) => { if (!isDone) { setWeight(e.target.value); setWeightError(false) } }}
          disabled={isDone}
          aria-label={`Peso da série ${setNumber} em kg`}
          className={cn(
            'w-full h-10 rounded-lg border bg-transparent text-center text-sm font-semibold',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            'disabled:opacity-60',
            isDone
              ? 'border-primary/30 text-primary'
              : weightError
              ? 'border-destructive text-foreground'
              : 'border-border text-foreground'
          )}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          kg
        </span>
      </div>

      {/* Reps */}
      <input
        type="number"
        inputMode="numeric"
        placeholder="—"
        value={reps}
        onChange={(e) => { if (!isDone) { setReps(e.target.value); setRepsError(false) } }}
        disabled={isDone}
        aria-label={`Repetições da série ${setNumber}`}
        className={cn(
          'w-full h-10 rounded-lg border bg-transparent text-center text-sm font-semibold',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          'disabled:opacity-60',
          isDone
            ? 'border-primary/30 text-primary'
            : repsError
            ? 'border-destructive text-foreground'
            : 'border-border text-foreground'
        )}
      />

      {/* Checkbox */}
      <button
        onClick={handleCheck}
        disabled={isDone}
        aria-label={isDone ? `Série ${setNumber} concluída` : `Concluir série ${setNumber}`}
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-all',
          'disabled:cursor-default',
          isDone
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-border hover:border-primary/50 text-transparent hover:text-primary/30'
        )}
      >
        <Check className="w-5 h-5" strokeWidth={3} />
      </button>
    </div>
  )
}
