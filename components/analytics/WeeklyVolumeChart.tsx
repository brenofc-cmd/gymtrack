'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'
import { formatVolume } from '@/lib/utils/volume'

interface WeeklyVolumeChartProps {
  data: Array<{ week: string; volumeKg: number }>
}

export function WeeklyVolumeChart({ data }: WeeklyVolumeChartProps) {
  const maxVolume = Math.max(...data.map((d) => d.volumeKg), 1)

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.05)"
          vertical={false}
        />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 9, fill: 'oklch(0.55 0 0)' }}
          axisLine={false}
          tickLine={false}
          interval={1}
        />
        <YAxis
          tick={{ fontSize: 9, fill: 'oklch(0.55 0 0)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}t` : `${v}`
          }
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
          formatter={(v) => [formatVolume(typeof v === 'number' ? v : 0), 'Volume']}
        />
        <Bar dataKey="volumeKg" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.volumeKg === 0
                  ? 'oklch(0.27 0 0)'
                  : entry.volumeKg === maxVolume
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
