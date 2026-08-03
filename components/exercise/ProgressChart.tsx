'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface DataPoint {
  date: string
  maxWeight: number
  totalVolume?: number
  maxReps?: number
}

interface ProgressChartProps {
  data: DataPoint[]
}

type Metric = 'weight' | 'volume' | 'reps'

const METRICS: { key: Metric; label: string; unit: string; dataKey: string }[] = [
  { key: 'weight', label: 'Peso', unit: 'kg', dataKey: 'maxWeight' },
  { key: 'volume', label: 'Volume', unit: 'kg', dataKey: 'totalVolume' },
  { key: 'reps', label: 'Reps', unit: '', dataKey: 'maxReps' },
]

export function ProgressChart({ data }: ProgressChartProps) {
  const [metric, setMetric] = useState<Metric>('weight')

  if (data.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
        Treine pelo menos 2 vezes para ver o gráfico de progresso.
      </div>
    )
  }

  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(d.date), 'd MMM', { locale: ptBR }),
  }))

  const active = METRICS.find((m) => m.key === metric)!

  return (
    <div className="space-y-3">
      {/* Tab selector */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
              metric === m.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'oklch(0.55 0 0)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'oklch(0.55 0 0)' }}
              axisLine={false}
              tickLine={false}
              unit={active.unit}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'oklch(0.14 0.003 286)',
                border: '1px solid oklch(1 0 0 / 10%)',
                borderRadius: '8px',
                fontSize: 12,
              }}
              labelStyle={{ color: 'oklch(0.97 0 0)', marginBottom: 4 }}
              itemStyle={{ color: 'oklch(0.841 0.238 128.85)' }}
              formatter={(v) => [
                `${typeof v === 'number' ? (active.unit ? `${v}${active.unit}` : v) : v}`,
                active.label,
              ]}
            />
            <Line
              type="monotone"
              dataKey={active.dataKey}
              stroke="oklch(0.841 0.238 128.85)"
              strokeWidth={2.5}
              dot={{ fill: 'oklch(0.841 0.238 128.85)', r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
