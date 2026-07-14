'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, Flame, HelpCircle, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildWarmupPlan } from '@/lib/progression/warmup'
import type { LoadInputConfig } from '@/lib/training/load-input'
import type { LocalSetLog } from '@/lib/store/sessionStore'
import { SetRow, type SetDraft, type SetSaveState } from './SetRow'

interface WarmupSetListProps {
  workingWeightKg: number | null
  loadConfig: LoadInputConfig
  completedSets: LocalSetLog[]
  enabled: boolean
  onSave: (
    setNumber: number,
    draft: SetDraft,
    completed: LocalSetLog | null
  ) => Promise<SetSaveState>
  onRemove: (completed: LocalSetLog) => Promise<void>
}

function defaultReps(index: number): number {
  return [10, 6, 3][index] ?? 5
}

export function WarmupSetList({
  workingWeightKg,
  loadConfig,
  completedSets,
  enabled,
  onSave,
  onRemove,
}: WarmupSetListProps) {
  const [open, setOpen] = useState(false)
  const [extraRows, setExtraRows] = useState(0)
  const [showHelp, setShowHelp] = useState(false)
  const mode = loadConfig.kind === 'assistance'
    ? 'assistance'
    : loadConfig.kind === 'bodyweight' || loadConfig.kind === 'reps_only'
      ? 'bodyweight'
      : 'standard'
  const suggestions = useMemo(
    () => enabled ? buildWarmupPlan(workingWeightKg, mode).slice(1) : [],
    [enabled, mode, workingWeightKg]
  )
  const highestCompleted = completedSets.reduce(
    (highest, set) => Math.max(highest, set.set_number),
    0
  )
  const baseRows = Math.max(suggestions.length, highestCompleted)
  const rowCount = baseRows + extraRows
  const completedCount = completedSets.length

  if (!enabled && completedSets.length === 0) return null

  return (
    <section className="rounded-xl bg-amber-400/[0.06]" aria-labelledby="warmup-title">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center gap-2 px-3 text-left"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-amber-400/10 text-amber-400">
          {rowCount > 0 && completedCount >= rowCount ? <Check className="size-4" /> : <Flame className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span id="warmup-title" className="block text-xs font-bold text-amber-200">
            Aquecimento sugerido · {rowCount} {rowCount === 1 ? 'série' : 'séries'}
          </span>
          <span className="block text-[10px] text-muted-foreground">
            {completedCount} de {rowCount} concluídas · não conta no volume
          </span>
        </span>
        <span className="text-[10px] font-semibold text-amber-300">{open ? 'Recolher' : 'Expandir'}</span>
        <ChevronDown className={cn('size-4 text-amber-300 transition-transform motion-reduce:transition-none', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-amber-300/10 px-1.5 pb-2 pt-1">
          {Array.from({ length: rowCount }, (_, index) => {
            const completed = completedSets.find((set) => set.set_number === index + 1) ?? null
            const suggestion = suggestions[index]
            return (
              <SetRow
                key={`warmup-${index + 1}-${completed?.id ?? 'draft'}`}
                setNumber={index + 1}
                isWarmup
                setRole="warmup"
                loadConfig={loadConfig}
                hint={suggestion?.label ?? 'Extra'}
                defaultWeight={suggestion?.weightKg ?? workingWeightKg}
                defaultReps={defaultReps(index)}
                completed={completed}
                isCurrent={!completed && index === completedCount}
                onSave={async (draft) => {
                  const result = await onSave(index + 1, draft, completed)
                  const nextCompletedCount = completedCount + (completed ? 0 : 1)
                  if (rowCount > 0 && nextCompletedCount >= rowCount) setOpen(false)
                  return result
                }}
                onRemove={completed ? () => onRemove(completed) : undefined}
              />
            )
          })}

          <div className="mt-1 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setExtraRows((count) => count + 1)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-amber-300"
            >
              <Plus className="size-3.5" /> Adicionar aquecimento
            </button>
            {extraRows > 0 && (
              <button
                type="button"
                onClick={() => setExtraRows((count) => Math.max(0, count - 1))}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs text-muted-foreground"
              >
                <Trash2 className="size-3.5" /> Remover linha
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowHelp((value) => !value)}
              className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs text-muted-foreground"
            >
              <HelpCircle className="size-3.5" /> Entender
            </button>
          </div>

          {showHelp && (
            <p className="px-3 pb-2 text-[11px] leading-relaxed text-muted-foreground">
              Séries de aproximação devem ficar longe da falha e não entram no volume nem nos recordes.
              {loadConfig.kind === 'assistance'
                ? ' Em exercícios assistidos, aqueça com mais assistência; percentuais comuns de carga não se aplicam.'
                : ''}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
