const MUSCLE_LABELS: Record<string, string> = {
  peito: 'Peitoral',
  ombro: 'Ombro',
  'tríceps': 'Tríceps',
  'bíceps': 'Bíceps',
  costas: 'Costas',
  'quadríceps': 'Quadríceps',
  isquiotibiais: 'Isquiotibiais',
  panturrilha: 'Panturrilha',
  'abdômen': 'Abdômen',
  glúteos: 'Glúteos',
  trapézio: 'Trapézio',
  antebraço: 'Antebraço',
}

// Cor por grupo muscular
const MUSCLE_COLORS: Record<string, string> = {
  peito: 'bg-blue-500',
  costas: 'bg-green-500',
  ombro: 'bg-purple-500',
  'bíceps': 'bg-amber-500',
  'tríceps': 'bg-orange-500',
  'quadríceps': 'bg-red-500',
  isquiotibiais: 'bg-pink-500',
  glúteos: 'bg-rose-500',
  'abdômen': 'bg-cyan-500',
  panturrilha: 'bg-teal-500',
  trapézio: 'bg-indigo-500',
  antebraço: 'bg-yellow-500',
}

interface MuscleDistributionProps {
  data: Array<{ muscle: string; sets: number; pct: number }>
}

export function MuscleDistribution({ data }: MuscleDistributionProps) {
  if (data.length === 0) return null

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <h2 className="text-sm font-semibold">Grupos musculares esta semana</h2>
      <div className="space-y-2.5">
        {data.map(({ muscle, sets, pct }) => {
          const label = MUSCLE_LABELS[muscle] ?? muscle
          const color = MUSCLE_COLORS[muscle] ?? 'bg-primary'
          return (
            <div key={muscle} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground">{sets} {sets === 1 ? 'série' : 'séries'} · {pct}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
