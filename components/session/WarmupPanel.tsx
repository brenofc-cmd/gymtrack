'use client'

import { useState } from 'react'
import { Flame, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildWarmupPlan } from '@/lib/progression/warmup'

interface WarmupPanelProps {
  workingWeightKg: number | null
}

/**
 * Orientação de aquecimento exibida antes do primeiro exercício composto.
 * Percentuais calculados a partir da última carga de trabalho registrada.
 */
export function WarmupPanel({ workingWeightKg }: WarmupPanelProps) {
  const [open, setOpen] = useState(true)
  const plan = buildWarmupPlan(workingWeightKg)

  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <Flame className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-xs font-semibold text-amber-500 flex-1">
          Aquecimento sugerido antes deste exercício
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-amber-500/70 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="px-3 pb-2.5">
          <ul className="space-y-1">
            {plan.map((s, i) => (
              <li key={i} className="flex items-baseline gap-2 text-xs">
                <span className="font-mono font-semibold text-amber-500/90 w-16 shrink-0">
                  {s.label}
                </span>
                <span className="text-muted-foreground">
                  {s.weightKg != null ? `${s.weightKg}kg — ` : ''}
                  {s.reps}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-muted-foreground/80 mt-1.5">
            Séries de aproximação: longe da falha, sem fadiga desnecessária. Não contam no
            volume nem nos recordes.
          </p>
        </div>
      )}
    </div>
  )
}
