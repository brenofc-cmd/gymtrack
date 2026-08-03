'use client'

import { useState } from 'react'
import { LayoutGrid, Rows3 } from 'lucide-react'
import { ExerciseListItem } from '@/components/workout/ExerciseListItem'
import type { WorkoutExerciseWithExercise } from '@/types/database'

interface ExerciseListViewProps {
  items: Array<{
    workoutExercise: WorkoutExerciseWithExercise
    lastWeight: number | null
    lastReps: number | null
    detailHref: string
  }>
  totalSets: number
}

export function ExerciseListView({ items, totalSets }: ExerciseListViewProps) {
  const [detailed, setDetailed] = useState(true)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-muted-foreground">
          {items.length} exercícios · {totalSets} séries válidas
        </p>
        <button
          type="button"
          onClick={() => setDetailed((v) => !v)}
          aria-label={detailed ? 'Ver em modo compacto' : 'Ver em modo detalhado'}
          aria-pressed={detailed}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          {detailed ? <Rows3 className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
        </button>
      </div>

      <div className="space-y-2">
        {items.map(({ workoutExercise, lastWeight, lastReps, detailHref }) => (
          <ExerciseListItem
            key={workoutExercise.id}
            workoutExercise={workoutExercise}
            lastWeight={lastWeight}
            lastReps={lastReps}
            detailHref={detailHref}
            detailed={detailed}
          />
        ))}
      </div>
    </div>
  )
}
