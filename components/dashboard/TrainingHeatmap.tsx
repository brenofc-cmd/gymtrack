'use client'

import { useState, useMemo } from 'react'
import { format, startOfWeek, addDays, subWeeks, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface TrainingDay {
  date: string
  workoutName: string | null
}

interface TrainingHeatmapProps {
  trainingDays: TrainingDay[]
  weeks?: number
}

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export function TrainingHeatmap({ trainingDays, weeks = 16 }: TrainingHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ date: Date; trained: boolean; workoutName: string | null } | null>(null)

  const today = useMemo(() => new Date(), [])

  const trainedSet = useMemo(
    () => new Map(trainingDays.map((d) => [d.date, d.workoutName])),
    [trainingDays]
  )

  // Gera grade de semanas — começa no domingo da semana mais antiga
  const grid = useMemo(() => {
    const endSunday = startOfWeek(today, { weekStartsOn: 0 })
    const startSunday = subWeeks(endSunday, weeks - 1)
    const result: Date[][] = []
    for (let w = 0; w < weeks; w++) {
      const week: Date[] = []
      for (let d = 0; d < 7; d++) {
        week.push(addDays(startSunday, w * 7 + d))
      }
      result.push(week)
    }
    return result
  }, [today, weeks])

  // Labels dos meses nas semanas onde o mês muda
  const monthLabels: { weekIndex: number; label: string }[] = []
  grid.forEach((week, i) => {
    const firstDay = week[0]
    if (i === 0 || firstDay.getDate() <= 7) {
      const label = format(firstDay, 'MMM', { locale: ptBR })
      if (monthLabels.length === 0 || monthLabels[monthLabels.length - 1].label !== label) {
        monthLabels.push({ weekIndex: i, label })
      }
    }
  })

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <h2 className="text-sm font-semibold">Frequência de treinos</h2>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1 min-w-0">
          {/* Labels dos meses */}
          <div className="flex gap-1 pl-5">
            {grid.map((_, i) => {
              const label = monthLabels.find((m) => m.weekIndex === i)
              return (
                <div key={i} className="w-3.5 shrink-0 text-[9px] text-muted-foreground capitalize">
                  {label?.label ?? ''}
                </div>
              )
            })}
          </div>

          {/* Grade: linhas = dias da semana, colunas = semanas */}
          <div className="flex gap-1">
            {/* Labels dos dias */}
            <div className="flex flex-col gap-1 mr-1">
              {WEEK_DAYS.map((d, i) => (
                <div key={i} className="w-3.5 h-3.5 text-[9px] text-muted-foreground flex items-center justify-center">
                  {i % 2 === 1 ? d : ''}
                </div>
              ))}
            </div>

            {/* Células */}
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => {
                  const dateStr = day.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
                  const trained = trainedSet.has(dateStr)
                  const isFuture = day > today
                  const isToday = isSameDay(day, today)

                  return (
                    <div
                      key={di}
                      onMouseEnter={() => !isFuture && setTooltip({ date: day, trained, workoutName: trainedSet.get(dateStr) ?? null })}
                      onMouseLeave={() => setTooltip(null)}
                      className={cn(
                        'w-3.5 h-3.5 rounded-sm transition-colors',
                        isFuture
                          ? 'bg-transparent'
                          : trained
                          ? 'bg-primary'
                          : 'bg-zinc-800',
                        isToday && !trained && 'ring-1 ring-primary/50',
                      )}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <p className="text-xs text-muted-foreground">
          {format(tooltip.date, "d 'de' MMMM", { locale: ptBR })}
          {' — '}
          {tooltip.trained
            ? <span className="text-primary font-medium">{tooltip.workoutName ?? 'Treino realizado'}</span>
            : 'Sem treino'}
        </p>
      )}

      {/* Legenda */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Menos</span>
        <div className="w-3.5 h-3.5 rounded-sm bg-zinc-800" />
        <div className="w-3.5 h-3.5 rounded-sm bg-primary/40" />
        <div className="w-3.5 h-3.5 rounded-sm bg-primary" />
        <span>Mais</span>
      </div>
    </div>
  )
}
