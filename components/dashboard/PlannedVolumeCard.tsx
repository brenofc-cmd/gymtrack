'use client'

import { useState } from 'react'
import { ChevronDown, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VOLUME_SEMANAL_ALVO, secondaryVolumeByMuscle } from '@/lib/routine/powerbuilding-v4'

const MUSCLE_LABEL: Record<string, string> = {
  peito: 'Peitoral',
  costas: 'Costas e dorsais',
  'deltoide lateral': 'Deltoide lateral',
  'deltoide posterior': 'Deltoide posterior',
  bíceps: 'Bíceps',
  tríceps: 'Tríceps',
  quadríceps: 'Quadríceps',
  isquiotibiais: 'Posteriores de coxa',
  panturrilha: 'Panturrilhas',
  abdômen: 'Abdômen',
}

/**
 * Volume semanal direto planejado pela rotina (séries válidas).
 * Séries indiretas (participação secundária) não entram nesta contagem.
 */
export function PlannedVolumeCard() {
  const [open, setOpen] = useState(false)
  const entries = Object.entries(VOLUME_SEMANAL_ALVO)
  const secondary = secondaryVolumeByMuscle()
  const max = Math.max(...entries.map(([, v]) => v))

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 p-4 text-left"
      >
        <BarChart3 className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-semibold flex-1">Volume semanal planejado</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {entries.map(([muscle, sets]) => (
            <div key={muscle} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-36 shrink-0">
                {MUSCLE_LABEL[muscle] ?? muscle}
              </span>
              <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-primary/70 rounded-full"
                  style={{ width: `${(sets / max) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono font-semibold tabular-nums w-6 text-right">
                {sets}
              </span>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground/80 pt-1">
            Séries diretas válidas por semana. Participação secundária (ex.: tríceps no
            supino) não é somada como série direta.
          </p>
          <details className="text-[10px] text-muted-foreground">
            <summary className="cursor-pointer font-semibold text-primary">Ver contribuição secundária estimada</summary>
            <p className="mt-1">{Object.entries(secondary).map(([muscle, sets]) => `${muscle}: ${sets}`).join(' · ')}</p>
          </details>
        </div>
      )}
    </div>
  )
}
