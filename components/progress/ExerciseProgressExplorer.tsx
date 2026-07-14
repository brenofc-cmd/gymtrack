'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowUpRight, Trophy } from 'lucide-react'
import { ProgressChart } from '@/components/exercise/ProgressChart'
import type { ExerciseProgressSummary } from '@/lib/queries/progress'

interface ExerciseProgressExplorerProps {
  exercises: ExerciseProgressSummary[]
}

export function ExerciseProgressExplorer({ exercises }: ExerciseProgressExplorerProps) {
  const [exerciseId, setExerciseId] = useState(exercises[0]?.exerciseId ?? '')
  const selected = exercises.find((exercise) => exercise.exerciseId === exerciseId) ?? exercises[0]

  if (!selected) {
    return (
      <div className="surface-card px-5 py-10 text-center">
        <Trophy className="mx-auto size-7 text-muted-foreground" />
        <p className="mt-3 text-sm font-semibold">O progresso aparecerá após o primeiro treino concluído.</p>
        <p className="mt-1 text-xs text-muted-foreground">Peso, volume, repetições e 1RM estimado serão calculados automaticamente.</p>
      </div>
    )
  }

  return (
    <section className="surface-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold">Progresso por exercício</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Até 12 sessões recentes</p>
        </div>
        <Link href={`/exercicios/${selected.exerciseId}`} className="flex items-center gap-1 text-xs font-semibold text-primary">
          Detalhes <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      <label htmlFor="progress-exercise" className="sr-only">Selecionar exercício</label>
      <select
        id="progress-exercise"
        value={selected.exerciseId}
        onChange={(event) => setExerciseId(event.target.value)}
        className="mt-3 h-11 w-full rounded-xl border border-input bg-secondary px-3 text-sm font-semibold outline-none focus:border-primary"
      >
        {exercises.map((exercise) => (
          <option key={exercise.exerciseId} value={exercise.exerciseId}>
            {exercise.name}
          </option>
        ))}
      </select>

      <div className="my-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-secondary/60 p-3">
          <p className="metric-label">Carga máxima</p>
          <p className="mt-1 font-mono text-lg font-bold">{selected.maxWeight ?? '—'}<span className="text-[10px] font-normal text-muted-foreground"> kg</span></p>
        </div>
        <div className="rounded-xl bg-secondary/60 p-3">
          <p className="metric-label">1RM estimado</p>
          <p className="mt-1 font-mono text-lg font-bold">{selected.estimated1RM ?? '—'}<span className="text-[10px] font-normal text-muted-foreground"> kg</span></p>
        </div>
        <div className="rounded-xl bg-secondary/60 p-3">
          <p className="metric-label">Máx. reps</p>
          <p className="mt-1 font-mono text-lg font-bold">{selected.maxReps || '—'}</p>
        </div>
      </div>
      <ProgressChart data={selected.history} />
    </section>
  )
}
