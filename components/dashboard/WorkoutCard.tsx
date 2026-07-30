import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight } from 'lucide-react'
import { DIA_LABEL } from '@/lib/routine/david-laid-public-dup-v5'
import type { Workout, WorkoutLetter } from '@/types/database'

interface WorkoutCardProps {
  workout: Workout
  lastSessionDate: string | null
}

const LETTER_COLORS: Record<WorkoutLetter, string> = {
  A: 'text-lime-400 bg-lime-400/10 border-lime-400/20',
  B: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  C: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  D: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  E: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  F: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
}

export function WorkoutCard({ workout, lastSessionDate }: WorkoutCardProps) {
  const colorClass = LETTER_COLORS[workout.letter as WorkoutLetter] ?? LETTER_COLORS.A
  const dayLabel =
    workout.day_of_week != null ? DIA_LABEL[workout.day_of_week] : null

  return (
    <Link
      href={`/treino/${workout.letter}?from=dashboard`}
      className="flex items-center gap-3 rounded-xl bg-card border border-border p-4 transition-colors hover:bg-card/80 active:scale-[0.98]"
    >
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-lg border font-bold text-lg shrink-0 ${colorClass}`}
      >
        {workout.letter}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">
          {workout.name}
          {dayLabel && (
            <span className="text-muted-foreground font-normal"> · {dayLabel}</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {lastSessionDate
            ? `Última: ${formatDistanceToNow(new Date(lastSessionDate), {
                addSuffix: true,
                locale: ptBR,
              })}`
            : 'Nunca treinado'}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </Link>
  )
}
