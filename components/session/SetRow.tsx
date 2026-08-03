'use client'

import { useId, useRef, useState } from 'react'
import { Check, Flame, Loader2, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatPreviousSet,
  parseDecimalInput,
  type LoadInputConfig,
} from '@/lib/training/load-input'
import type { LocalSetLog } from '@/lib/store/sessionStore'
import type { AttemptResult } from '@/lib/training/dup-progression'
import { RIRPickerSheet } from './RIRPickerSheet'

export type SetSaveState = 'saved' | 'queued'

export interface SetDraft {
  weight: number | null
  reps: number
  rir: number | null
  attemptResult?: AttemptResult | null
}

interface PreviousSet {
  weight_kg: number | null
  reps: number
  rir: number | null
}

interface SetRowProps {
  setNumber: number
  isWarmup?: boolean
  setRole?: 'warmup' | 'top' | 'backoff' | 'standard' | 'rm_effort'
  loadConfig: LoadInputConfig
  defaultWeight: number | null
  defaultReps: number | null
  previousSet?: PreviousSet | null
  hint?: string
  targetRirMin?: number | null
  targetRirMax?: number | null
  completed: LocalSetLog | null
  isCurrent?: boolean
  onSave: (draft: SetDraft) => Promise<SetSaveState>
  onRemove?: () => Promise<void> | void
}

function inputValue(value: number | null | undefined): string {
  return value == null ? '' : value.toString().replace('.', ',')
}

export function SetRow({
  setNumber,
  isWarmup = false,
  setRole = 'standard',
  loadConfig,
  defaultWeight,
  defaultReps,
  previousSet = null,
  hint,
  targetRirMin = null,
  targetRirMax = null,
  completed,
  isCurrent = false,
  onSave,
  onRemove,
}: SetRowProps) {
  const id = useId()
  const repsRef = useRef<HTMLInputElement>(null)
  const [weightInput, setWeightInput] = useState<string | null>(null)
  const [repsInput, setRepsInput] = useState<string | null>(null)
  const [rir, setRir] = useState<number | null>(completed?.rir ?? null)
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(
    completed?.attempt_result ?? null
  )
  const [editing, setEditing] = useState(completed == null)
  const [saving, setSaving] = useState(false)
  const [rirOpen, setRirOpen] = useState(false)
  const [draft, setDraft] = useState<SetDraft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SetSaveState | null>(null)

  const isDone = completed != null && !editing
  const canEdit = completed != null
  const weight = weightInput ?? inputValue(completed?.weight_kg ?? defaultWeight)
  const reps = repsInput ?? inputValue(completed?.reps ?? defaultReps)

  function buildDraft(): SetDraft | null {
    const parsedReps = Number.parseInt(reps, 10)
    const parsedWeight = loadConfig.acceptsLoad ? parseDecimalInput(weight) : null
    if (!Number.isInteger(parsedReps) || parsedReps <= 0 || parsedReps > 9999) {
      setError(`Informe ${loadConfig.repsLabel.toLowerCase()} entre 1 e 9999.`)
      return null
    }
    if (
      loadConfig.acceptsLoad &&
      (parsedWeight == null || Number.isNaN(parsedWeight) || parsedWeight < 0 || parsedWeight > 9999)
    ) {
      setError(`Informe ${loadConfig.loadLabel.toLowerCase()} entre 0 e 9999.`)
      return null
    }
    if (setRole === 'rm_effort' && attemptResult == null) {
      setError('Classifique o resultado desta tentativa RM.')
      return null
    }
    setError(null)
    const result: SetDraft = {
      weight: parsedWeight,
      reps: parsedReps,
      rir: isWarmup ? null : rir,
    }
    if (setRole === 'rm_effort') result.attemptResult = attemptResult
    return result
  }

  async function save(next: SetDraft) {
    setSaving(true)
    setError(null)
    try {
      const state = await onSave(next)
      setSaveState(state)
      setRir(next.rir)
      setAttemptResult(next.attemptResult ?? null)
      setEditing(false)
      setWeightInput(inputValue(next.weight))
      setRepsInput(inputValue(next.reps))
      setRirOpen(false)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível guardar a série. Tente novamente.'
      )
    } finally {
      setSaving(false)
    }
  }

  function prepareSave() {
    if (saving) return
    const next = buildDraft()
    if (!next) return
    if (!isWarmup && next.rir == null) {
      setDraft(next)
      setRirOpen(true)
      return
    }
    void save(next)
  }

  function copyPrevious() {
    if (!previousSet) return
    setWeightInput(inputValue(previousSet.weight_kg))
    setRepsInput(inputValue(previousSet.reps))
    // RIR descreve o esforço atual e nunca é copiado automaticamente.
    setError(null)
  }

  const previousLabel = previousSet
    ? formatPreviousSet(previousSet.weight_kg, previousSet.reps, loadConfig)
    : hint ?? '—'
  const targetLabel = targetRirMin == null
    ? null
    : targetRirMax != null && targetRirMax !== targetRirMin
      ? `${targetRirMin}–${targetRirMax}`
      : `${targetRirMin}`

  return (
    <div
      data-current-set={isCurrent ? 'true' : undefined}
      className={cn(
        'relative rounded-xl px-1.5 py-2 transition-colors motion-reduce:transition-none',
        isCurrent && !isDone && 'bg-primary/[0.07] ring-1 ring-inset ring-primary/35',
        isDone && 'bg-primary/[0.04]'
      )}
    >
      {isCurrent && !isDone && (
        <span className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-primary" aria-hidden="true" />
      )}

      <div className="grid grid-cols-[30px_minmax(58px,.82fr)_minmax(72px,1.08fr)_minmax(54px,.75fr)_48px] items-center gap-1.5 sm:grid-cols-[38px_minmax(72px,.9fr)_minmax(96px,1.15fr)_minmax(72px,.8fr)_52px] sm:gap-2">
        <div className="text-center">
          {isWarmup ? (
            <span className="inline-flex min-h-10 items-center justify-center text-amber-400" title={`Aquecimento ${setNumber}`}>
              <Flame className="size-4" />
              <span className="sr-only">Aquecimento {setNumber}</span>
            </span>
          ) : (
            <span className={cn('font-mono text-sm font-black', isDone ? 'text-primary' : 'text-foreground')}>
              {setRole === 'top' ? 'T' : setRole === 'backoff' ? `B${setNumber - 1}` : setNumber}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={copyPrevious}
          disabled={!previousSet || isDone || saving}
          aria-label={previousSet ? `Copiar anterior: ${previousLabel}` : hint ?? 'Sem série anterior para copiar'}
          className="min-h-12 min-w-0 rounded-lg px-1 text-center text-[10px] font-semibold leading-tight text-muted-foreground enabled:hover:bg-secondary enabled:hover:text-foreground disabled:opacity-60"
        >
          <span className="block truncate">{previousLabel}</span>
          {previousSet && !isDone && <span className="mt-0.5 block text-[8px] uppercase text-primary/80">Copiar</span>}
        </button>

        {loadConfig.acceptsLoad ? (
          <div className="relative min-w-0">
            <label htmlFor={`${id}-weight`} className="sr-only">
              {loadConfig.loadLabel} da série {setNumber}
            </label>
            <input
              id={`${id}-weight`}
              type="text"
              inputMode="decimal"
              enterKeyHint="next"
              value={weight}
              disabled={isDone || saving}
              aria-describedby={error ? `${id}-error` : undefined}
              aria-invalid={Boolean(error)}
              onFocus={(event) => {
                event.currentTarget.select()
                event.currentTarget.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
              }}
              onChange={(event) => {
                setWeightInput(event.target.value)
                setError(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  repsRef.current?.focus()
                }
              }}
              className={cn(
                'h-12 w-full rounded-lg border bg-background/70 px-2 pr-7 text-center text-base font-bold tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:bg-transparent',
                isDone ? 'border-primary/25 text-primary' : error ? 'border-destructive' : 'border-input'
              )}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
              {loadConfig.unit}
            </span>
          </div>
        ) : (
          <div className="flex h-12 min-w-0 items-center justify-center rounded-lg border border-dashed border-input px-1 text-center text-[10px] font-semibold leading-tight text-muted-foreground">
            {loadConfig.loadShortLabel}
          </div>
        )}

        <div className="min-w-0">
          <label htmlFor={`${id}-reps`} className="sr-only">
            {loadConfig.repsLabel} da série {setNumber}
          </label>
          <input
            ref={repsRef}
            id={`${id}-reps`}
            type="text"
            inputMode="numeric"
            enterKeyHint="done"
            value={reps}
            disabled={isDone || saving}
            aria-describedby={error ? `${id}-error` : undefined}
            aria-invalid={Boolean(error)}
            onFocus={(event) => {
              event.currentTarget.select()
              event.currentTarget.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
            }}
            onChange={(event) => {
              setRepsInput(event.target.value.replace(/[^0-9]/g, ''))
              setError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                prepareSave()
              }
            }}
            className={cn(
              'h-12 w-full rounded-lg border bg-background/70 px-1 text-center text-base font-bold tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:bg-transparent',
              isDone ? 'border-primary/25 text-primary' : error ? 'border-destructive' : 'border-input'
            )}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            if (canEdit && !editing) {
              setEditing(true)
              setSaveState(null)
              return
            }
            prepareSave()
          }}
          disabled={saving}
          aria-label={isDone ? `Editar série ${setNumber}` : editing && canEdit ? `Salvar edição da série ${setNumber}` : `Concluir série ${setNumber}`}
          className={cn(
            'grid size-12 place-items-center justify-self-end rounded-xl border-2 transition-colors focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-70',
            isDone
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-primary/45 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
          )}
        >
          {saving ? (
            <Loader2 className="size-5 animate-spin" />
          ) : isDone ? (
            <span className="relative">
              <Check className="size-5" strokeWidth={3} />
              <Pencil className="absolute -bottom-1.5 -right-2 size-3 rounded-full bg-primary-foreground p-0.5 text-primary" />
            </span>
          ) : (
            <Check className="size-5" strokeWidth={3} />
          )}
        </button>
      </div>

      <div className="mt-1 flex min-h-4 items-center gap-2 pl-9 text-[9px] sm:pl-12">
        {isCurrent && !isDone && <span className="font-bold uppercase tracking-wide text-primary">Série atual</span>}
        {!isWarmup && setRole !== 'standard' && (
          <span className="font-semibold uppercase tracking-wide text-muted-foreground">
            {setRole === 'top' ? 'Top set' : 'Back-off'}
          </span>
        )}
        {!isWarmup && (completed?.rir != null || rir != null) && (
          <button
            type="button"
            onClick={() => {
              const next = buildDraft()
              if (!next) return
              setDraft(next)
              setRirOpen(true)
            }}
            className="min-h-7 rounded-full bg-primary/10 px-1.5 py-0.5 font-bold text-primary"
            aria-label={`Editar RIR da série ${setNumber}`}
          >
            RIR {completed?.rir ?? rir}{(completed?.rir ?? rir) === 4 ? '+' : ''}
          </button>
        )}
        {!isWarmup && !isDone && targetLabel && (
          <span className="text-muted-foreground">Meta RIR {targetLabel}</span>
        )}
        {saveState === 'queued' && <span className="text-[var(--warn-text)]">Salva offline</span>}
        {editing && canEdit && (
          <button
            type="button"
            onClick={() => {
              setEditing(false)
              setWeightInput(null)
              setRepsInput(null)
              setRir(completed?.rir ?? null)
              setAttemptResult(completed?.attempt_result ?? null)
              setError(null)
            }}
            className="ml-auto inline-flex min-h-7 items-center gap-1 px-1 text-muted-foreground"
          >
            <RotateCcw className="size-3" /> Cancelar edição
          </button>
        )}
        {isWarmup && completed && onRemove && (
          <button
            type="button"
            onClick={() => void onRemove()}
            className="ml-auto inline-flex min-h-7 items-center gap-1 px-1 text-destructive"
          >
            <Trash2 className="size-3" /> Remover
          </button>
        )}
      </div>

      {!isWarmup && setRole === 'rm_effort' && (
        <div className="mt-2 pl-9 sm:pl-12">
          <label htmlFor={`${id}-attempt`} className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Resultado da tentativa
          </label>
          <select
            id={`${id}-attempt`}
            value={attemptResult ?? ''}
            disabled={isDone || saving}
            onChange={(event) => {
              setAttemptResult((event.target.value || null) as AttemptResult | null)
              setError(null)
            }}
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-70"
          >
            <option value="">Selecione o resultado</option>
            <option value="completed">Concluída</option>
            <option value="personal_record">Recorde pessoal</option>
            <option value="technical_failure">Falha técnica</option>
            <option value="strength_failure">Falha de força</option>
            <option value="skipped">Pulada por segurança</option>
            <option value="pain">Dor</option>
          </select>
        </div>
      )}

      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 pl-9 text-xs text-destructive sm:pl-12">
          {error}
        </p>
      )}

      <RIRPickerSheet
        open={rirOpen}
        onOpenChange={setRirOpen}
        setNumber={setNumber}
        targetMin={targetRirMin}
        targetMax={targetRirMax}
        saving={saving}
        onSelect={(selectedRir) => {
          const next = draft
          if (!next) return
          void save({ ...next, rir: selectedRir })
        }}
      />
    </div>
  )
}
