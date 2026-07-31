import { ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dayStimulusSummary } from '@/lib/training/stimulus'
import {
  DUP_EXPLANATION,
  MAX_EFFORT_SAFETY_WARNING,
  METHOD_BADGE,
  POWERBUILDING_EXPLANATION,
  ROUTINE_VERSION,
  SOURCE_BADGE,
  SOURCE_DISCLAIMER,
} from '@/lib/routine/david-laid-gymshark-exact-v7'

interface RoutineMethodInfoProps {
  routineVersion?: number | null
  exercises: Array<{
    prescription_type?: string | null
    target_reps_min: number
    target_reps_max: number
  }>
  className?: string
}

/**
 * Badges de método/fonte, resumo "MISTO — ..." do dia e avisos de segurança
 * para a rotina David Laid Powerbuilding DUP — Gymshark Exact v7. Não
 * renderiza nada para outras rotinas (v6, demo etc.).
 */
export function RoutineMethodInfo({ routineVersion, exercises, className }: RoutineMethodInfoProps) {
  if (routineVersion !== ROUTINE_VERSION) return null
  const hasMaxEffort = exercises.some((item) => item.prescription_type === 'rep_max_effort')
  const summary = dayStimulusSummary(exercises)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
          {METHOD_BADGE}
        </span>
        <span className="inline-flex items-center rounded-full border border-[#5ba8ff]/30 bg-[#5ba8ff]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#8dc5ff]">
          {SOURCE_BADGE}
        </span>
        {summary && (
          <span className="inline-flex items-center rounded-full border border-[#ffb547]/30 bg-[#ffb547]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#ffcf7a]">
            {summary}
          </span>
        )}
      </div>

      {hasMaxEffort && (
        <div role="alert" className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] leading-relaxed text-destructive">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{MAX_EFFORT_SAFETY_WARNING}</p>
        </div>
      )}

      <details className="rounded-xl border border-border bg-secondary/20 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        <summary className="cursor-pointer font-semibold text-foreground">O que são Powerbuilding e DUP?</summary>
        <p className="mt-2"><strong className="text-foreground">Powerbuilding:</strong> {POWERBUILDING_EXPLANATION}</p>
        <p className="mt-2"><strong className="text-foreground">DUP:</strong> {DUP_EXPLANATION}</p>
        <p className="mt-2">{SOURCE_DISCLAIMER}</p>
      </details>
    </div>
  )
}
