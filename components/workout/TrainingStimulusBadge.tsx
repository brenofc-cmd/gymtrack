import {
  classifyExerciseStimulus,
  TRAINING_STIMULUS_LABEL,
} from '@/lib/training/stimulus'
import { cn } from '@/lib/utils'

export function TrainingStimulusBadge({
  exercise,
}: {
  exercise: {
    prescription_type?: string | null
    target_reps_min: number
    target_reps_max: number
    exercise_type?: string | null
  }
}) {
  const stimulus = classifyExerciseStimulus(exercise)
  return (
    <span
      role="note"
      aria-label={`Tipo de estímulo: ${TRAINING_STIMULUS_LABEL[stimulus]}`}
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide',
        stimulus === 'max_strength' && 'border-[#ffb547]/30 bg-[#ffb547]/10 text-[#ffcf7a]',
        stimulus === 'strength' && 'border-[#5ba8ff]/30 bg-[#5ba8ff]/10 text-[#8dc5ff]',
        stimulus === 'hypertrophy' && 'border-primary/25 bg-primary/10 text-primary'
      )}
    >
      {TRAINING_STIMULUS_LABEL[stimulus]}
    </span>
  )
}
