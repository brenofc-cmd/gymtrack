'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface WeekdayFrequencyChartProps {
  data: Array<{ day: string; count: number }>
}

export function WeekdayFrequencyChart({ data }: WeekdayFrequencyChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: 'oklch(0.55 0 0)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 9, fill: 'oklch(0.55 0 0)' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={{
            backgroundColor: 'oklch(0.14 0.003 286)',
            border: '1px solid oklch(1 0 0 / 10%)',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: 'oklch(0.97 0 0)', marginBottom: 4 }}
          itemStyle={{ color: 'oklch(0.841 0.238 128.85)' }}
          formatter={(v) => {
            const n = typeof v === 'number' ? v : 0
            return [`${n} ${n === 1 ? 'treino' : 'treinos'}`, '']
          }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.count === 0
                  ? 'oklch(0.27 0 0)'
                  : entry.count === maxCount
                  ? 'oklch(0.841 0.238 128.85)'
                  : 'oklch(0.841 0.238 128.85 / 60%)'
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
