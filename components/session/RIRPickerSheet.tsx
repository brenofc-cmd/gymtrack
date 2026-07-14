'use client'

import { Loader2, Target } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { cn } from '@/lib/utils'

interface RIRPickerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  setNumber: number
  targetMin: number | null
  targetMax: number | null
  saving?: boolean
  onSelect: (rir: number) => void
}

const OPTIONS = [
  { value: 0, label: '0', description: 'Falha' },
  { value: 1, label: '1', description: 'Sobraria 1' },
  { value: 2, label: '2', description: 'Sobrariam 2' },
  { value: 3, label: '3', description: 'Sobrariam 3' },
  { value: 4, label: '4+', description: 'Muito leve' },
] as const

export function RIRPickerSheet({
  open,
  onOpenChange,
  setNumber,
  targetMin,
  targetMax,
  saving = false,
  onSelect,
}: RIRPickerSheetProps) {
  const target = targetMin ?? targetMax
  const targetLabel = targetMin == null
    ? null
    : targetMax != null && targetMax !== targetMin
      ? `${targetMin}–${targetMax}`
      : `${targetMin}`

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => !saving && onOpenChange(next)}
      title="Como terminou esta série?"
      description={`Série ${setNumber} · escolha quantas repetições ainda sobrariam`}
    >
      <div className="grid grid-cols-5 gap-2" aria-label="RIR da série">
        {OPTIONS.map((option) => {
          const isTarget = targetMin != null && targetMax != null
            ? option.value >= targetMin && option.value <= targetMax
            : option.value === target
          return (
            <button
              key={option.value}
              type="button"
              aria-label={`RIR ${option.label}: ${option.description}${isTarget ? ', dentro da meta' : ''}`}
              disabled={saving}
              onClick={() => onSelect(option.value)}
              className={cn(
                'relative flex min-h-20 flex-col items-center justify-center rounded-xl border text-center transition-colors focus-visible:ring-2 focus-visible:ring-primary',
                isTarget
                  ? 'border-primary/60 bg-primary/10 text-primary'
                  : 'border-input bg-secondary/35 text-foreground'
              )}
            >
              {saving ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <span className="font-mono text-2xl font-black">{option.label}</span>
                  <span className="mt-1 text-[9px] leading-tight text-muted-foreground">
                    {option.description}
                  </span>
                  {isTarget && (
                    <span className="absolute -top-2 rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-black uppercase text-primary-foreground">
                      Meta
                    </span>
                  )}
                </>
              )}
            </button>
          )
        })}
      </div>

      {target != null && (
        <button
          type="button"
          disabled={saving}
          onClick={() => onSelect(target)}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-extrabold text-primary-foreground"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Target className="size-4" />}
          Usar meta: RIR {targetLabel}
        </button>
      )}
    </BottomSheet>
  )
}
