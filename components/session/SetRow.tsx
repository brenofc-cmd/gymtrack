'use client'

import { useState } from 'react'
import { Check, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LocalSetLog } from '@/lib/store/sessionStore'

interface SetRowProps {
  setNumber: number
  isWarmup?: boolean
  defaultWeight: number | null
  defaultReps: number | null
  targetRirMin?: number | null
  targetRirMax?: number | null
  completed: LocalSetLog | null
  onComplete: (weight: number | null, reps: number, rir: number | null) => void
}

const RIR_OPTIONS = [0, 1, 2, 3, 4]

export function SetRow({
  setNumber,
  isWarmup = false,
  defaultWeight,
  defaultReps,
  targetRirMin,
  targetRirMax,
  completed,
  onComplete,
}: SetRowProps) {
  const [weight, setWeight] = useState<string>(
    completed?.weight_kg?.toString() ?? defaultWeight?.toString() ?? ''
  )
  const [reps, setReps] = useState<string>(
    completed?.reps?.toString() ?? defaultReps?.toString() ?? ''
  )
  const [rir, setRir] = useState<number | null>(completed?.rir ?? null)

  const isDone = completed != null
  const [repsError, setRepsError] = useState(false)
  const [weightError, setWeightError] = useState(false)

  const rirTargetLabel =
    targetRirMin != null && targetRirMax != null
      ? targetRirMin === targetRirMax
        ? `${targetRirMin}`
        : `${targetRirMin}–${targetRirMax}`
      : null

  function handleCheck() {
    if (isDone) return
    const r = parseInt(reps, 10)
    const w = weight ? parseFloat(weight) : null

    const repsInvalid = isNaN(r) || r <= 0 || r > 999
    const weightInvalid = w !== null && (w < 0 || w > 999)

    setRepsError(repsInvalid)
    setWeightError(weightInvalid)

    if (repsInvalid || weightInvalid) return
    onComplete(w, r, isWarmup ? null : rir)
  }

  return (
    <div
      className={cn(
        'rounded-lg py-2 px-1 transition-colors',
        isDone ? 'bg-primary/5' : 'bg-transparent'
      )}
    >
      <div className="grid grid-cols-[32px_1fr_1fr_44px] gap-2 items-center">
        {/* Série número / aquecimento */}
        {isWarmup ? (
          <span className="flex items-center justify-center" title="Série de aquecimento">
            <Flame className={cn('w-4 h-4', isDone ? 'text-amber-500' : 'text-amber-500/60')} />
          </span>
        ) : (
          <span
            className={cn(
              'text-sm font-semibold text-center',
              isDone ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {setNumber}
          </span>
        )}

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
            'flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-all justify-self-end',
            'disabled:cursor-default',
            isDone
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-border hover:border-primary/50 text-transparent hover:text-primary/30'
          )}
        >
          <Check className="w-5 h-5" strokeWidth={3} />
        </button>
      </div>

      {/* RIR — apenas para séries válidas */}
      {!isWarmup && !isDone && (
        <div className="flex items-center gap-1.5 mt-1.5 pl-[40px]">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">
            RIR{rirTargetLabel ? ` (meta ${rirTargetLabel})` : ''}
          </span>
          <div className="flex gap-1">
            {RIR_OPTIONS.map((v) => (
              <button
                key={v}
                onClick={() => setRir(rir === v ? null : v)}
                aria-label={`RIR ${v}`}
                aria-pressed={rir === v}
                className={cn(
                  'w-7 h-7 rounded-md text-xs font-semibold border transition-colors',
                  rir === v
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}
      {!isWarmup && isDone && completed?.rir != null && (
        <p className="text-[10px] text-muted-foreground mt-1 pl-[40px]">
          RIR registrado: <span className="text-primary font-semibold">{completed.rir}</span>
        </p>
      )}
    </div>
  )
}
