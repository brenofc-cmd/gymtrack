import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Workout, WorkoutLetter } from '@/types/database'

interface WorkoutSuggestionProps {
  letter: WorkoutLetter
  workout: Workout | null
  exerciseCount?: number
  lastTrainedDate?: string | null
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

export function WorkoutSuggestion({
  letter,
  workout,
  exerciseCount,
  lastTrainedDate,
}: WorkoutSuggestionProps) {
  const days = lastTrainedDate != null ? daysSince(lastTrainedDate) : null
  const hasStrip = exerciseCount != null || days != null

  return (
    <div className="relative rounded-2xl bg-card border border-border overflow-hidden">
      {/* Giant decorative letter bleed */}
      <div
        aria-hidden
        className="absolute -top-7 -right-3 text-[200px] font-black leading-none text-primary/[0.07] pointer-events-none select-none tracking-tighter"
      >
        {letter}
      </div>

      <div className="relative p-5">
        {/* Label */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
            Treino de hoje
          </span>
        </div>

        {/* Title */}
        <p className="text-xs text-muted-foreground mb-1">Treino {letter}</p>
        <h2 className="text-[26px] font-bold leading-[1.05] tracking-tight max-w-[72%] mb-4">
          {workout?.name ?? 'Treino do dia'}
        </h2>

        {/* Meta strip */}
        {hasStrip && (
          <div className="flex items-center gap-4 mb-5">
            {exerciseCount != null && (
              <>
                <div>
                  <p className="text-lg font-bold tabular-nums font-mono leading-none">
                    {exerciseCount}
                  </p>
                  <p className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground mt-0.5">
                    exercícios
                  </p>
                </div>
                {days != null && (
                  <span className="w-px h-5 bg-border shrink-0" />
                )}
              </>
            )}
            {days != null && (
              <div>
                <p className="text-lg font-bold tabular-nums font-mono leading-none">
                  {days}
                  <span className="text-xs font-normal text-muted-foreground ml-0.5">d</span>
                </p>
                <p className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground mt-0.5">
                  último
                </p>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/treino/${letter}?from=dashboard`}
          className="flex items-center justify-center gap-2 w-full h-14 rounded-xl bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          Iniciar Treino {letter}
          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  )
}
