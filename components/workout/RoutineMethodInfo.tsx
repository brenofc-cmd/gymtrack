import { ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dayStimulusSummary } from '@/lib/training/stimulus'
import {
  DUP_EXPLANATION,
  MAX_EFFORT_SAFETY_WARNING,
  METHOD_BADGE,
  POWERBUILDING_EXPLANATION,
  ROUTINE_VERSION as GYMSHARK_EXACT_VERSION,
  SOURCE_BADGE,
  SOURCE_DISCLAIMER as GYMSHARK_EXACT_SOURCE_DISCLAIMER,
} from '@/lib/routine/david-laid-gymshark-exact-v7'
import {
  ROUTINE_VERSION as GUIDED_LOAD_VERSION,
  GUIDED_TOP_SET_SAFETY_NOTE,
  SOURCE_DISCLAIMER as GUIDED_LOAD_SOURCE_DISCLAIMER,
  FATIGUE_DISCLAIMER,
} from '@/lib/routine/david-laid-guided-load-v7'

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
 * para as rotinas David Laid Powerbuilding DUP (Gymshark Exact v7 e Guided
 * Load v7). Não renderiza nada para outras rotinas (v6, demo etc.).
 */
export function RoutineMethodInfo({ routineVersion, exercises, className }: RoutineMethodInfoProps) {
  const isGymsharkExact = routineVersion === GYMSHARK_EXACT_VERSION
  const isGuidedLoad = routineVersion === GUIDED_LOAD_VERSION
  if (!isGymsharkExact && !isGuidedLoad) return null

  const hasMaxEffort = exercises.some((item) => item.prescription_type === 'rep_max_effort' || item.prescription_type === 'guided_top_set')
  const summary = dayStimulusSummary(exercises)
  const sourceDisclaimer = isGuidedLoad ? GUIDED_LOAD_SOURCE_DISCLAIMER : GYMSHARK_EXACT_SOURCE_DISCLAIMER
  const safetyWarning = isGuidedLoad ? GUIDED_TOP_SET_SAFETY_NOTE : MAX_EFFORT_SAFETY_WARNING

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
          {METHOD_BADGE}
        </span>
        <span className="inline-flex items-center rounded-full border border-[var(--info-tint)]/30 bg-[var(--info-tint)]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--info-text)]">
          {SOURCE_BADGE}
        </span>
        {isGuidedLoad && (
          <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
            Guided Load
          </span>
        )}
        {summary && (
          <span className="inline-flex items-center rounded-full border border-[var(--warn-tint)]/30 bg-[var(--warn-tint)]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--warn-text)]">
            {summary}
          </span>
        )}
      </div>

      {hasMaxEffort && (
        <div role="alert" className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] leading-relaxed text-destructive">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{safetyWarning}</p>
        </div>
      )}

      {isGuidedLoad && (
        <div className="rounded-xl border border-border bg-secondary/20 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          {FATIGUE_DISCLAIMER}
        </div>
      )}

      <details className="rounded-xl border border-border bg-secondary/20 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        <summary className="cursor-pointer font-semibold text-foreground">O que são Powerbuilding e DUP?</summary>
        <p className="mt-2"><strong className="text-foreground">Powerbuilding:</strong> {POWERBUILDING_EXPLANATION}</p>
        <p className="mt-2"><strong className="text-foreground">DUP:</strong> {DUP_EXPLANATION}</p>
        <p className="mt-2">{sourceDisclaimer}</p>
      </details>
    </div>
  )
}
