'use client'

import { useState } from 'react'
import { ChevronDown, BarChart3, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const MUSCLE_LABEL: Record<string, string> = {
  peito: 'Peitoral',
  costas: 'Costas e dorsais',
  ombros: 'Ombros',
  'deltoide anterior': 'Deltoide anterior',
  'deltoide lateral': 'Deltoide lateral',
  'deltoide posterior': 'Deltoide posterior',
  bíceps: 'Bíceps',
  braquial: 'Braquial',
  tríceps: 'Tríceps',
  quadríceps: 'Quadríceps',
  isquiotibiais: 'Posteriores de coxa',
  glúteos: 'Glúteos',
  panturrilha: 'Panturrilhas',
  abdômen: 'Abdômen',
  oblíquos: 'Oblíquos',
}

function formatSets(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',')
}

interface PlannedVolumeCardProps {
  /** Séries diretas planejadas por músculo, calculadas da ficha ATIVA no banco
   * (exercícios visíveis). null = falha na consulta (estado de erro, sem
   * fallback silencioso para a rotina estática). */
  planned: Record<string, number> | null
  /** Contribuição indireta estimada (0,5/série), exibida separada — nunca somada */
  indirect: Record<string, number> | null
  /** Séries válidas executadas na semana corrente */
  executed?: Record<string, number>
  /** Séries do Abdômen Diário na semana — sistema separado, nunca somado aqui */
  dailyCoreWeekSets?: number | null
}

/**
 * Volume semanal por músculo. Planejado vem do BANCO (workout_exercises
 * ativos e visíveis) — exercícios abdominais ocultados pela reconciliação do
 * Abdômen Diário não aparecem aqui; o abdômen tem seção própria abaixo.
 */
export function PlannedVolumeCard({
  planned,
  indirect,
  executed,
  dailyCoreWeekSets,
}: PlannedVolumeCardProps) {
  const [open, setOpen] = useState(false)

  const secondary = indirect ?? {}
  const extraMuscles = executed
    ? Object.keys(executed).filter((muscle) => !(muscle in (planned ?? {})))
    : []
  const entries = planned
    ? [
        ...Object.entries(planned).sort(([, a], [, b]) => b - a),
        ...extraMuscles.map((muscle) => [muscle, 0] as [string, number]),
      ]
    : []
  const max = Math.max(...entries.map(([, v]) => v), 1)

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 p-4 text-left min-h-11"
      >
        <BarChart3 className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-semibold flex-1">Volume semanal por músculo</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && planned == null && (
        <div className="flex items-start gap-2 px-4 pb-4 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <p>
            Não foi possível carregar a ficha ativa agora. Recarregue a página para
            tentar de novo — nenhum valor aproximado é exibido no lugar.
          </p>
        </div>
      )}
      {open && planned != null && (
        <div className="px-4 pb-4 space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
            <span className="w-28 shrink-0" />
            <span className="flex-1" />
            {executed && <span className="w-9 text-right text-primary">Feitas</span>}
            <span className="w-9 text-right">Diretas</span>
            <span className="w-9 text-right">Indir.</span>
          </div>
          {entries.map(([muscle, sets]) => {
            const done = executed?.[muscle] ?? 0
            const indirectSets = secondary[muscle] ?? 0
            return (
              <div key={muscle} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">
                  {MUSCLE_LABEL[muscle] ?? muscle}
                </span>
                <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden relative">
                  <div
                    className="h-full bg-primary/30 rounded-full"
                    style={{ width: `${(sets / max) * 100}%` }}
                  />
                  {executed && done > 0 && (
                    <div
                      className="absolute inset-y-0 left-0 bg-primary rounded-full"
                      style={{ width: `${(Math.min(done, max) / max) * 100}%` }}
                    />
                  )}
                </div>
                {executed && (
                  <span className="w-9 text-right text-xs font-mono font-semibold tabular-nums text-primary">
                    {formatSets(done)}
                  </span>
                )}
                <span className="w-9 text-right text-xs font-mono font-semibold tabular-nums">
                  {formatSets(sets)}
                </span>
                <span className="w-9 text-right text-[11px] font-mono tabular-nums text-muted-foreground">
                  {indirectSets > 0 ? `+${formatSets(indirectSets)}` : '—'}
                </span>
              </div>
            )
          })}
          <p className="text-[10px] text-muted-foreground/80 pt-1">
            Planejado: séries diretas da sua ficha ativa (exercícios visíveis).
            Indiretas: participação secundária estimada (0,5/série), exibida em
            separado, nunca somada.
            {executed
              ? ' Feitas: séries válidas desta semana (aquecimento e séries com dor moderada/forte não contam).'
              : ''}
          </p>
          <p className="text-[10px] text-muted-foreground/80">
            Referência para grandes grupos: 10–15 séries diretas por músculo por semana.
          </p>
          <div className="mt-1 rounded-xl bg-secondary/50 px-3 py-2">
            <p className="text-[10px] font-semibold text-foreground">Abdômen Diário (sistema separado)</p>
            <p className="text-[10px] text-muted-foreground">
              O abdômen sai da ficha principal e é treinado nas sessões matinais.
              {typeof dailyCoreWeekSets === 'number'
                ? ` Nesta semana: ${dailyCoreWeekSets} série${dailyCoreWeekSets === 1 ? '' : 's'} registradas lá.`
                : ''}{' '}
              Esses números não são somados ao painel acima.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
