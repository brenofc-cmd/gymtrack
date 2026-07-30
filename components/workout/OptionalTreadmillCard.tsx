import { Footprints, Gauge, Timer } from 'lucide-react'
import { ExerciseAnimation } from '@/components/exercise/ExerciseAnimation'
import { OPTIONAL_TREADMILL_FINISHERS } from '@/lib/training/conditioning'
import type { WorkoutLetter } from '@/types/database'

export function OptionalTreadmillCard({
  workoutLetter,
  compact = false,
}: {
  workoutLetter: WorkoutLetter
  compact?: boolean
}) {
  const finisher = OPTIONAL_TREADMILL_FINISHERS[workoutLetter]
  if (!finisher) return null

  return (
    <section className="overflow-hidden rounded-2xl border border-[#62dc91]/25 bg-[#62dc91]/5">
      <div className="flex items-stretch">
        <div className={compact ? 'w-24 shrink-0' : 'w-28 shrink-0'}>
          <ExerciseAnimation
            name="Caminhada na esteira"
            primaryMuscle="full body"
            movementPattern="cardio"
            mediaUrl="/exercises/Walking_Treadmill.jpg"
            compact
          />
        </div>
        <div className="min-w-0 flex-1 p-3">
          <div className="flex items-center gap-2">
            <Footprints className="size-4 text-[#62dc91]" />
            <h2 className="text-sm font-extrabold">Esteira opcional</h2>
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#62dc91]">
            Complemento GymTrack · após a musculação
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Timer className="size-3" />{finisher.minutes}</span>
            <span className="inline-flex items-center gap-1"><Gauge className="size-3" />{finisher.intensity}</span>
          </div>
          {!compact && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{finisher.guidance}</p>}
        </div>
      </div>
      <p className="border-t border-[#62dc91]/15 px-3 py-2 text-[10px] text-muted-foreground">
        Opcional e sempre por último. Pule se o tempo estiver acabando ou se prejudicar a recuperação.
      </p>
    </section>
  )
}
