import Link from 'next/link'
import { ChevronRight, Zap } from 'lucide-react'
import type { Workout, WorkoutLetter } from '@/types/database'

interface WorkoutSuggestionProps {
  letter: WorkoutLetter
  workout: Workout | null
}

export function WorkoutSuggestion({ letter, workout }: WorkoutSuggestionProps) {
  return (
    <div className="rounded-2xl bg-primary/10 border border-primary/20 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" fill="currentColor" />
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Sugerido para hoje
        </span>
      </div>
      <div>
        <p className="text-xl font-bold">
          Treino {letter}
          {workout && (
            <span className="text-base font-normal text-muted-foreground ml-2">
              — {workout.name}
            </span>
          )}
        </p>
      </div>
      <Link
        href={`/treino/${letter}`}
        className="flex items-center justify-center gap-2 w-full h-12 rounded-lg bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-colors"
      >
        Começar Treino {letter}
        <ChevronRight className="w-5 h-5" />
      </Link>
    </div>
  )
}
