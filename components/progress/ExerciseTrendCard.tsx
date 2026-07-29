'use client'

import { useState } from 'react'
import { TrendingUp, Minus, AlertTriangle, HelpCircle, BatteryLow, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrendResult, TrendState, TrendWindow } from '@/lib/progression/trend'
import { formatLoadValue, type LoadInputConfig } from '@/lib/training/load-input'

const STATE_STYLE: Record<TrendState, { icon: typeof TrendingUp; className: string }> = {
  evoluindo: { icon: TrendingUp, className: 'text-primary' },
  estavel: { icon: Minus, className: 'text-muted-foreground' },
  dados_insuficientes: { icon: HelpCircle, className: 'text-muted-foreground' },
  possivel_estagnacao: { icon: AlertTriangle, className: 'text-amber-500' },
  recuperacao_prejudicada: { icon: BatteryLow, className: 'text-amber-500' },
  tecnica_inconsistente: { icon: Wrench, className: 'text-amber-500' },
}

const WINDOWS: TrendWindow[] = [4, 6, 8]

/**
 * Tendência do exercício em janela móvel. A janela é lente de observação:
 * o card não sugere trocar exercício por tempo decorrido.
 */
export function ExerciseTrendCard({
  trends,
  loadConfig,
}: {
  trends: Record<TrendWindow, TrendResult>
  loadConfig?: LoadInputConfig
}) {
  const [window, setWindow] = useState<TrendWindow>(8)
  const trend = trends[window]
  const style = STATE_STYLE[trend.state]
  const Icon = style.icon

  return (
    <section className="surface-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Tendência</h2>
        <div role="group" aria-label="Janela de análise" className="flex gap-1">
          {WINDOWS.map((weeks) => (
            <button
              key={weeks}
              type="button"
              onClick={() => setWindow(weeks)}
              aria-pressed={window === weeks}
              className={cn(
                'min-h-9 min-w-11 rounded-lg px-2 text-[11px] font-bold transition-colors',
                window === weeks
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-input text-muted-foreground'
              )}
            >
              {weeks}s
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2">
        <Icon className={cn('mt-0.5 size-4 shrink-0', style.className)} aria-hidden="true" />
        <div className="min-w-0">
          <p className={cn('text-sm font-bold', style.className)}>{trend.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{trend.reason}</p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Sessões</dt>
          <dd className="font-mono font-semibold tabular-nums">
            {trend.consistency.logged}
            <span className="text-muted-foreground">/{trend.consistency.expected}</span>
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Carga</dt>
          <dd className="font-mono font-semibold tabular-nums">
            {trend.weightChangePct == null
              ? '—'
              : `${trend.weightChangePct >= 0 ? '+' : ''}${Math.round(trend.weightChangePct * 100)}%`}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Repetições</dt>
          <dd className="font-mono font-semibold tabular-nums">
            {trend.repsChange == null
              ? '—'
              : `${trend.repsChange > 0 ? '+' : ''}${trend.repsChange}`}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Melhor série</dt>
          <dd className="font-mono font-semibold tabular-nums">
            {trend.bestSet
              ? `${trend.bestSet.weight != null && loadConfig ? formatLoadValue(trend.bestSet.weight, loadConfig) : trend.bestSet.weight ?? '—'} × ${trend.bestSet.reps}`
              : '—'}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground/80">
        A janela serve para observar tendência, não para obrigar troca de exercício.
        Estagnação não é diagnosticada por um treino isolado.
      </p>
    </section>
  )
}
