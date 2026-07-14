import { History, Sparkles } from 'lucide-react'
import {
  formatLoadValue,
  type LoadInputConfig,
} from '@/lib/training/load-input'

interface PreviousSet {
  weight_kg: number | null
  reps: number
  rir: number | null
  is_warmup: boolean
}

interface PreviousPerformanceSummaryProps {
  sets: PreviousSet[]
  bestWeight: number | null
  loadConfig: LoadInputConfig
}

export function PreviousPerformanceSummary({
  sets,
  bestWeight,
  loadConfig,
}: PreviousPerformanceSummaryProps) {
  const workSets = sets.filter((set) => !set.is_warmup)
  if (workSets.length === 0) {
    return (
      <div className="flex min-h-12 items-center gap-2 rounded-xl bg-secondary/40 px-3 text-xs text-muted-foreground">
        <History className="size-4" /> Primeira sessão registrada deste exercício.
      </div>
    )
  }

  const firstLoad = workSets.find((set) => set.weight_kg != null)?.weight_kg ?? null
  const sameLoad = workSets.every((set) => set.weight_kg === firstLoad)
  const reps = workSets.map((set) => set.reps).join(', ')
  const rirValues = workSets.map((set) => set.rir).filter((rir): rir is number => rir != null)
  const averageRir = rirValues.length > 0
    ? Math.round((rirValues.reduce((sum, value) => sum + value, 0) / rirValues.length) * 10) / 10
    : null
  const loadText = sameLoad
    ? formatLoadValue(firstLoad, loadConfig)
    : 'carga variada'

  return (
    <div className="rounded-xl bg-secondary/45 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <History className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-[#c7d0db]">
          <span className="font-bold text-foreground">Última vez:</span>{' '}
          {loadConfig.kind === 'assistance' ? 'assistência ' : ''}{loadText} · {reps} reps
          {averageRir != null ? ` · RIR médio ${averageRir}` : ''}
        </p>
      </div>
      {bestWeight != null && (
        <p className="mt-1 flex items-center gap-1.5 pl-6 text-[10px] text-muted-foreground">
          <Sparkles className="size-3 text-primary" />
          {loadConfig.kind === 'assistance' ? 'Menor assistência registrada' : 'Melhor carga registrada'}:{' '}
          <span className="font-bold text-foreground">{formatLoadValue(bestWeight, loadConfig)}</span>
        </p>
      )}
    </div>
  )
}
