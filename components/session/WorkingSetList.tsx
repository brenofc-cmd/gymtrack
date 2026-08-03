'use client'

import type { LoadInputConfig } from '@/lib/training/load-input'
import type { LocalSetLog } from '@/lib/store/sessionStore'
import { SetRow, type SetDraft, type SetSaveState } from './SetRow'

interface PreviousSet {
  set_number: number
  weight_kg: number | null
  reps: number
  rir: number | null
}

interface WorkingSetListProps {
  totalSets: number
  topSetEnabled: boolean
  prescriptionType?: string | null
  defaultSetRole?: string | null
  loadConfig: LoadInputConfig
  targetRirMin: number | null
  targetRirMax: number | null
  completedSets: LocalSetLog[]
  previousSets: PreviousSet[]
  getDefault: (setIndex: number) => { weight: number | null; reps: number }
  onSave: (
    setNumber: number,
    setRole: 'top' | 'backoff' | 'standard' | 'rm_effort',
    draft: SetDraft,
    completed: LocalSetLog | null
  ) => Promise<SetSaveState>
}

export function WorkingSetList({
  totalSets,
  topSetEnabled,
  prescriptionType,
  defaultSetRole,
  loadConfig,
  targetRirMin,
  targetRirMax,
  completedSets,
  previousSets,
  getDefault,
  onSave,
}: WorkingSetListProps) {
  const currentSetIndex = Array.from({ length: totalSets }, (_, index) => index)
    .find((index) => !completedSets.some((set) => set.set_number === index + 1)) ?? -1

  return (
    <section aria-labelledby="working-sets-title">
      <div className="grid grid-cols-[30px_minmax(58px,.82fr)_minmax(72px,1.08fr)_minmax(54px,.75fr)_48px] items-end gap-1.5 px-1.5 pb-1 sm:grid-cols-[38px_minmax(72px,.9fr)_minmax(96px,1.15fr)_minmax(72px,.8fr)_52px] sm:gap-2">
        <span id="working-sets-title" className="text-center text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Série</span>
        <span className="text-center text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Anterior</span>
        <span className="truncate text-center text-[9px] font-bold uppercase tracking-wide text-muted-foreground" title={loadConfig.loadLabel}>
          {loadConfig.loadShortLabel}
        </span>
        <span className="truncate text-center text-[9px] font-bold uppercase tracking-wide text-muted-foreground" title={loadConfig.repsLabel}>
          {loadConfig.repsLabel}
        </span>
        <span className="sr-only">Concluir</span>
      </div>

      <div className="space-y-0.5">
        {Array.from({ length: totalSets }, (_, index) => {
          const setNumber = index + 1
          const completed = completedSets.find((set) => set.set_number === setNumber) ?? null
          const previous = previousSets.find((set) => set.set_number === setNumber) ?? null
          const defaults = getDefault(index)
          const setRole = prescriptionType === 'rep_max_effort'
            ? 'rm_effort'
            : defaultSetRole === 'backoff'
              ? 'backoff'
              : topSetEnabled
            ? index === 0 ? 'top' : 'backoff'
            : 'standard'
          return (
            <SetRow
              key={`work-${setNumber}-${completed?.id ?? 'draft'}`}
              setNumber={setNumber}
              setRole={setRole}
              loadConfig={loadConfig}
              defaultWeight={defaults.weight}
              defaultReps={defaults.reps}
              previousSet={previous}
              targetRirMin={targetRirMin}
              targetRirMax={targetRirMax}
              completed={completed}
              isCurrent={index === currentSetIndex}
              onSave={(draft) => onSave(setNumber, setRole, draft, completed)}
            />
          )
        })}
      </div>

      {loadConfig.helperText && (
        <p className="mt-1 px-2 text-[10px] font-medium text-[var(--warn-text)]">
          {loadConfig.helperText}
        </p>
      )}
    </section>
  )
}
